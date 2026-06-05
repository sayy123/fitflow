create table public.classes (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  coach_id        uuid references public.org_members(id) on delete set null,
  title           text not null,
  description     text,
  starts_at       timestamptz not null,
  duration_min    int not null default 60,
  capacity        int not null default 15,
  location        text,
  color           text default '#4f46e5',
  is_recurring    boolean default false,
  recurrence_rule text,
  is_cancelled    boolean default false,
  cancel_reason   text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
