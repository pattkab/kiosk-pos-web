import { NextRequest, NextResponse } from "next/server";
import { getBillingPaymentProvider } from "@/lib/billing/payment-provider";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { organizationId?: string };
    if (!body.organizationId) {
      return NextResponse.json(
        { ok: false, error: "organizationId is required." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized." },
        { status: 401 },
      );
    }

    const { data: canManage, error: permissionError } = await supabase.rpc(
      "has_org_permission",
      {
        p_organization_id: body.organizationId,
        p_permission: "settings.manage",
      },
    );
    if (permissionError || !canManage) {
      return NextResponse.json(
        { ok: false, error: "Permission denied." },
        { status: 403 },
      );
    }

    const { data: settings } = await supabase
      .from("organization_settings")
      .select("stripe_customer_id")
      .eq("organization_id", body.organizationId)
      .maybeSingle();

    const provider = getBillingPaymentProvider();
    const result = await provider.createPortalSession({
      organizationId: body.organizationId,
      customerId: settings?.stripe_customer_id ?? null,
    });

    return NextResponse.json(result, {
      status: result.ok ? 200 : (result.status ?? 501),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to open billing portal.",
      },
      { status: 500 },
    );
  }
}
