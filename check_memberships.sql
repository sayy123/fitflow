SELECT om.user_id, u.email, om.organization_id, o.name as org_name, om.role 
FROM public.org_members om 
JOIN public.organizations o ON om.organization_id = o.id 
JOIN auth.users u ON om.user_id = u.id 
WHERE u.email = '7k.say1234@gmail.com';
