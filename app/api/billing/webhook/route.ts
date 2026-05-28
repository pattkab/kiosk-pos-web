import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createStripeClient } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { parsePlanId, type PlanId } from "@/lib/billing/plans";
import { inferPlanIdFromStripePriceId } from "@/lib/billing/stripe-prices";

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
      return "cancelled";
    default:
      return "cancelled";
  }
}

function planForStatus(status: string, planId: PlanId) {
  return status === "cancelled" ? "starter" : planId;
}

function getPlanFromSession(session: Stripe.Checkout.Session) {
  return parsePlanId(session.metadata?.planId);
}

function getPlanFromSubscription(
  subscription: Stripe.Subscription,
  fallbackPlan: PlanId | null = null,
) {
  const priceId = subscription.items.data[0]?.price.id ?? null;
  const pricePlan = inferPlanIdFromStripePriceId(priceId);
  if (pricePlan) return pricePlan;

  const metadataPlan = parsePlanId(subscription.metadata?.planId);
  if (metadataPlan) return metadataPlan;

  return fallbackPlan ?? "starter";
}

function billingCycleFromSubscription(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price.recurring?.interval === "year"
    ? "yearly"
    : "monthly";
}

export async function POST(request: Request) {
  try {
    const stripe = createStripeClient();
    const signature = (await headers()).get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { ok: false, error: "Missing webhook configuration." },
        { status: 400 },
      );
    }

    const body = await request.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret,
    );
    const admin = createAdminClient();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organizationId;
      if (organizationId && typeof session.subscription === "string") {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription,
        );
        const normalizedStatus = normalizeSubscriptionStatus(
          subscription.status,
        );
        const planId = getPlanFromSubscription(
          subscription,
          getPlanFromSession(session),
        );
        await admin.from("organization_settings").upsert(
          {
            organization_id: organizationId,
            stripe_customer_id:
              typeof session.customer === "string" ? session.customer : null,
            stripe_subscription_id: subscription.id,
            plan: planForStatus(normalizedStatus, planId),
            subscription_plan: planForStatus(normalizedStatus, planId),
            subscription_status: normalizedStatus,
            billing_cycle:
              session.metadata?.billingInterval === "year"
                ? "yearly"
                : "monthly",
          },
          { onConflict: "organization_id" },
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
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;
      const normalizedStatus = normalizeSubscriptionStatus(subscription.status);
      const planId = getPlanFromSubscription(subscription);
      const update = {
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        subscription_status: normalizedStatus,
        plan: planForStatus(normalizedStatus, planId),
        subscription_plan: planForStatus(normalizedStatus, planId),
        billing_cycle: billingCycleFromSubscription(subscription),
      };
      const organizationId = subscription.metadata?.organizationId;

      if (organizationId) {
        await admin.from("organization_settings").upsert(
          {
            organization_id: organizationId,
            ...update,
          },
          { onConflict: "organization_id" },
        );
      } else {
        await admin
          .from("organization_settings")
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: normalizedStatus,
            plan: planForStatus(normalizedStatus, planId),
            subscription_plan: planForStatus(normalizedStatus, planId),
          })
          .eq("stripe_customer_id", customerId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Webhook handling failed.",
      },
      { status: 400 },
    );
  }
}
