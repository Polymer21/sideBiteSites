/**
 * Live Sidebite plans. There is no free tier.
 * Every plan is a monthly subscription with a 7-day trial and a card on file.
 * Stripe Price IDs are env vars, not stored here:
 * Gather → STRIPE_PRICE_STARTER, Celebrate → STRIPE_PRICE_PRO, Milestone → STRIPE_PRICE_PREMIUM.
 */
export const plansCatalog = {
  domain: "sidebitesites.com",
  trialDays: 7,
  prices: {
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
export type StripePlan = (typeof plans)[number]["stripePlan"];

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

export const gatherFeatures = [
  "Event page",
  "Share link",
  "RSVPs: see who’s coming",
  "Small Sidebite badge",
] as const;

export function priceSummary(): string {
  const { gather, celebrate, milestone } = plansCatalog.prices;
  return `Gather ${monthlyPrice(gather)} · Celebrate ${monthlyPrice(celebrate)} · Milestone ${monthlyPrice(milestone)}. ${plansCatalog.trialDays}-day free trial, card required. No free plan.`;
}

export function homePriceHeadline(): string {
  return `Monthly plans from ${monthlyPrice(plansCatalog.prices.gather)}. A card starts the ${plansCatalog.trialDays}-day free trial.`;
}
