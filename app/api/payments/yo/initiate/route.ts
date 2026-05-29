import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { initiateYoCollection } from "@/lib/payments/yo/service";
import type { YoCollectionMethod } from "@/lib/payments/yo/types";

const bodySchema = z.object({
  organizationId: z.string().uuid(),
  registerSessionId: z.string().uuid().optional().nullable(),
  amount: z.number().positive(),
  method: z.enum([
    "mtn_mobile_money",
    "airtel_money",
    "visa",
    "mastercard",
    "card",
  ]),
  payerPhone: z.string().optional().nullable(),
  narrative: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 });
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", parsed.data.organizationId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await initiateYoCollection({
    organizationId: parsed.data.organizationId,
    registerSessionId: parsed.data.registerSessionId,
    cashierId: profile.id,
    amount: parsed.data.amount,
    method: parsed.data.method as YoCollectionMethod,
    payerPhone: parsed.data.payerPhone,
    narrative: parsed.data.narrative,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
  }

  return NextResponse.json(result);
}
