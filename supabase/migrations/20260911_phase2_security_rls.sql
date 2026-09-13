-- CUT&STYLE Salon & Spa Management System
-- Phase 2: Secure Authentication & Role-Based Access Control (RBAC) Hardening
-- Timestamp: 2026-09-11

-- ==========================================
-- 1. HARDEN PROFILES RLS POLICIES
-- ==========================================
-- Drop previous policies to ensure clean state
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Workers can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Ensure RLS is active
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Admin Full Access Policy
CREATE POLICY "Admins have full access to profiles"
    ON public.profiles
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 2. Authenticated users can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- 3. Prevent privilege escalation on UPDATE:
-- Non-admin users can ONLY update their full_name, NEVER their role or status.
CREATE POLICY "Users can update own basic profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        -- Ensure role and status cannot be changed by non-admins
        AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
        AND status = (SELECT status FROM public.profiles WHERE id = auth.uid())
    );

-- ==========================================
-- 2. ADMIN BOOTSTRAP UTILITY FUNCTION
-- Allows assigning or creating an initial Admin account safely via SQL
-- ==========================================
CREATE OR REPLACE FUNCTION public.bootstrap_admin_user(
    user_email TEXT,
    admin_full_name TEXT DEFAULT 'Salon Administrator'
)
RETURNS VOID AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Find user in auth.users by email
    SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found in auth.users. Please create the user in Supabase Auth first.', user_email;
    END IF;

    -- Upsert profile with ADMIN role and ACTIVE status
    INSERT INTO public.profiles (id, full_name, role, status, updated_at)
    VALUES (target_user_id, admin_full_name, 'ADMIN', 'ACTIVE', now())
    ON CONFLICT (id) DO UPDATE
    SET role = 'ADMIN',
        status = 'ACTIVE',
        full_name = EXCLUDED.full_name,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
