create table public.bookings (
  id               uuid primary key default gen_random_uuid(),
  class_id         uuid not null references public.classes(id) on delete cascade,
  studio_member_id uuid not null references public.studio_members(id) on delete cascade,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  status           text not null default 'confirmed' check (status in ('confirmed','waitlist','cancelled','no_show')),
  waitlist_position int,
  cancelled_at     timestamptz,
  cancel_reason    text,
  reminder_sent    boolean default false,
  created_at       timestamptz default now(),
  unique(class_id, studio_member_id)
);
