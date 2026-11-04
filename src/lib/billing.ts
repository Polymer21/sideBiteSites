import { planById, plans, plansCatalog, type StripePlan } from "../content/plans.ts";

export const PAYMENTS_NOT_CONFIGURED = "payments not configured";

export type CheckoutConfig = {
  stripeSecretKey: string;
  siteUrl: string;
  prices: Record<StripePlan, string>;
};

export type PortalConfig = {
  stripeSecretKey: string;
  siteUrl: string;
};

export type WebhookConfig = CheckoutConfig & {
  webhookSecret: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
};

export type CustomerRow = {
  stripe_customer_id: string;
  email: string | null;
  updated_at: string;
};

export type SubscriptionRow = {
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_price_id: string | null;
  plan: string | null;
  status: string;
  trial_end: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  updated_at: string;
};

export type BillingUpdate =
  | { kind: "customer"; row: CustomerRow }
  | { kind: "subscription"; row: SubscriptionRow }
  | { kind: "trial_will_end"; stripeSubscriptionId: string; at: string }
  | { kind: "invoice"; stripeSubscriptionId: string; invoiceStatus: "paid" | "failed" };

export interface BillingStore {
  claimEvent(id: string, type: string): Promise<"new" | "duplicate">;
  releaseEvent(id: string): Promise<void>;
  apply(update: BillingUpdate): Promise<void>;
}

type Env = Record<string, string | undefined>;

function runtimeEnv(env?: Env): Env {
  if (env) return env;
  const runtime = globalThis as { process?: { env?: Env } };
  return runtime.process?.env ?? {};
}

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

function siteUrlFrom(env: Env): string {
  return clean(env.PUBLIC_SITE_URL).replace(/\/$/, "");
}

function pricesFrom(env: Env): Record<StripePlan, string> | null {
  const prices = {
    starter: clean(env.STRIPE_PRICE_STARTER),
    pro: clean(env.STRIPE_PRICE_PRO),
    premium: clean(env.STRIPE_PRICE_PREMIUM),
  };
  if (!prices.starter || !prices.pro || !prices.premium) return null;
  return prices;
}

export function readCheckoutConfig(env?: Env): CheckoutConfig | null {
  env = runtimeEnv(env);
  const stripeSecretKey = clean(env.STRIPE_SECRET_KEY);
  const siteUrl = siteUrlFrom(env);
  const prices = pricesFrom(env);
  if (!stripeSecretKey || !siteUrl || !prices) return null;
  if (!/^https?:\/\//.test(siteUrl)) return null;
  return { stripeSecretKey, siteUrl, prices };
}

export function readPortalConfig(env?: Env): PortalConfig | null {
  env = runtimeEnv(env);
  const stripeSecretKey = clean(env.STRIPE_SECRET_KEY);
  const siteUrl = siteUrlFrom(env);
  if (!stripeSecretKey || !siteUrl || !/^https?:\/\//.test(siteUrl)) return null;
  return { stripeSecretKey, siteUrl };
}

export function readSupabaseConfig(env?: Env): { url: string; serviceRoleKey: string } | null {
  env = runtimeEnv(env);
  const url = clean(env.SUPABASE_URL);
  const serviceRoleKey = clean(env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

export function readWebhookConfig(env?: Env): WebhookConfig | null {
  env = runtimeEnv(env);
  const checkout = readCheckoutConfig(env);
  const webhookSecret = clean(env.STRIPE_WEBHOOK_SECRET);
  const supabase = readSupabaseConfig(env);
  if (!checkout || !webhookSecret || !supabase) return null;
  return {
    ...checkout,
    webhookSecret,
    supabaseUrl: supabase.url,
    supabaseServiceRoleKey: supabase.serviceRoleKey,
  };
}

export function paymentsNotConfiguredResponse(request: Request): Response {
  return messageResponse(request, 503, "Payments not configured", PAYMENTS_NOT_CONFIGURED);
}

export function messageResponse(request: Request, status: number, title: string, detail: string): Response {
  const accept = request.headers.get("accept") ?? "";
  const type = request.headers.get("content-type") ?? "";
  const wantsHtml = accept.includes("text/html") || type.includes("application/x-www-form-urlencoded");
  const headers = { "cache-control": "no-store" };
  if (wantsHtml) {
    const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title></head><body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(detail)}</p><p><a href="/pricing">Back to pricing</a></p></main></body></html>`;
    return new Response(body, { status, headers: { ...headers, "content-type": "text/html; charset=utf-8" } });
  }
  return Response.json({ error: detail }, { status, headers });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char);
}

export async function readRequestFields(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const json = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const fields: Record<string, string> = {};
    if (json && typeof json === "object") {
      for (const [key, value] of Object.entries(json)) {
        if (typeof value === "string") fields[key] = value;
      }
    }
    return fields;
  }
  const params = new URLSearchParams(await request.text());
  const fields: Record<string, string> = {};
  for (const [key, value] of params.entries()) fields[key] = value;
  return fields;
}

/** Empty is allowed. A non-empty value must look like an email. */
export function normalizeEmail(value: string | undefined): string | null | "invalid" {
  const email = (value ?? "").trim().toLowerCase();
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "invalid";
  return email;
}

export function unixToIso(seconds: number | null | undefined): string | null {
  if (!seconds) return null;
  return new Date(seconds * 1000).toISOString();
}

export function planFromPriceId(priceId: string | null | undefined, prices: Record<StripePlan, string>): StripePlan | null {
  if (!priceId) return null;
  for (const [plan, id] of Object.entries(prices) as [StripePlan, string][]) {
    if (id === priceId) return plan;
  }
  return null;
}

type IdLike = string | { id?: string | null } | null | undefined;

export function idOf(value: IdLike): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id ?? null;
}

type LooseSubscription = {
  id?: string;
  customer?: IdLike;
  status?: string;
  trial_end?: number | null;
  cancel_at_period_end?: boolean;
  metadata?: Record<string, string> | null;
  items?: { data?: Array<{ current_period_end?: number; price?: IdLike | { id?: string } }> };
};

export function subscriptionRow(
  sub: LooseSubscription,
  prices: Record<StripePlan, string>,
  now = new Date(),
): SubscriptionRow | null {
  const stripeSubscriptionId = sub.id;
  const stripeCustomerId = idOf(sub.customer);
  if (!stripeSubscriptionId || !stripeCustomerId || !sub.status) return null;
  const item = sub.items?.data?.[0];
  const priceId = idOf(item?.price as IdLike);
  const fromPrice = planFromPriceId(priceId, prices);
  const fromMeta = planById(sub.metadata?.plan);
  const plan = fromMeta?.id ?? plans.find((entry) => entry.stripePlan === fromPrice)?.id ?? null;
  return {
    stripe_subscription_id: stripeSubscriptionId,
    stripe_customer_id: stripeCustomerId,
    stripe_price_id: priceId,
    plan,
    status: sub.status,
    trial_end: unixToIso(sub.trial_end),
    current_period_end: unixToIso(item?.current_period_end),
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    updated_at: now.toISOString(),
  };
}

type LooseInvoice = {
  subscription?: IdLike;
  parent?: { subscription_details?: { subscription?: IdLike } | null } | null;
};

export function invoiceSubscriptionId(invoice: LooseInvoice): string | null {
  return idOf(invoice.subscription) ?? idOf(invoice.parent?.subscription_details?.subscription);
}

type LooseEvent = {
  type: string;
  data: { object: unknown };
};

export function updatesFromEvent(event: LooseEvent, prices: Record<StripePlan, string>, now = new Date()): BillingUpdate[] {
  const object = (event.data.object ?? {}) as Record<string, unknown>;
  const stamp = now.toISOString();
  if (event.type === "checkout.session.completed") {
    const updates: BillingUpdate[] = [];
    const customerId = idOf(object.customer as IdLike);
    const details = object.customer_details as { email?: string } | null | undefined;
    const email = normalizeEmail((details?.email as string | undefined) ?? (object.customer_email as string | undefined));
    if (customerId) {
      updates.push({
        kind: "customer",
        row: { stripe_customer_id: customerId, email: email === "invalid" ? null : email, updated_at: stamp },
      });
    }
    const subscription = object.subscription as LooseSubscription | string | null | undefined;
    if (subscription && typeof subscription === "object") {
      const row = subscriptionRow(subscription, prices, now);
      if (row) updates.push({ kind: "subscription", row });
    }
    return updates;
  }
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const row = subscriptionRow(object as LooseSubscription, prices, now);
    if (!row) return [];
    if (event.type === "customer.subscription.deleted") row.status = "canceled";
    return [{ kind: "subscription", row }];
  }
  if (event.type === "customer.subscription.trial_will_end") {
    const id = typeof object.id === "string" ? object.id : null;
    return id ? [{ kind: "trial_will_end", stripeSubscriptionId: id, at: stamp }] : [];
  }
  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const id = invoiceSubscriptionId(object as LooseInvoice);
    if (!id) return [];
    return [{ kind: "invoice", stripeSubscriptionId: id, invoiceStatus: event.type === "invoice.paid" ? "paid" : "failed" }];
  }
  return [];
}

export async function processBillingEvent(
  eventId: string,
  eventType: string,
  updates: BillingUpdate[],
  store: BillingStore,
): Promise<"processed" | "duplicate"> {
  const claim = await store.claimEvent(eventId, eventType);
  if (claim === "duplicate") return "duplicate";
  try {
    for (const update of updates) await store.apply(update);
    return "processed";
  } catch (error) {
    await store.releaseEvent(eventId);
    throw error;
  }
}

export function checkoutSessionParams(input: {
  priceId: string;
  plan: StripePlan;
  siteUrl: string;
  email: string | null;
}) {
  return {
    mode: "subscription" as const,
    line_items: [{ price: input.priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: plansCatalog.trialDays,
      metadata: { plan: input.plan },
    },
    payment_method_collection: "always" as const,
    success_url: `${input.siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.siteUrl}/pricing?checkout=canceled`,
    customer_email: input.email ?? undefined,
    metadata: { plan: input.plan },
  };
}
