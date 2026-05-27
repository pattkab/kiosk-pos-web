import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createStripeClient } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizeSubscriptionStatus(status?: string | null) {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "inactive";
    default:
      return "inactive";
  }
}

export async function POST(request: Request) {
  try {
    const stripe = createStripeClient();
    const signature = (await headers()).get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!signature || !webhookSecret) {
      return NextResponse.json({ ok: false, error: "Missing webhook configuration." }, { status: 400 });
    }

    const body = await request.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    const admin = createAdminClient();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organizationId;
      if (organizationId) {
        await admin
          .from("organization_settings")
          .upsert(
            {
              organization_id: organizationId,
              stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
              stripe_subscription_id:
                typeof session.subscription === "string" ? session.subscription : null,
              subscription_plan: "pro",
              subscription_status: "active",
            },
            { onConflict: "organization_id" }
          );
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      await admin
        .from("organization_settings")
        .update({
          stripe_subscription_id: subscription.id,
          subscription_status: normalizeSubscriptionStatus(subscription.status),
          subscription_plan: normalizeSubscriptionStatus(subscription.status) === "active" ? "pro" : "starter",
        })
        .eq("stripe_customer_id", customerId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Webhook handling failed." },
      { status: 400 }
    );
  }
}
