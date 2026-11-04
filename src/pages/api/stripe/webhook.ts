import type { APIRoute } from "astro";
import Stripe from "stripe";
import { createBillingStore } from "../../../lib/billing-store.ts";
import {
  messageResponse,
  paymentsNotConfiguredResponse,
  processBillingEvent,
  readWebhookConfig,
  subscriptionRow,
  updatesFromEvent,
  type BillingUpdate,
} from "../../../lib/billing.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const config = readWebhookConfig();
  if (!config) return paymentsNotConfiguredResponse(request);

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing Stripe signature", { status: 400 });

  const raw = await request.text();
  const stripe = new Stripe(config.stripeSecretKey);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, config.webhookSecret);
  } catch (error) {
    console.error("stripe webhook signature failed", error instanceof Error ? error.message : "unknown");
    return new Response("Invalid Stripe signature", { status: 400 });
  }

  try {
    const updates = await updatesForWebhook(stripe, event, config.prices);
    const store = createBillingStore(config.supabaseUrl, config.supabaseServiceRoleKey);
    const result = await processBillingEvent(event.id, event.type, updates, store);
    return Response.json({ received: true, duplicate: result === "duplicate" });
  } catch (error) {
    console.error("stripe webhook processing failed", event.type, event.id, error instanceof Error ? error.message : "unknown");
    return messageResponse(request, 500, "Webhook failed", "The event could not be stored.");
  }
};

async function updatesForWebhook(
  stripe: Stripe,
  event: Stripe.Event,
  prices: { starter: string; pro: string; premium: string },
): Promise<BillingUpdate[]> {
  const updates = updatesFromEvent(event, prices);
  if (event.type !== "checkout.session.completed") return updates;
  const session = event.data.object as Stripe.Checkout.Session;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!subscriptionId) return updates;
  if (updates.some((update) => update.kind === "subscription")) return updates;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const row = subscriptionRow(subscription, prices);
  return row ? [...updates, { kind: "subscription", row }] : updates;
}
