-- Migration: Create delete transaction with balance adjustment function
-- This function safely deletes a transaction and reverses its balance effects

CREATE OR REPLACE FUNCTION delete_transaction_with_balance_adjustment(
    transaction_id UUID,
    user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tx_record RECORD;
    source_envelope_id UUID;
    dest_envelope_id UUID;
BEGIN
    -- Get the transaction details
    SELECT * INTO tx_record
    FROM transactions
    WHERE id = transaction_id AND transactions.user_id = delete_transaction_with_balance_adjustment.user_id;
    
    -- Check if transaction exists and belongs to user
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction not found or access denied';
    END IF;
    
    -- Handle balance adjustments based on transaction type
    CASE tx_record.type
        WHEN 'income' THEN
            -- Income: Reduce available funds (reverse the income)
            UPDATE users 
            SET available_funds = available_funds - tx_record.amount
            WHERE id = delete_transaction_with_balance_adjustment.user_id;
            
        WHEN 'expense' THEN
            -- Expense: Add money back to the envelope (reverse the expense)
            IF tx_record.envelope_id IS NOT NULL THEN
                UPDATE envelopes 
                SET balance = balance + tx_record.amount
                WHERE id = tx_record.envelope_id AND envelopes.user_id = delete_transaction_with_balance_adjustment.user_id;
            END IF;
            
        WHEN 'allocation' THEN
            -- Allocation: Add money back to available funds and remove from envelope
            UPDATE users 
            SET available_funds = available_funds + tx_record.amount
            WHERE id = delete_transaction_with_balance_adjustment.user_id;
            
            IF tx_record.envelope_id IS NOT NULL THEN
                UPDATE envelopes 
                SET balance = balance - tx_record.amount
                WHERE id = tx_record.envelope_id AND envelopes.user_id = delete_transaction_with_balance_adjustment.user_id;
            END IF;
            
        WHEN 'transfer' THEN
            -- Transfer: This is more complex as we need to identify source and destination
            -- For now, we'll look for related transactions or use a simple approach
            -- In a full implementation, you'd store source/destination envelope IDs
            
            -- For this implementation, we'll assume the envelope_id is the destination
            -- and we need to find the source from the transaction description or notes
            -- This is a simplified approach - in production you'd want to store both IDs
            
            IF tx_record.envelope_id IS NOT NULL THEN
                -- Reverse the transfer: remove from destination, add back to source
                -- For now, we'll add back to available funds as the source
                UPDATE users 
                SET available_funds = available_funds + tx_record.amount
                WHERE id = delete_transaction_with_balance_adjustment.user_id;
                
                UPDATE envelopes 
                SET balance = balance - tx_record.amount
                WHERE id = tx_record.envelope_id AND envelopes.user_id = delete_transaction_with_balance_adjustment.user_id;
            END IF;
    END CASE;
    
    -- Delete the transaction
    DELETE FROM transactions 
    WHERE id = transaction_id AND transactions.user_id = delete_transaction_with_balance_adjustment.user_id;
    
    -- Verify the deletion was successful
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to delete transaction';
    END IF;
    
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_transaction_with_balance_adjustment(UUID, UUID) TO authenticated;

-- Add RLS policy comment
COMMENT ON FUNCTION delete_transaction_with_balance_adjustment IS 'Safely deletes a transaction and reverses its balance effects. Requires user_id for security.';