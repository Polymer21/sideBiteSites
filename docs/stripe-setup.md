# Stripe billing setup

Sidebite bills three monthly plans. There is no free plan. Checkout starts a 7-day trial and always collects a card (`trial_period_days=7`, `payment_method_collection=always`). The trial is not a $0 Stripe Price.

| Plan | Amount | Env var |
| --- | --- | --- |
| Gather | $50 / month | `STRIPE_PRICE_STARTER` |
| Celebrate | $150 / month | `STRIPE_PRICE_PRO` |
| Milestone | $300 / month | `STRIPE_PRICE_PREMIUM` |

Pages stay static. These routes are Vercel serverless functions on the **sidebitesites** project:

- `POST /api/stripe/checkout`
- `POST /api/stripe/webhook`
- `POST /api/stripe/portal`

If a required env var is missing, those routes return **payments not configured** and the rest of the site still builds.

## 1. Products and prices

In the Stripe Dashboard (test mode first, then live):

1. Open **Product catalog** → **Add product**.
2. Create **Gather**.
   - Name: `Gather`
   - Pricing model: **Recurring**
   - Amount: `50.00` USD
   - Billing period: **Monthly**
   - Save, then copy the Price ID (`price_...`) into `STRIPE_PRICE_STARTER`.
3. Create **Celebrate** the same way at `150.00` USD monthly. Copy that Price ID into `STRIPE_PRICE_PRO`.
4. Create **Milestone** at `300.00` USD monthly. Copy that Price ID into `STRIPE_PRICE_PREMIUM`.

Do not add a free price. The 7-day trial is set when the site creates the Checkout Session.

## 2. Customer portal

1. Open **Settings → Billing → Customer portal**.
2. Turn the portal **on** and save.
3. Under customer permissions, allow **updating payment methods**.
4. Allow **canceling subscriptions**.
5. Save the configuration.

`POST /api/stripe/portal` opens a portal session. From the checkout confirmation it uses the Checkout Session id. From the dashboard it looks up the Stripe customer by the email stored in Supabase.

## 3. Webhook

1. Open **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://sidebitesites.com/api/stripe/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Add the endpoint.
5. Open the endpoint and reveal the **Signing secret** (`whsec_...`). That value is `STRIPE_WEBHOOK_SECRET`.

The function checks the `Stripe-Signature` header and ignores a duplicate event id already stored in `stripe_webhook_events`.

For local forwarding, Stripe CLI can point at `http://127.0.0.1:4321/api/stripe/webhook`. Use that CLI secret only in `.env`, not in Vercel.

## 4. API key

**Developers → API keys → Secret key** (`sk_test_...` or `sk_live_...`) is `STRIPE_SECRET_KEY`. Do not use the publishable key for these routes. Do not prefix the secret with `PUBLIC_`.

## 5. Supabase

1. Create or open the Supabase project.
2. Apply `supabase/migrations/20261104120000_stripe_billing.sql` (SQL editor → paste → run, or `supabase db push`).
3. That creates `customers`, `subscriptions`, and `stripe_webhook_events`, with row level security on and no policies for the anon key.
4. **Project Settings → API**:
   - Project URL → `SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

The service role bypasses RLS. Only the Vercel functions use it.

## 6. Env vars on Vercel

Vercel → **sidebitesites** → **Settings → Environment Variables**. Add these for Production (and Preview if you want test-mode checkout on preview URLs):

| Name | Example | Notes |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Server only |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Signing secret for the live endpoint |
| `STRIPE_PRICE_STARTER` | `price_...` | Gather, $50 monthly |
| `STRIPE_PRICE_PRO` | `price_...` | Celebrate, $150 monthly |
| `STRIPE_PRICE_PREMIUM` | `price_...` | Milestone, $300 monthly |
| `SUPABASE_URL` | `https://<ref>.supabase.co` | |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Server only |
| `PUBLIC_SITE_URL` | `https://sidebitesites.com` | No trailing slash. Success, cancel, and portal return URLs are built from this. |

Redeploy after saving so the functions pick up the values.

Locally, copy `.env.example` to `.env` and fill the same names. Blank values are safe: the marketing pages render, and the payment routes show **payments not configured**.

## 7. What the customer does

1. Pricing → **Start 7-day trial** → `/checkout/<plan>`.
2. The checkout page posts to `/api/stripe/checkout`.
3. Stripe Checkout collects the card, starts the 7-day trial, and returns to `/checkout/success?session_id=...`.
4. **Start building** goes to the page editor. Payment happens before that build.
5. **Manage billing** opens the Stripe customer portal.

Terms and privacy pages are not part of this flow. There is a comment marked `TERMS ACCEPTANCE HOOK` on the checkout form and in `src/pages/api/stripe/checkout.ts` for when counsel approves that step.
