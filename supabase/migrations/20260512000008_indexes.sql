create index idx_classes_org_starts on public.classes(organization_id, starts_at);
create index idx_bookings_class on public.bookings(class_id);
create index idx_bookings_member on public.bookings(studio_member_id);
create index idx_studio_members_email on public.studio_members(organization_id, email);
create index idx_org_members_user on public.org_members(user_id);
