CREATE OR REPLACE FUNCTION peek_next_bill_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    seq_val BIGINT;
    next_bill_number TEXT;
BEGIN
    current_year := to_char(NOW(), 'YYYY');
    
    -- We can use pg_sequence_last_value, but it might be null if not initialized
    -- To simply peek without incrementing, we query the sequence catalog or use last_value + 1
    -- But since this is a simple sequence, we can do this safely:
    SELECT COALESCE(last_value, 0) + 1 INTO seq_val FROM bill_number_seq;
    
    next_bill_number := 'CS-' || current_year || '-' || lpad(seq_val::text, 6, '0');
    RETURN next_bill_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
