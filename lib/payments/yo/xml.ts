/** Escape text for Yo Payments XML payloads. */
export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildYoRequestXml(
  fields: Record<string, string | number | boolean | null | undefined>,
) {
  const parts = [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<AutoCreate>",
    "<Request>",
  ];

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === "") continue;
    const serialized =
      typeof value === "boolean" ? (value ? "TRUE" : "FALSE") : String(value);
    parts.push(`<${key}>${escapeXml(serialized)}</${key}>`);
  }

  parts.push("</Request>", "</AutoCreate>");
  return parts.join("");
}

export function readXmlTag(xml: string, tag: string) {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(regex);
  return match?.[1]?.trim() ?? null;
}

export function parseYoResponseXml(xml: string) {
  return {
    status: readXmlTag(xml, "Status"),
    statusCode: readXmlTag(xml, "StatusCode"),
    statusMessage: readXmlTag(xml, "StatusMessage"),
    transactionReference: readXmlTag(xml, "TransactionReference"),
    transactionStatus: readXmlTag(xml, "TransactionStatus"),
    mnoTransactionReferenceId: readXmlTag(xml, "MNOTransactionReferenceId"),
    amount: readXmlTag(xml, "Amount"),
    currency: readXmlTag(xml, "Currency"),
    externalReference: readXmlTag(xml, "ExternalReference"),
    msisdn: readXmlTag(xml, "Msisdn"),
  };
}
