-- Allow virtual coaches by making user_id optional in org_members
ALTER TABLE public.org_members ALTER COLUMN user_id DROP NOT NULL;
