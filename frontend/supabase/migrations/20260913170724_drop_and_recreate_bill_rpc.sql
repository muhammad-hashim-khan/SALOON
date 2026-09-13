-- Drop all overloaded versions of create_bill_with_items to resolve PostgREST ambiguity
DROP FUNCTION IF EXISTS create_bill_with_items(UUID, TEXT, TEXT, INTEGER, TEXT, JSONB);
DROP FUNCTION IF EXISTS create_bill_with_items(UUID, TEXT, TEXT, INTEGER, payment_type, JSONB);

-- Recreate the correct version using TEXT for payment_method so PostgREST has no ambiguity
CREATE OR REPLACE FUNCTION create_bill_with_items(
  p_worker_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_discount INTEGER,
  p_payment_method TEXT,
  p_items JSONB
)
RETURNS UUID AS $$
DECLARE
  v_bill_id UUID;
  v_subtotal INTEGER := 0;
  v_total INTEGER;
  v_item JSONB;
BEGIN
  -- Calculate subtotal from items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_subtotal := v_subtotal + (v_item->>'amount')::INTEGER;
  END LOOP;

  -- Ensure discount never exceeds subtotal
  v_total := GREATEST(0, v_subtotal - p_discount);

  -- Insert bill (let the trigger generate bill_number)
  -- The trigger 'assign_bill_number' handles NEW.bill_number automatically.
  -- Cast p_payment_method to payment_type explicitly.
  INSERT INTO bills (
    worker_id, customer_name, customer_phone,
    subtotal, discount, total, payment_method
  )
  VALUES (
    p_worker_id, p_customer_name, p_customer_phone,
    v_subtotal, p_discount, v_total, p_payment_method::payment_type
  )
  RETURNING id INTO v_bill_id;

  -- Insert bill items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO bill_items (bill_id, description, amount)
    VALUES (
      v_bill_id,
      v_item->>'description',
      (v_item->>'amount')::INTEGER
    );
  END LOOP;

  RETURN v_bill_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (workers and admin)
GRANT EXECUTE ON FUNCTION create_bill_with_items(UUID, TEXT, TEXT, INTEGER, TEXT, JSONB) TO authenticated;
