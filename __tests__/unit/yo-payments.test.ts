import { describe, expect, it } from "vitest";
import {
  detectUgandaMobileNetwork,
  normalizeUgandaMsisdn,
} from "@/lib/payments/yo/phone";
import { buildYoRequestXml, escapeXml, readXmlTag } from "@/lib/payments/yo/xml";
import { parseYoIpnPayload } from "@/lib/payments/yo/ipn";
import { yoMethodLabel } from "@/lib/payments/yo/labels";

describe("Yo Payments helpers", () => {
  it("normalizes Uganda phone numbers", () => {
    expect(normalizeUgandaMsisdn("0772123456")).toBe("256772123456");
    expect(normalizeUgandaMsisdn("256772123456")).toBe("256772123456");
  });

  it("detects MTN vs Airtel prefixes", () => {
    expect(detectUgandaMobileNetwork("256772123456")).toBe("mtn");
    expect(detectUgandaMobileNetwork("256701234567")).toBe("airtel");
  });

  it("builds deposit XML with external reference", () => {
    const xml = buildYoRequestXml({
      Method: "acdepositfunds",
      Amount: 5000,
      Account: "256772123456",
      ExternalReference: "KPOS-TEST",
    });
    expect(xml).toContain("<Method>acdepositfunds</Method>");
    expect(readXmlTag(xml, "ExternalReference")).toBe("KPOS-TEST");
  });

  it("escapes XML special characters", () => {
    expect(escapeXml(`Tom & Jerry's "shop"`)).toBe(
      "Tom &amp; Jerry&apos;s &quot;shop&quot;",
    );
  });

  it("parses IPN payload fields", () => {
    const payload = parseYoIpnPayload({
      external_ref: "KPOS-123",
      transaction_reference: "YO-999",
      network_ref: "MM-1",
    });
    expect(payload.externalReference).toBe("KPOS-123");
    expect(payload.transactionReference).toBe("YO-999");
  });

  it("labels collection methods", () => {
    expect(yoMethodLabel("mtn_mobile_money")).toContain("MTN");
    expect(yoMethodLabel("visa")).toBe("Visa");
  });
});
