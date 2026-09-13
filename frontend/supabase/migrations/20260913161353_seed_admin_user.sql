-- Seed admin user safely (idempotent - skips if email already exists)
-- Also seeds default settings and ensures the admin profile role is correct.

-- 1. Insert default settings (only if no row exists yet)
INSERT INTO public.settings (salon_name, business_name, phone, address)
SELECT 'CUT&STYLE', 'SALON & SPA', '+91 98765 43210', '123 Fashion Street, New Delhi, 110001'
WHERE NOT EXISTS (SELECT 1 FROM public.settings);

-- 2. Ensure the admin user's profile has role = 'ADMIN'
-- The admin was created via the Supabase Dashboard, so auth.users already exists.
-- We just need to make sure the profile trigger ran and the role is correct.
UPDATE public.profiles
SET role = 'ADMIN', full_name = 'System Admin'
WHERE email = 'cutsandofficial@gmail.com'
  AND (role != 'ADMIN' OR full_name IS NULL OR full_name = '');
