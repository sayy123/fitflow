SELECT u.id, u.email, om.role FROM auth.users u JOIN public.org_members om ON u.id = om.user_id WHERE om.role = 'member' LIMIT 1;
