import Stripe from "stripe";

export function createStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }
  return new Stripe(apiKey, { apiVersion: "2026-04-22.dahlia" });
}
