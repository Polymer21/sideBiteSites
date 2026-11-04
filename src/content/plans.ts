/**
 * Live Sidebite plans.
 * Free starts a Gather subscription ($50/month) with a 7-day trial.
 * The page stays basic during those 7 days, then the card is charged and it becomes Gather.
 * Gather, Celebrate, and Milestone stay monthly subscriptions with a 7-day trial.
 * Stripe Price IDs are env vars, not stored here:
 * Free and Gather → STRIPE_PRICE_STARTER, Celebrate → STRIPE_PRICE_PRO, Milestone → STRIPE_PRICE_PREMIUM.
 */
export const plansCatalog = {
  domain: "sidebitesites.com",
  trialDays: 7,
  prices: {
    free: 0,
    gather: 50,
    celebrate: 150,
    milestone: 300,
  },
  rounds: {
    celebrate: 3,
    milestone: 5,
  },
} as const;

export const plans = [
  {
    id: "free",
    stripePlan: null,
    name: "Free",
    price: plansCatalog.prices.free,
    cadence: "for one week",
    blurb: `${money(plansCatalog.prices.free)} for ${plansCatalog.trialDays} days, then ${money(plansCatalog.prices.gather)}/month (Gather). Card required. Cancel anytime before day ${plansCatalog.trialDays}.`,
    cta: "Start free",
    variant: "secondary",
    popular: false,
  },
  {
    id: "gather",
    stripePlan: "starter",
    name: "Gather",
    price: plansCatalog.prices.gather,
    cadence: "per month",
    blurb: "Everything you need to get people there.",
    cta: "Start 7-day trial",
    variant: "secondary",
    popular: false,
  },
  {
    id: "celebrate",
    stripePlan: "pro",
    name: "Celebrate",
    price: plansCatalog.prices.celebrate,
    cadence: "per month",
    blurb: "Make it yours.",
    cta: "Start 7-day trial",
    variant: "primary",
    popular: true,
  },
  {
    id: "milestone",
    stripePlan: "premium",
    name: "Milestone",
    price: plansCatalog.prices.milestone,
    cadence: "per month",
    blurb: "For the big ones.",
    cta: "Start 7-day trial",
    variant: "secondary",
    popular: false,
  },
] as const;

export type PlanId = (typeof plans)[number]["id"];
export type StripePlan = "starter" | "pro" | "premium";

export function isPaidPlan<T extends { stripePlan: StripePlan | null }>(
  plan: T,
): plan is T & { stripePlan: StripePlan } {
  return plan.stripePlan !== null;
}

export function money(amount: number): string {
  return `$${amount}`;
}

export function monthlyPrice(amount: number): string {
  return `${money(amount)}/mo`;
}

export function eventLink(slug: string): string {
  return `${plansCatalog.domain}/e/${slug}`;
}

export function planById(id: string | null | undefined) {
  if (!id) return undefined;
  const key = id.trim().toLowerCase();
  return plans.find((plan) => plan.id === key || plan.stripePlan === key);
}

export const milestoneFeatures = [
  "Everything in Celebrate",
  "Premium template",
  "Your own web address",
  "Guest updates and reminders",
  "Guest list download",
  "Page password",
  "Priority help",
  "Page stays live while subscribed",
  `${plansCatalog.rounds.milestone} change rounds`,
] as const;

export const celebrateFeatures = [
  "Everything in Gather",
  "Your colors, fonts and photos",
  "Extra sections: schedule, registry, map, FAQ",
  "No Sidebite badge",
  `${plansCatalog.rounds.celebrate} rounds of changes we make for you`,
] as const;

export const freeFeatures = [
  { ok: true, label: "Basic event page for 7 days" },
  { ok: true, label: "Sidebite badge" },
  { ok: true, label: "Renews automatically as Gather" },
  { ok: false, label: "No RSVP list or RSVP form" },
  { ok: false, label: "No customization" },
  { ok: false, label: "No extras or upgrades" },
] as const;

export const gatherFeatures = [
  "Event page",
  "Share link",
  "RSVPs: see who’s coming",
  "Small Sidebite badge",
] as const;

export function priceSummary(): string {
  const { free, gather, celebrate, milestone } = plansCatalog.prices;
  return `Free ${money(free)} for ${plansCatalog.trialDays} days, then Gather ${money(gather)}/month. Celebrate ${monthlyPrice(celebrate)} · Milestone ${monthlyPrice(milestone)}. Free renews automatically as Gather unless you cancel. Card required.`;
}

export function homePriceHeadline(): string {
  return "Start free for a week, or pick a monthly plan.";
}
