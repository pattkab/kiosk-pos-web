import { getYoPaymentsConfig } from "@/lib/payments/yo/config";
import { buildYoRequestXml, parseYoResponseXml } from "@/lib/payments/yo/xml";
import type { YoApiResponse } from "@/lib/payments/yo/types";

async function postYoXml(xml: string): Promise<string> {
  const { apiUrl, username, password } = getYoPaymentsConfig();

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
    },
    body: xml,
    cache: "no-store",
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `Yo Payments HTTP ${response.status}: ${text.slice(0, 240) || response.statusText}`,
    );
  }
  return text;
}

function toYoApiResponse(xml: string): YoApiResponse {
  const parsed = parseYoResponseXml(xml);
  return {
    status: parsed.status === "OK" ? "OK" : "ERROR",
    statusCode: parsed.statusCode ?? undefined,
    statusMessage: parsed.statusMessage ?? undefined,
    transactionReference: parsed.transactionReference ?? undefined,
    transactionStatus: parsed.transactionStatus ?? undefined,
    mnoTransactionReferenceId: parsed.mnoTransactionReferenceId ?? undefined,
    rawXml: xml,
  };
}

/** Pull funds from customer mobile money into your Yo merchant account (STK-style prompt). */
export async function yoDepositFunds(input: {
  amount: number;
  msisdn: string;
  narrative: string;
  externalReference: string;
  ipnUrl?: string;
}) {
  const xml = buildYoRequestXml({
    APIUsername: getYoPaymentsConfig().username,
    APIPassword: getYoPaymentsConfig().password,
    Method: "acdepositfunds",
    NonBlocking: true,
    Amount: Math.round(input.amount),
    Account: input.msisdn,
    Narrative: input.narrative,
    ExternalReference: input.externalReference,
    InstantNotificationUrl: input.ipnUrl ?? getYoPaymentsConfig().ipnUrl,
  });

  const responseXml = await postYoXml(xml);
  return toYoApiResponse(responseXml);
}

export async function yoCheckTransactionStatus(transactionReference: string) {
  const xml = buildYoRequestXml({
    APIUsername: getYoPaymentsConfig().username,
    APIPassword: getYoPaymentsConfig().password,
    Method: "actransactioncheckstatus",
    TransactionReference: transactionReference,
    PrivateTransactionReference: transactionReference,
  });

  const responseXml = await postYoXml(xml);
  return toYoApiResponse(responseXml);
}

export function buildCardCheckoutUrl(input: {
  amount: number;
  externalReference: string;
  returnUrl: string;
}) {
  const template = getYoPaymentsConfig().cardCheckoutUrlTemplate;
  if (!template) return null;

  return template
    .replaceAll("{amount}", String(Math.round(input.amount)))
    .replaceAll("{reference}", encodeURIComponent(input.externalReference))
    .replaceAll("{returnUrl}", encodeURIComponent(input.returnUrl));
}
