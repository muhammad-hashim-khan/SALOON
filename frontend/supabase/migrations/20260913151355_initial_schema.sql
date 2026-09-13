-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Types
CREATE TYPE user_role AS ENUM ('ADMIN', 'WORKER');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE payment_type AS ENUM ('CASH', 'UPI');
CREATE TYPE expense_category AS ENUM ('RENT', 'ELECTRICITY', 'WATER', 'SALARY', 'PRODUCTS', 'MAINTENANCE', 'MARKETING', 'OTHER');

-- 1. Profiles Table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'WORKER',
    status user_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Settings Table
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_name TEXT NOT NULL DEFAULT 'CUT&STYLE',
    business_name TEXT NOT NULL DEFAULT 'SALON & SPA',
    phone TEXT,
    address TEXT,
    admin_email TEXT NOT NULL DEFAULT 'cutsandofficial@gmail.com',
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial settings row
INSERT INTO public.settings (id, salon_name, business_name, admin_email) 
VALUES (gen_random_uuid(), 'CUT&STYLE', 'SALON & SPA', 'cutsandofficial@gmail.com');

-- 3. Bills Table
CREATE TABLE public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number TEXT NOT NULL UNIQUE,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    customer_name TEXT,
    customer_phone TEXT,
    subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
    discount INTEGER NOT NULL DEFAULT 0 CHECK (discount >= 0),
    total INTEGER NOT NULL CHECK (total >= 0),
    payment_method payment_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_discount_not_exceed_subtotal CHECK (discount <= subtotal),
    CONSTRAINT check_total_calc CHECK (total = subtotal - discount)
);

-- 4. Bill Items Table
CREATE TABLE public.bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Expenses Table
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category expense_category NOT NULL,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Audit Logs Table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sequence for Bill Number (CS-YYYY-XXXXXX)
CREATE SEQUENCE IF NOT EXISTS bill_number_seq;

CREATE OR REPLACE FUNCTION generate_bill_number()
RETURNS TRIGGER AS $$
DECLARE
    current_year TEXT;
    seq_val BIGINT;
BEGIN
    current_year := to_char(NOW(), 'YYYY');
    seq_val := nextval('bill_number_seq');
    NEW.bill_number := 'CS-' || current_year || '-' || lpad(seq_val::text, 6, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER assign_bill_number BEFORE INSERT ON public.bills FOR EACH ROW EXECUTE FUNCTION generate_bill_number();

-- Function for safely inserting a full bill (transactional)
CREATE OR REPLACE FUNCTION create_bill_with_items(
    p_worker_id UUID,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_discount INTEGER,
    p_payment_method payment_type,
    p_items JSONB -- Array of { description, amount }
)
RETURNS UUID AS $$
DECLARE
    v_bill_id UUID;
    v_subtotal INTEGER := 0;
    v_item JSONB;
BEGIN
    -- Calculate subtotal from items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_subtotal := v_subtotal + (v_item->>'amount')::INTEGER;
    END LOOP;

    -- Insert bill (bill_number generated by trigger)
    INSERT INTO public.bills (worker_id, customer_name, customer_phone, subtotal, discount, total, payment_method)
    VALUES (p_worker_id, p_customer_name, p_customer_phone, v_subtotal, p_discount, v_subtotal - p_discount, p_payment_method)
    RETURNING id INTO v_bill_id;

    -- Insert items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.bill_items (bill_id, description, amount)
        VALUES (v_bill_id, v_item->>'description', (v_item->>'amount')::INTEGER);
    END LOOP;

    RETURN v_bill_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
