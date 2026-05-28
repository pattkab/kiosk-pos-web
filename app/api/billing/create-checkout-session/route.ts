import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createStripeClient } from "@/lib/stripe/client";
import { resolveRequestAppUrl } from "@/lib/app-url";

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
    if (!user)
      return NextResponse.json(
        { ok: false, error: "Unauthorized." },
        { status: 401 },
      );

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

    const [{ data: org }, { data: settings }, { data: profile }] =
      await Promise.all([
        supabase
          .from("organizations")
          .select("id, name")
          .eq("id", body.organizationId)
          .maybeSingle(),
        supabase
          .from("organization_settings")
          .select("stripe_customer_id")
          .eq("organization_id", body.organizationId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("email")
          .eq("auth_user_id", user.id)
          .maybeSingle(),
      ]);

    if (!org)
      return NextResponse.json(
        { ok: false, error: "Organization not found." },
        { status: 404 },
      );

    const stripe = createStripeClient();
    let customerId = settings?.stripe_customer_id ?? null;
    const customerEmail = profile?.email ?? user.email ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: customerEmail,
        name: org.name,
        metadata: { organizationId: org.id },
      });
      customerId = customer.id;
      await supabase.from("organization_settings").upsert(
        {
          organization_id: org.id,
          stripe_customer_id: customer.id,
          subscription_plan: "starter",
        },
        { onConflict: "organization_id" },
      );
    }

    const appUrl = resolveRequestAppUrl(request);
    const normalizedAppUrl = appUrl.replace(/\/$/, "");
    const priceId = process.env.STRIPE_PRICE_20_YEAR;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      allow_promotion_codes: true,
      client_reference_id: org.id,
      customer_update: {
        address: "auto",
        name: "auto",
      },
      line_items: priceId
        ? [{ price: priceId, quantity: 1 }]
        : [
            {
              quantity: 1,
              price_data: {
                currency: "usd",
                recurring: { interval: "year", interval_count: 1 },
                product_data: {
                  name: "Kiosk POS Pro",
                  description:
                    "Full team and operations access billed annually.",
                },
                unit_amount: 2000,
              },
            },
          ],
      metadata: { organizationId: org.id },
      subscription_data: {
        metadata: { organizationId: org.id },
      },
      success_url: `${normalizedAppUrl}/settings/billing?status=success`,
      cancel_url: `${normalizedAppUrl}/settings/billing?status=cancelled`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to start checkout.",
      },
      { status: 500 },
    );
  }
}
