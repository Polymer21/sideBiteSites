import type { APIRoute } from "astro";
import Stripe from "stripe";
import { planById } from "../../../content/plans.ts";
import {
  checkoutSessionParams,
  messageResponse,
  normalizeEmail,
  paymentsNotConfiguredResponse,
  readCheckoutConfig,
  readRequestFields,
} from "../../../lib/billing.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const config = readCheckoutConfig();
    if (!config) return paymentsNotConfiguredResponse(request);

    const fields = await readRequestFields(request);
    const plan = planById(fields.plan);
    if (!plan) return messageResponse(request, 400, "Unknown plan", "Choose Gather, Celebrate, or Milestone.");

    const email = normalizeEmail(fields.email);
    if (email === "invalid") return messageResponse(request, 400, "Check the email", "Enter a valid email or leave it blank.");

    // TERMS ACCEPTANCE HOOK
    // When counsel approves, require a termsAccepted field on this request
    // and refuse to create a Checkout Session without it. Do not ship /terms,
    // /privacy, or /legal until then.

    const stripe = new Stripe(config.stripeSecretKey);
    const session = await stripe.checkout.sessions.create(
      checkoutSessionParams({
        priceId: config.prices[plan.stripePlan],
        plan: plan.stripePlan,
        siteUrl: config.siteUrl,
        email,
      }),
    );
    if (!session.url) return messageResponse(request, 502, "Checkout unavailable", "Stripe did not return a checkout URL.");
    return Response.redirect(session.url, 303);
  } catch (error) {
    console.error("stripe checkout failed", error instanceof Error ? error.message : "unknown");
    return messageResponse(request, 500, "Checkout failed", "Checkout could not be started.");
  }
};
