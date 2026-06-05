create table public.organizations (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  slug                   text unique not null,
  plan                   text not null default 'starter' check (plan in ('starter','studio','pro')),
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  stripe_price_id        text,
  subscription_status    text default 'trialing',
  trial_ends_at          timestamptz default (now() + interval '14 days'),
  logo_url               text,
  color_primary          text default '#4f46e5',
  timezone               text default 'Europe/Brussels',
  address                text,
  phone                  text,
  website                text,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);
