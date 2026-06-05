create table public.studio_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email           text not null,
  full_name       text not null,
  phone           text,
  notes           text,
  stripe_customer_id text,
  is_active       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(organization_id, email)
);
