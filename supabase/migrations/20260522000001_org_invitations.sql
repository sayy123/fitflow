create table public.org_invitations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email           text not null,
  role            text not null default 'member',
  status          text not null default 'pending',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- RLS
alter table public.org_invitations enable row level security;

create policy "Owners can manage invitations" on public.org_invitations
  for all using (
    exists (
      select 1 from public.org_members
      where organization_id = org_invitations.organization_id
      and user_id = auth.uid()
      and role = 'owner'
    )
  );

create policy "Users can see their own invitations" on public.org_invitations
  for select using (
    email = (select email from auth.users where id = auth.uid())
  );
