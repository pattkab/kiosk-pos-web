/** Parse Yo Instant Payment Notification payloads (form posts or query strings). */
export function parseYoIpnPayload(
  source: Record<string, string | undefined>,
) {
  const externalReference =
    source.external_ref ??
    source.ExternalReference ??
    source.external_reference ??
    null;

  const transactionReference =
    source.transaction_reference ??
    source.TransactionReference ??
    source.yo_transaction_reference ??
    null;

  const networkReference =
    source.network_ref ??
    source.NetworkReference ??
    source.mno_transaction_reference ??
    null;

  const amount = source.amount ?? source.Amount ?? null;
  const msisdn = source.msisdn ?? source.MSISDN ?? source.phone ?? null;

  const failed =
    (source.failed ?? "").toLowerCase() === "true" ||
    (source.status ?? "").toLowerCase() === "failed";

  const failureReason =
    source.failure_reason ?? source.FailureReason ?? source.message ?? null;

  return {
    externalReference,
    transactionReference,
    networkReference,
    amount,
    msisdn,
    failed,
    failureReason,
  };
}
