-- Function to check if user is staff in an organization
CREATE OR REPLACE FUNCTION public.is_staff(org_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = auth.uid()
    AND organization_id = org_id
    AND role IN ('owner', 'admin', 'coach')
  );
$$;

-- Update Classes Policies
DROP POLICY IF EXISTS "classes_own_org" ON public.classes;
CREATE POLICY "staff_manage_classes" ON public.classes
  FOR ALL USING (public.is_staff(organization_id));
CREATE POLICY "members_view_classes" ON public.classes
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.org_members WHERE user_id = auth.uid()));

-- Update Studio Members Policies (Clients)
DROP POLICY IF EXISTS "studio_members_own_org" ON public.studio_members;
CREATE POLICY "staff_manage_studio_members" ON public.studio_members
  FOR ALL USING (public.is_staff(organization_id));
CREATE POLICY "members_see_self" ON public.studio_members
  FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Update Bookings Policies
DROP POLICY IF EXISTS "bookings_own_org" ON public.bookings;
CREATE POLICY "staff_manage_bookings" ON public.bookings
  FOR ALL USING (public.is_staff(organization_id));
CREATE POLICY "members_manage_own_bookings" ON public.bookings
  FOR ALL USING (
    studio_member_id IN (
      SELECT id FROM public.studio_members 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
