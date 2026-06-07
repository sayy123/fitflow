-- Add Stripe Connect fields to organizations
ALTER TABLE public.organizations ADD COLUMN stripe_account_id text UNIQUE;
ALTER TABLE public.organizations ADD COLUMN stripe_charges_enabled boolean DEFAULT false;

-- Add price field to classes
ALTER TABLE public.classes ADD COLUMN price numeric;

-- Add payment fields to bookings
ALTER TABLE public.bookings ADD COLUMN payment_status text DEFAULT 'free';
ALTER TABLE public.bookings ADD COLUMN stripe_session_id text UNIQUE;
