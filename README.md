# Sidebite

Marketing site and clickable host-flow mockups for Sidebite. Pages are static Astro HTML. Stripe Checkout, the billing portal, and the webhook are Vercel serverless routes (`export const prerender = false`). There is no free plan: Gather, Celebrate, and Milestone are monthly, with a 7-day trial and a card required before the page is built.

## Pages

| Route | Frame |
| --- | --- |
| `/` | 01 Marketing home, with the 390 layout under 760px |
| `/pricing` | Monthly plans, 7-day trial |
| `/checkout` | Plan chooser, then Stripe Checkout |
| `/checkout/success` | Trial started |
| `/demo/event-type` | 02 Event type |
| `/demo/event-basics` | 03 Event basics |
| `/demo/template` | 04 Template + palette (390 layout included) |
| `/demo/editor` | 05 Editor (390 layout included). Updates the preview in this browser only |
| `/demo/preview` | 06 Preview |
| `/demo/account` | 07 Account creation |
| `/demo/checkout` | Checkout entry (posts to Stripe) |
| `/demo/published` | 10 Publish success |
| `/demo/dashboard` | 11 Dashboard |
| `/e/demo` | 12 RSVP guest view |

The editor keeps a draft in `sessionStorage` for the current tab so the preview can update. Plan prices and the public domain live in `src/content/plans.ts`. Stripe price IDs, the secret key, the webhook secret, and the Supabase service role are env vars. See `docs/stripe-setup.md`. When those vars are missing, the payment routes respond with “payments not configured” and the pages still render.

## Payments

Checkout is `mode=subscription` with `trial_period_days=7` and `payment_method_collection=always`. The webhook verifies the Stripe signature and writes customers, subscriptions, and an event log to Supabase. Cancel and card updates go through the Stripe billing portal. Terms and privacy pages are not published.

## Palettes

Every color in the UI is a custom property. `:root` and `[data-palette="default"]` use Palette B / Theme Default from `variables-67-3406.json`. `[data-palette="tripletree"]` and `[data-palette="premium"]` repeat those values so another mode can be dropped in beside them. The template step sets `data-palette` on `<html>`.

## Develop

```bash
npm install
npm run build
npm test
npm run preview
```

`@astrojs/vercel` emits the Build Output API (static pages plus serverless functions). Do not set `outputDirectory` in `vercel.json`. Copy `.env.example` to `.env` before exercising checkout locally.
