ALTER TABLE public.organizations DROP CONSTRAINT organizations_plan_check;
ALTER TABLE public.organizations ADD CONSTRAINT organizations_plan_check CHECK (plan IN ('starter', 'studio', 'pro', 'premium'));
