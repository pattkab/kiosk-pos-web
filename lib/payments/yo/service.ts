import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildCardCheckoutUrl,
  yoCheckTransactionStatus,
  yoDepositFunds,
} from "@/lib/payments/yo/client";
import { isYoPaymentsConfigured } from "@/lib/payments/yo/config";
import {
  detectUgandaMobileNetwork,
  isCardMethod,
  methodRequiresPhone,
  normalizeUgandaMsisdn,
} from "@/lib/payments/yo/phone";
import type {
  InitiateYoCollectionInput,
  InitiateYoCollectionResult,
  YoCollectionMethod,
  YoCollectionStatus,
} from "@/lib/payments/yo/types";

function externalReference() {
  return `KPOS-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

function mapTransactionStatus(
  transactionStatus?: string | null,
): YoCollectionStatus {
  const normalized = (transactionStatus ?? "").toUpperCase();
  if (normalized === "SUCCEEDED" || normalized === "SUCCESS") return "completed";
  if (normalized === "FAILED") return "failed";
  if (normalized === "PENDING" || normalized === "INPROGRESS") return "processing";
  return "processing";
}

export async function initiateYoCollection(
  input: InitiateYoCollectionInput,
): Promise<InitiateYoCollectionResult> {
  if (!isYoPaymentsConfigured()) {
    return {
      ok: false,
      status: 503,
      error:
        "Yo Payments is not configured on the server. Add API credentials to enable collections.",
    };
  }

  if (input.amount <= 0) {
    return { ok: false, status: 400, error: "Amount must be greater than zero." };
  }

  const admin = createAdminClient();
  const reference = externalReference();
  const narrative =
    input.narrative?.trim() ||
    `Kiosk POS sale ${reference.slice(-8).toUpperCase()}`;

  let payerPhone: string | null = null;
  if (methodRequiresPhone(input.method)) {
    payerPhone = input.payerPhone ? normalizeUgandaMsisdn(input.payerPhone) : null;
    if (!payerPhone) {
      return {
        ok: false,
        status: 400,
        error: "Enter a valid Uganda mobile number (e.g. 0772123456).",
      };
    }

    const detected = detectUgandaMobileNetwork(payerPhone);
    if (input.method === "mtn_mobile_money" && detected === "airtel") {
      return {
        ok: false,
        status: 400,
        error: "This number looks like Airtel Money. Switch to Airtel or use an MTN number.",
      };
    }
    if (input.method === "airtel_money" && detected === "mtn") {
      return {
        ok: false,
        status: 400,
        error: "This number looks like MTN Mobile Money. Switch to MTN or use an Airtel number.",
      };
    }
  }

  const { data: row, error: insertError } = await admin
    .from("payment_collections")
    .insert({
      organization_id: input.organizationId,
      register_session_id: input.registerSessionId ?? null,
      cashier_id: input.cashierId ?? null,
      amount: input.amount,
      currency: "UGX",
      method: input.method,
      status: "pending",
      payer_phone: payerPhone,
      narrative,
      external_reference: reference,
      metadata: {},
    })
    .select("id")
    .single();

  if (insertError || !row) {
    return {
      ok: false,
      status: 500,
      error: insertError?.message ?? "Could not create payment collection.",
    };
  }

  if (isCardMethod(input.method)) {
    const checkoutUrl = buildCardCheckoutUrl({
      amount: input.amount,
      externalReference: reference,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")}/pos?yo_ref=${encodeURIComponent(reference)}`,
    });

    if (!checkoutUrl) {
      await admin
        .from("payment_collections")
        .update({
          status: "failed",
          failure_reason:
            "Card checkout URL is not configured. Set YO_CARD_CHECKOUT_URL from your Yo merchant card setup.",
        })
        .eq("id", row.id);

      return {
        ok: false,
        status: 501,
        error:
          "Card collections need YO_CARD_CHECKOUT_URL from Yo Payments. Mobile money works with API credentials only.",
      };
    }

    await admin
      .from("payment_collections")
      .update({ status: "processing", metadata: { checkoutUrl } })
      .eq("id", row.id);

    return {
      ok: true,
      collectionId: row.id,
      externalReference: reference,
      status: "processing",
      checkoutUrl,
      message:
        input.method === "visa" || input.method === "mastercard"
          ? `Open ${input.method === "visa" ? "Visa" : "Mastercard"} checkout for the customer.`
          : "Open card checkout for the customer.",
    };
  }

  const deposit = await yoDepositFunds({
    amount: input.amount,
    msisdn: payerPhone!,
    narrative,
    externalReference: reference,
  });

  if (deposit.status !== "OK" || !deposit.transactionReference) {
    const failure =
      deposit.statusMessage ?? "Yo Payments could not start this collection.";

    await admin
      .from("payment_collections")
      .update({ status: "failed", failure_reason: failure })
      .eq("id", row.id);

    return { ok: false, status: 502, error: failure };
  }

  const mappedStatus = mapTransactionStatus(deposit.transactionStatus);

  await admin
    .from("payment_collections")
    .update({
      status: mappedStatus,
      yo_transaction_reference: deposit.transactionReference,
      network_reference: deposit.mnoTransactionReferenceId ?? null,
      completed_at: mappedStatus === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", row.id);

  const providerLabel =
    input.method === "mtn_mobile_money" ? "MTN Mobile Money" : "Airtel Money";

  return {
    ok: true,
    collectionId: row.id,
    externalReference: reference,
    status: mappedStatus,
    yoTransactionReference: deposit.transactionReference,
    message:
      mappedStatus === "completed"
        ? `${providerLabel} payment received.`
        : `Prompt sent on ${providerLabel}. Customer should approve on their phone.`,
  };
}

export async function refreshYoCollectionStatus(collectionId: string) {
  const admin = createAdminClient();
  const { data: collection, error } = await admin
    .from("payment_collections")
    .select("*")
    .eq("id", collectionId)
    .maybeSingle();

  if (error || !collection) {
    return { ok: false as const, error: "Collection not found." };
  }

  if (
    collection.status === "completed" ||
    collection.status === "failed" ||
    collection.status === "cancelled"
  ) {
    return { ok: true as const, collection };
  }

  if (!collection.yo_transaction_reference) {
    return { ok: true as const, collection };
  }

  if (!isYoPaymentsConfigured()) {
    return { ok: true as const, collection };
  }

  const statusResponse = await yoCheckTransactionStatus(
    collection.yo_transaction_reference,
  );

  if (statusResponse.status !== "OK") {
    return { ok: true as const, collection };
  }

  const mappedStatus = mapTransactionStatus(statusResponse.transactionStatus);

  const { data: updated } = await admin
    .from("payment_collections")
    .update({
      status: mappedStatus,
      network_reference:
        statusResponse.mnoTransactionReferenceId ?? collection.network_reference,
      failure_reason:
        mappedStatus === "failed"
          ? statusResponse.statusMessage ?? "Payment failed."
          : null,
      completed_at: mappedStatus === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", collectionId)
    .select("*")
    .single();

  return { ok: true as const, collection: updated ?? collection };
}

export async function completeYoCollectionFromIpn(payload: {
  externalReference?: string | null;
  transactionReference?: string | null;
  networkReference?: string | null;
  amount?: string | null;
  msisdn?: string | null;
  failed?: boolean;
  failureReason?: string | null;
}) {
  if (!payload.externalReference) return { ok: false, error: "Missing reference" };

  const admin = createAdminClient();
  const { data: collection } = await admin
    .from("payment_collections")
    .select("*")
    .eq("external_reference", payload.externalReference)
    .maybeSingle();

  if (!collection) return { ok: false, error: "Unknown collection" };

  const status: YoCollectionStatus = payload.failed ? "failed" : "completed";

  await admin
    .from("payment_collections")
    .update({
      status,
      yo_transaction_reference:
        payload.transactionReference ?? collection.yo_transaction_reference,
      network_reference: payload.networkReference ?? collection.network_reference,
      payer_phone: payload.msisdn ?? collection.payer_phone,
      failure_reason: payload.failed
        ? payload.failureReason ?? "Payment failed."
        : null,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", collection.id);

  return { ok: true, collectionId: collection.id };
}
