-- CUT&STYLE Salon & Spa Management System
-- Initial PostgreSQL Database Schema (Phase 1)
-- Timestamp: 2026-09-11

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. PROFILES TABLE
-- ==========================================
-- Profile records correspond to Supabase Auth users (auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'WORKER')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 2. BILLS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number TEXT UNIQUE NOT NULL,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    customer_name TEXT,
    customer_phone TEXT,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'UPI')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 3. BILL ITEMS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 4. EXPENSES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN (
        'RENT',
        'ELECTRICITY',
        'WATER',
        'SALARY',
        'PRODUCTS',
        'MAINTENANCE',
        'MARKETING',
        'OTHER'
    )),
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 5. AUDIT LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 6. INDEXES FOR HIGH PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

CREATE INDEX IF NOT EXISTS idx_bills_worker_id ON public.bills(worker_id);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON public.bills(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON public.bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_payment_method ON public.bills(payment_method);

CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON public.bill_items(bill_id);

CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- ==========================================
-- 7. BILL NUMBER ARCHITECTURE & SEQUENCING
-- Format: CS-YYYY-000001
-- ==========================================
CREATE SEQUENCE IF NOT EXISTS public.bill_number_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.generate_bill_number()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    year_str TEXT;
    formatted_bill_num TEXT;
BEGIN
    next_val := nextval('public.bill_number_seq');
    year_str := to_char(CURRENT_DATE, 'YYYY');
    formatted_bill_num := 'CS-' || year_str || '-' || LPAD(next_val::TEXT, 6, '0');
    RETURN formatted_bill_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 8. AUTOMATIC TIMESTAMP TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_expenses_updated_at ON public.expenses;
CREATE TRIGGER set_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- 9. AUTH USER SYNC TRIGGER (ON SIGNUP)
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Staff Member'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'WORKER'),
        'ACTIVE'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the current user is an active ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'ADMIN'
          AND status = 'ACTIVE'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------
-- Admins can view all profiles
CREATE POLICY "Admins have full access to profiles"
    ON public.profiles
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Workers can read their own profile
CREATE POLICY "Workers can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- ------------------------------------------
-- BILLS POLICIES
-- ------------------------------------------
-- Admins can view/manage all bills
CREATE POLICY "Admins have full access to bills"
    ON public.bills
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Workers can view their own bills
CREATE POLICY "Workers can view own bills"
    ON public.bills
    FOR SELECT
    TO authenticated
    USING (worker_id = auth.uid());

-- Workers can create their own bills
CREATE POLICY "Workers can insert own bills"
    ON public.bills
    FOR INSERT
    TO authenticated
    WITH CHECK (worker_id = auth.uid());

-- ------------------------------------------
-- BILL ITEMS POLICIES
-- ------------------------------------------
-- Admins have full access to all bill items
CREATE POLICY "Admins have full access to bill_items"
    ON public.bill_items
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Workers can view items of bills they created
CREATE POLICY "Workers can view own bill items"
    ON public.bill_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bills
            WHERE public.bills.id = public.bill_items.bill_id
              AND public.bills.worker_id = auth.uid()
        )
    );

-- Workers can insert items into bills they created
CREATE POLICY "Workers can insert own bill items"
    ON public.bill_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bills
            WHERE public.bills.id = public.bill_items.bill_id
              AND public.bills.worker_id = auth.uid()
        )
    );

-- ------------------------------------------
-- EXPENSES POLICIES
-- Workers have zero access to expenses
-- ------------------------------------------
-- Admins have full access to expenses
CREATE POLICY "Admins have full access to expenses"
    ON public.expenses
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------
-- AUDIT LOGS POLICIES
-- ------------------------------------------
-- Admins can view all audit logs
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Authenticated users can insert their own audit logs
CREATE POLICY "Authenticated users can insert audit logs"
    ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());
