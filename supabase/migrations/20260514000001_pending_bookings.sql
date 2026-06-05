-- Create pending_bookings table
CREATE TABLE IF NOT EXISTS public.pending_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    password_hash TEXT, -- On stockera le mot de passe hashé temporairement si nécessaire, ou on gérera via Supabase
    token UUID NOT NULL DEFAULT gen_random_uuid(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(token)
);

-- Index for token lookup
CREATE INDEX idx_pending_bookings_token ON public.pending_bookings(token);
