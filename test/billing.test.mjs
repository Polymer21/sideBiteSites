import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";
import {
  checkoutSessionParams,
  normalizeEmail,
  PAYMENTS_NOT_CONFIGURED,
  paymentsNotConfiguredResponse,
  planFromPriceId,
  processBillingEvent,
  readCheckoutConfig,
  readWebhookConfig,
  subscriptionRow,
  updatesFromEvent,
} from "../src/lib/billing.ts";
import { POST as checkoutPost } from "../src/pages/api/stripe/checkout.ts";

const prices = {
  starter: "price_starter",
  pro: "price_pro",
  premium: "price_premium",
};

function memoryStore() {
  const events = new Set();
  const applied = [];
  return {
    applied,
    async claimEvent(id) {
      if (events.has(id)) return "duplicate";
      events.add(id);
      return "new";
    },
    async releaseEvent(id) {
      events.delete(id);
    },
    async apply(update) {
      if (update.kind === "subscription" && update.row.status === "explode") throw new Error("store down");
      applied.push(update);
    },
  };
}

test("missing billing env does not throw and says payments not configured", async () => {
  const env = {};
  assert.equal(readCheckoutConfig(env), null);
  assert.equal(readWebhookConfig(env), null);
  const response = paymentsNotConfiguredResponse(
    new Request("https://sidebitesites.com/api/stripe/checkout", {
      method: "POST",
      headers: { accept: "text/html", "content-type": "application/x-www-form-urlencoded" },
    }),
  );
  assert.equal(response.status, 503);
  assert.match(await response.text(), new RegExp(PAYMENTS_NOT_CONFIGURED));

  const keys = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_STARTER",
    "STRIPE_PRICE_PRO",
    "STRIPE_PRICE_PREMIUM",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "PUBLIC_SITE_URL",
  ];
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  try {
    const live = await checkoutPost({
      request: new Request("https://sidebitesites.com/api/stripe/checkout", {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify({ plan: "gather" }),
      }),
    });
    assert.equal(live.status, 503);
    const body = await live.json();
    assert.equal(body.error, PAYMENTS_NOT_CONFIGURED);
  } finally {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});

test("checkout session is a subscription trial that always collects a card", () => {
  const config = readCheckoutConfig({
    STRIPE_SECRET_KEY: "sk_test_123",
    STRIPE_PRICE_STARTER: prices.starter,
    STRIPE_PRICE_PRO: prices.pro,
    STRIPE_PRICE_PREMIUM: prices.premium,
    PUBLIC_SITE_URL: "https://sidebitesites.com/",
    STRIPE_WEBHOOK_SECRET: "whsec_test",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service",
  });
  assert.ok(config);
  assert.equal(config.siteUrl, "https://sidebitesites.com");
  const params = checkoutSessionParams({
    priceId: config.prices.pro,
    plan: "pro",
    siteUrl: config.siteUrl,
    email: normalizeEmail("Host@Example.com"),
  });
  assert.equal(params.mode, "subscription");
  assert.equal(params.payment_method_collection, "always");
  assert.equal(params.subscription_data.trial_period_days, 7);
  assert.equal(params.customer_email, "host@example.com");
  assert.equal(params.success_url, "https://sidebitesites.com/checkout/success?session_id={CHECKOUT_SESSION_ID}");
  assert.equal(params.cancel_url, "https://sidebitesites.com/pricing?checkout=canceled");
  assert.equal(normalizeEmail("not-an-email"), "invalid");
  const free = checkoutSessionParams({
    priceId: config.prices.starter,
    plan: "free",
    siteUrl: config.siteUrl,
    email: null,
  });
  assert.equal(free.mode, "subscription");
  assert.equal(free.payment_method_collection, "always");
  assert.equal(free.subscription_data.trial_period_days, 7);
  assert.equal(free.line_items[0].price, prices.starter);
  assert.equal(free.metadata.plan, "free");
  assert.equal(free.subscription_data.metadata.plan, "free");
});

test("webhook updates are idempotent and map subscription status", async () => {
  const now = new Date("2026-11-04T00:00:00.000Z");
  const subscription = {
    id: "sub_1",
    customer: "cus_1",
    status: "trialing",
    trial_end: 1_762_300_800,
    cancel_at_period_end: false,
    metadata: { plan: "celebrate" },
    items: { data: [{ current_period_end: 1_762_819_200, price: { id: prices.pro } }] },
  };
  const row = subscriptionRow(subscription, prices, now);
  assert.equal(row.plan, "celebrate");
  const trialEnd = Math.floor(new Date("2026-11-11T00:00:00.000Z").getTime() / 1000);
  const freeTrial = subscriptionRow(
    { ...subscription, status: "trialing", trial_end: trialEnd, metadata: { plan: "free" }, items: { data: [{ price: { id: prices.starter } }] } },
    prices,
    now,
  );
  assert.equal(freeTrial?.plan, "free");
  assert.equal(freeTrial?.stripe_price_id, prices.starter);
  const converted = subscriptionRow(
    { ...subscription, status: "active", trial_end: trialEnd, metadata: { plan: "free" }, items: { data: [{ price: { id: prices.starter } }] } },
    prices,
    new Date("2026-11-12T00:00:00.000Z"),
  );
  assert.equal(converted?.plan, "gather");
  assert.equal(row.status, "trialing");
  assert.equal(row.stripe_price_id, prices.pro);
  assert.equal(planFromPriceId(prices.premium, prices), "premium");

  const created = updatesFromEvent(
    { type: "customer.subscription.created", data: { object: subscription } },
    prices,
    now,
  );
  assert.equal(created[0].kind, "subscription");
  assert.equal(created[0].row.status, "trialing");

  const deleted = updatesFromEvent(
    { type: "customer.subscription.deleted", data: { object: subscription } },
    prices,
    now,
  );
  assert.equal(deleted[0].row.status, "canceled");

  const ending = updatesFromEvent(
    { type: "customer.subscription.trial_will_end", data: { object: { id: "sub_1" } } },
    prices,
    now,
  );
  assert.deepEqual(ending, [{ kind: "trial_will_end", stripeSubscriptionId: "sub_1", at: now.toISOString() }]);

  const failed = updatesFromEvent(
    {
      type: "invoice.payment_failed",
      data: { object: { parent: { subscription_details: { subscription: "sub_1" } } } },
    },
    prices,
    now,
  );
  assert.deepEqual(failed, [{ kind: "invoice", stripeSubscriptionId: "sub_1", invoiceStatus: "failed" }]);

  const paid = updatesFromEvent(
    { type: "invoice.paid", data: { object: { subscription: "sub_1" } } },
    prices,
    now,
  );
  assert.equal(paid[0].invoiceStatus, "paid");

  const checkout = updatesFromEvent(
    {
      type: "checkout.session.completed",
      data: {
        object: {
          customer: "cus_1",
          customer_details: { email: "host@example.com" },
          subscription,
        },
      },
    },
    prices,
    now,
  );
  assert.equal(checkout[0].kind, "customer");
  assert.equal(checkout[0].row.email, "host@example.com");
  assert.equal(checkout[1].kind, "subscription");

  const store = memoryStore();
  assert.equal(await processBillingEvent("evt_1", "customer.subscription.created", created, store), "processed");
  assert.equal(await processBillingEvent("evt_1", "customer.subscription.created", created, store), "duplicate");
  assert.equal(store.applied.length, 1);

  const broken = {
    ...subscription,
    status: "explode",
  };
  const boom = updatesFromEvent({ type: "customer.subscription.updated", data: { object: broken } }, prices, now);
  await assert.rejects(() => processBillingEvent("evt_2", "customer.subscription.updated", boom, store));
  assert.equal(await processBillingEvent("evt_2", "customer.subscription.updated", created, store), "processed");
});

test("stripe signature helper accepts a known webhook secret", () => {
  const stripe = new Stripe("sk_test_123");
  const payload = JSON.stringify({
    id: "evt_test",
    object: "event",
    type: "invoice.paid",
    data: { object: { id: "in_1", subscription: "sub_1" } },
  });
  const secret = "whsec_test_secret";
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
  const event = stripe.webhooks.constructEvent(payload, header, secret);
  assert.equal(event.type, "invoice.paid");
  assert.throws(() => stripe.webhooks.constructEvent(payload, header, "whsec_other"));
});
