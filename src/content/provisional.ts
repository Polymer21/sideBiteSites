/**
 * Provisional product facts from Product Design v1.
 * Prices, Milestone change rounds, the Milestone feature list, and the domain
 * are pending sign-off. Edit them here — pages read this module only.
 *
 * Palette B / Theme Default does not include a chosen domain. The stand-in
 * below is the value this build is supposed to show.
 */
export const provisional = {
  domain: "sidebitesites.com",
  prices: {
    free: 0,
    gather: 50,
    celebrate: 150,
    milestone: 300,
    keepMonthly: 5,
    keepYearly: 40,
  },
  rounds: {
    celebrate: 3,
    milestone: 5,
  },
  pendingLabel: "PROVISIONAL · PENDING TIM",
} as const;

export function money(amount: number): string {
  return `$${amount}`;
}

/** "$5/mo or $40/yr" */
export function keepLivePrice(): string {
  const { keepMonthly, keepYearly } = provisional.prices;
  return `${money(keepMonthly)}/mo or ${money(keepYearly)}/yr`;
}

export function eventLink(slug: string): string {
  return `${provisional.domain}/e/${slug}`;
}

export const milestoneFeatures = [
  "Everything in Celebrate",
  "Premium template",
  "Your own web address",
  "Guest updates and reminders",
  "Guest list download",
  "Page password",
  "Priority help",
  "1 extra free month of hosting",
  `${provisional.rounds.milestone} change rounds*`,
] as const;

export const celebrateFeatures = [
  "Everything in Gather",
  "Your colors, fonts and photos",
  "Extra sections: schedule, registry, map, FAQ",
  "No Sidebite badge",
  `${provisional.rounds.celebrate} rounds of changes we make for you`,
] as const;

export const gatherFeatures = [
  "Event page",
  "Share link",
  "RSVPs: see who’s coming",
  "Small Sidebite badge",
] as const;

export const freeFeatures = [
  { included: true, label: "Build and preview your page" },
  { included: false, label: "Can’t publish" },
  { included: false, label: "Watermarked if shared" },
] as const;

export function priceSummary(): string {
  const { free, gather, celebrate, milestone } = provisional.prices;
  return `Free draft ${money(free)} · Gather ${money(gather)} · Celebrate ${money(celebrate)} · Milestone ${money(milestone)}, one-time per event. Prices and Milestone features may change.`;
}

export function homePriceHeadline(): string {
  return `One-time price per event, from ${money(provisional.prices.free)} for drafts. Hosting runs until a month after your event.`;
}

/** Upgrade from Gather to Celebrate, or Celebrate to Milestone. */
export function priceDifference(from: number, to: number): string {
  return money(to - from);
}
