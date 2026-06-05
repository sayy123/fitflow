create table public.member_subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  studio_member_id    uuid not null references public.studio_members(id) on delete cascade,
  type                text not null check (type in ('unlimited_monthly','pack_10','pack_20','drop_in')),
  sessions_left       int,
  price_paid          numeric(10,2),
  currency            text default 'eur',
  stripe_payment_id   text,
  starts_at           timestamptz default now(),
  expires_at          timestamptz,
  is_active           boolean default true,
  created_at          timestamptz default now()
);
