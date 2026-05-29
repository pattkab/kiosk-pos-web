import { NextResponse } from "next/server";
import { isYoPaymentsConfigured } from "@/lib/payments/yo/config";

export async function GET() {
  const enabled = isYoPaymentsConfigured();
  return NextResponse.json({
    enabled,
    methods: enabled
      ? [
          { id: "mtn_mobile_money", label: "MTN MoMo" },
          { id: "airtel_money", label: "Airtel Money" },
          { id: "visa", label: "Visa" },
          { id: "mastercard", label: "Mastercard" },
        ]
      : [],
    currency: "UGX",
  });
}
