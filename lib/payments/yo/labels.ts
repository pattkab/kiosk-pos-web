import { isCardMethod } from "@/lib/payments/yo/phone";
import type { YoCollectionMethod } from "@/lib/payments/yo/types";

export function yoMethodToPosPaymentMethod(
  method: YoCollectionMethod,
): "mobile_money" | "card" {
  return isCardMethod(method) ? "card" : "mobile_money";
}

export function yoMethodLabel(method: YoCollectionMethod) {
  switch (method) {
    case "mtn_mobile_money":
      return "MTN Mobile Money";
    case "airtel_money":
      return "Airtel Money";
    case "visa":
      return "Visa";
    case "mastercard":
      return "Mastercard";
    default:
      return "Card";
  }
}
