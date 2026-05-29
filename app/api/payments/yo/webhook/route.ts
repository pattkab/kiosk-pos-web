import { NextResponse } from "next/server";
import { parseYoIpnPayload } from "@/lib/payments/yo/ipn";
import { completeYoCollectionFromIpn } from "@/lib/payments/yo/service";

export async function POST(request: Request) {
  let fields: Record<string, string> = {};

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json = (await request.json()) as Record<string, string>;
    fields = Object.fromEntries(
      Object.entries(json).map(([key, value]) => [key, String(value)]),
    );
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    form.forEach((value, key) => {
      fields[key] = String(value);
    });
  } else {
    const text = await request.text();
    if (text.includes("=")) {
      const params = new URLSearchParams(text);
      params.forEach((value, key) => {
        fields[key] = value;
      });
    }
  }

  const payload = parseYoIpnPayload(fields);
  const result = await completeYoCollectionFromIpn(payload);

  if (!result.ok) {
    return NextResponse.json({ received: true, matched: false }, { status: 200 });
  }

  return NextResponse.json({
    received: true,
    matched: true,
    collectionId: result.collectionId,
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fields: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    fields[key] = value;
  });

  const payload = parseYoIpnPayload(fields);
  await completeYoCollectionFromIpn(payload);

  return NextResponse.json({ received: true });
}
