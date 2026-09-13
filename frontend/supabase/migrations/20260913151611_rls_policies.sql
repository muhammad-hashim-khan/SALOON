-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN' 
       AND (SELECT status FROM public.profiles WHERE id = auth.uid()) = 'ACTIVE';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_active_user() RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT status FROM public.profiles WHERE id = auth.uid()) = 'ACTIVE';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. Profiles RLS
-- Anyone authenticated can view profiles (to see worker names, etc) if they are active
CREATE POLICY "Users can view profiles if active" ON public.profiles FOR SELECT TO authenticated USING (public.is_active_user());
-- Only Admins can insert, update, or delete profiles
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin());
-- Users can update their own profile (but not their role/status due to triggers/functions, or we can just limit the policy)
-- Actually, the requirement says: "A Worker must never be able to change WORKER -> ADMIN or INACTIVE -> ACTIVE". 
-- So let's restrict updates via a trigger later, or just only allow Admin to update. Worker only updates their own password/email via auth, which doesn't touch the profiles table directly. 
-- For safety, we ONLY let Admin update profiles table.

-- 2. Settings RLS
-- Anyone can read settings
CREATE POLICY "Anyone can read settings" ON public.settings FOR SELECT TO authenticated USING (true);
-- Only Admins can update settings
CREATE POLICY "Admins can update settings" ON public.settings FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert settings" ON public.settings FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- 3. Bills RLS
-- Admins can do everything
CREATE POLICY "Admins can manage bills" ON public.bills FOR ALL TO authenticated USING (public.is_admin());
-- Workers can view their own bills
CREATE POLICY "Workers can view own bills" ON public.bills FOR SELECT TO authenticated USING (auth.uid() = worker_id AND public.is_active_user());
-- Workers can create bills (must set worker_id to themselves)
CREATE POLICY "Workers can insert own bills" ON public.bills FOR INSERT TO authenticated WITH CHECK (auth.uid() = worker_id AND public.is_active_user());

-- 4. Bill Items RLS
-- Admins can do everything
CREATE POLICY "Admins can manage bill items" ON public.bill_items FOR ALL TO authenticated USING (public.is_admin());
-- Workers can view bill items for their own bills
CREATE POLICY "Workers can view own bill items" ON public.bill_items FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.bills WHERE id = bill_items.bill_id AND worker_id = auth.uid())
);
-- Workers can insert bill items for their own bills
CREATE POLICY "Workers can insert own bill items" ON public.bill_items FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.bills WHERE id = bill_items.bill_id AND worker_id = auth.uid())
);

-- 5. Expenses RLS
-- Admins can do everything
CREATE POLICY "Admins can manage expenses" ON public.expenses FOR ALL TO authenticated USING (public.is_admin());
-- Workers have NO access to expenses (no policies for them)

-- 6. Audit Logs RLS
-- Admins can do everything
CREATE POLICY "Admins can manage audit logs" ON public.audit_logs FOR ALL TO authenticated USING (public.is_admin());
-- Workers can insert audit logs for their own actions
CREATE POLICY "Workers can insert own audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_active_user());
