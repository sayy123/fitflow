create or replace function public.get_user_organization_id()
returns uuid language sql security definer stable as $$
  select organization_id from public.org_members
  where user_id = auth.uid()
  limit 1;
$$;

alter table public.organizations enable row level security;
create policy "users_see_own_org" on public.organizations
  for all using (id = public.get_user_organization_id());

alter table public.org_members enable row level security;
create policy "org_members_own_org" on public.org_members
  for all using (organization_id = public.get_user_organization_id());

alter table public.classes enable row level security;
create policy "classes_own_org" on public.classes
  for all using (organization_id = public.get_user_organization_id());

alter table public.studio_members enable row level security;
create policy "studio_members_own_org" on public.studio_members
  for all using (organization_id = public.get_user_organization_id());

alter table public.bookings enable row level security;
create policy "bookings_own_org" on public.bookings
  for all using (organization_id = public.get_user_organization_id());

alter table public.member_subscriptions enable row level security;
create policy "subscriptions_own_org" on public.member_subscriptions
  for all using (organization_id = public.get_user_organization_id());

create policy "public_classes_by_slug" on public.classes
  for select using (
    organization_id in (
      select id from public.organizations where slug = current_setting('app.studio_slug', true)
    )
    and is_cancelled = false
    and starts_at > now()
  );
