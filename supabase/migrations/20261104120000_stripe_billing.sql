-- Stripe customers, subscriptions, and an idempotent webhook event log.
-- Vercel functions write these tables with the Supabase service role.
-- Row level security is on and no policies are granted, so the anon and
-- authenticated roles cannot read or write billing data.

create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  stripe_customer_id text not null unique,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_email_idx on public.customers (email);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  stripe_price_id text,
  plan text,
  status text not null,
  trial_end timestamptz,
  trial_will_end_notified_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  latest_invoice_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_customer_idx on public.subscriptions (stripe_customer_id);

create table if not exists public.stripe_webhook_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now(),
  payload jsonb
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stripe_webhook_events enable row level security;

revoke all on public.customers from anon, authenticated;
revoke all on public.subscriptions from anon, authenticated;
revoke all on public.stripe_webhook_events from anon, authenticated;
