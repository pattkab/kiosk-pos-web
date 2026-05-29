"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { CheckoutPayment } from "@/types/pos";
import { Loader2, Smartphone, CreditCard, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  yoMethodLabel,
  yoMethodToPosPaymentMethod,
} from "@/lib/payments/yo/labels";
import type { YoCollectionMethod } from "@/lib/payments/yo/types";

type YoCollectionPanelProps = {
  method: YoCollectionMethod;
  amount: number;
  organizationId: string;
  registerSessionId?: string | null;
  onCollected: (payment: CheckoutPayment) => void;
  onCancel: () => void;
};

type CollectionState = {
  collectionId: string;
  status: string;
  message?: string;
  checkoutUrl?: string | null;
  yoTransactionReference?: string | null;
  externalReference?: string;
};

export function YoCollectionPanel({
  method,
  amount,
  organizationId,
  registerSessionId,
  onCollected,
  onCancel,
}: YoCollectionPanelProps) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [collection, setCollection] = useState<CollectionState | null>(null);

  useEffect(() => {
    setCollection(null);
    setPhone("");
  }, [method, amount]);

  const pollStatus = async (collectionId: string) => {
    const maxAttempts = 24;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`/api/payments/yo/status/${collectionId}`);
      if (!response.ok) break;
      const body = await response.json();
      const status = body.collection?.status as string;
      if (status === "completed") return body.collection;
      if (status === "failed" || status === "cancelled") {
        throw new Error(
          body.collection?.failure_reason ?? "Payment was not completed.",
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    throw new Error("Payment is still pending. Check the customer phone or try again.");
  };

  const startCollection = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/payments/yo/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          registerSessionId,
          amount,
          method,
          payerPhone: phone || null,
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Could not start Yo payment.");
      }

      setCollection({
        collectionId: body.collectionId,
        status: body.status,
        message: body.message,
        checkoutUrl: body.checkoutUrl,
        yoTransactionReference: body.yoTransactionReference,
        externalReference: body.externalReference,
      });

      if (body.checkoutUrl) {
        toast.message("Open card checkout for the customer.");
        return;
      }

      if (body.status === "completed") {
        finalizePayment(body);
        return;
      }

      toast.message(body.message ?? "Waiting for customer approval...");
      const finalCollection = await pollStatus(body.collectionId);
      finalizePayment({
        ...body,
        yoTransactionReference:
          finalCollection.yo_transaction_reference ?? body.yoTransactionReference,
        externalReference: finalCollection.external_reference ?? body.externalReference,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Yo payment failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const finalizePayment = (payload: {
    yoTransactionReference?: string | null;
    externalReference?: string;
  }) => {
    const reference =
      payload.yoTransactionReference ??
      payload.externalReference ??
      collection?.externalReference ??
      "";

    onCollected({
      id: crypto.randomUUID(),
      payment_method: yoMethodToPosPaymentMethod(method),
      amount,
      reference: `${yoMethodLabel(method)} · ${reference}`,
    });
    toast.success(`${yoMethodLabel(method)} payment recorded.`);
  };

  const confirmCardPaid = async () => {
    if (!collection?.collectionId) return;
    setBusy(true);
    try {
      const finalCollection = await pollStatus(collection.collectionId);
      finalizePayment({
        yoTransactionReference: finalCollection.yo_transaction_reference,
        externalReference: finalCollection.external_reference,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Payment not confirmed yet.",
      );
    } finally {
      setBusy(false);
    }
  };

  const needsPhone =
    method === "mtn_mobile_money" || method === "airtel_money";
  const isCard =
    method === "visa" || method === "mastercard" || method === "card";

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-primary">
          Yo Payments · {yoMethodLabel(method)}
        </p>
        <p className="mt-1 text-2xl font-black">{formatCurrency(amount)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {needsPhone
            ? "Customer approves on their phone (STK prompt)."
            : "Complete card payment, then confirm below."}
        </p>
      </div>

      {needsPhone && (
        <div className="space-y-2">
          <Label htmlFor="yo-phone">Customer mobile number</Label>
          <Input
            id="yo-phone"
            className="h-12 text-lg"
            placeholder="0772123456"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
      )}

      {collection?.checkoutUrl && (
        <Button asChild variant="outline" className="w-full">
          <a href={collection.checkoutUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open {yoMethodLabel(method)} checkout
          </a>
        </Button>
      )}

      {collection?.message && (
        <p className="text-sm text-muted-foreground">{collection.message}</p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={busy}
        >
          Back
        </Button>
        {!collection?.checkoutUrl ? (
          <Button
            type="button"
            className="flex-1 font-bold"
            disabled={busy || (needsPhone && !phone.trim())}
            onClick={startCollection}
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : needsPhone ? (
              <Smartphone className="mr-2 h-4 w-4" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            {needsPhone ? "Send payment request" : "Start card payment"}
          </Button>
        ) : (
          <Button
            type="button"
            className="flex-1 font-bold"
            disabled={busy}
            onClick={confirmCardPaid}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm paid
          </Button>
        )}
      </div>
    </div>
  );
}
