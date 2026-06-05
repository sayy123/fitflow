create table public.org_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'owner' check (role in ('owner','admin','coach')),
  display_name    text,
  avatar_url      text,
  created_at      timestamptz default now(),
  unique(organization_id, user_id)
);
