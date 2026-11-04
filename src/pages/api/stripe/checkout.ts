import type { APIRoute } from "astro";
import Stripe from "stripe";
import { isPaidPlan, planById } from "../../../content/plans.ts";
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
    if (!plan) return messageResponse(request, 400, "Unknown plan", "Choose Free, Gather, Celebrate, or Milestone.");

    const email = normalizeEmail(fields.email);
    if (email === "invalid") return messageResponse(request, 400, "Check the email", "Enter a valid email or leave it blank.");

    // TERMS ACCEPTANCE HOOK
    // When counsel approves, require a termsAccepted field on this request
    // and refuse to create a Checkout Session without it. Do not ship /terms,
    // /privacy, or /legal until then.

    // SIGNUP / BUILD FLOW HOOK
    // Checkout returns to /checkout/success, which links to /demo/event-type.
    // Replace that link with the real signup and build flow when it exists.

    const stripePlan = isPaidPlan(plan) ? plan.stripePlan : "starter";
    const stripe = new Stripe(config.stripeSecretKey);
    const session = await stripe.checkout.sessions.create(
      checkoutSessionParams({
        priceId: config.prices[stripePlan],
        plan: plan.id === "free" ? "free" : stripePlan,
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
