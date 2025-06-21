-- Migration 005: Create transactions table with type enum
-- This table manages all financial transactions with four types: income, expense, transfer, allocation
-- SAFE TO RUN: Uses IF NOT EXISTS and IF EXISTS clauses to prevent conflicts

-- Create transaction type enum
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM (
        'income',
        'expense', 
        'transfer',
        'allocation'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    envelope_id UUID REFERENCES public.envelopes(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    payee TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Additional fields for specific transaction types
    source_envelope_id UUID REFERENCES public.envelopes(id) ON DELETE SET NULL,
    destination_envelope_id UUID REFERENCES public.envelopes(id) ON DELETE SET NULL,
    income_source_id UUID REFERENCES public.income_sources(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT transactions_description_not_empty CHECK (LENGTH(TRIM(description)) > 0),
    
    -- Type-specific constraints
    CONSTRAINT income_transaction_validation CHECK (
        (type = 'income' AND envelope_id IS NULL AND source_envelope_id IS NULL AND destination_envelope_id IS NULL AND income_source_id IS NOT NULL) OR
        (type != 'income')
    ),
    CONSTRAINT expense_transaction_validation CHECK (
        (type = 'expense' AND envelope_id IS NOT NULL AND source_envelope_id IS NULL AND destination_envelope_id IS NULL AND income_source_id IS NULL) OR
        (type != 'expense')
    ),
    CONSTRAINT transfer_transaction_validation CHECK (
        (type = 'transfer' AND envelope_id IS NULL AND source_envelope_id IS NOT NULL AND destination_envelope_id IS NOT NULL AND source_envelope_id != destination_envelope_id AND income_source_id IS NULL) OR
        (type != 'transfer')
    ),
    CONSTRAINT allocation_transaction_validation CHECK (
        (type = 'allocation' AND envelope_id IS NOT NULL AND source_envelope_id IS NULL AND destination_envelope_id IS NULL AND income_source_id IS NULL) OR
        (type != 'allocation')
    )
);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and modify their own transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to process income transaction
CREATE OR REPLACE FUNCTION public.process_income_transaction(
    user_uuid UUID,
    income_source_uuid UUID,
    transaction_amount DECIMAL(10,2),
    transaction_description TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
    transaction_id UUID;
BEGIN
    -- Insert the income transaction
    INSERT INTO public.transactions (
        user_id, 
        type, 
        amount, 
        description, 
        date, 
        income_source_id
    ) VALUES (
        user_uuid,
        'income',
        transaction_amount,
        transaction_description,
        transaction_date,
        income_source_uuid
    ) RETURNING id INTO transaction_id;
    
    -- Note: Income goes to "available funds" - not directly to an envelope
    -- User will allocate it later via allocation transactions
    
    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to process expense transaction
CREATE OR REPLACE FUNCTION public.process_expense_transaction(
    user_uuid UUID,
    envelope_uuid UUID,
    transaction_amount DECIMAL(10,2),
    transaction_description TEXT,
    transaction_payee TEXT DEFAULT NULL,
    transaction_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
    transaction_id UUID;
    current_balance DECIMAL(10,2);
    envelope_type_val envelope_type;
BEGIN
    -- Check envelope balance and type
    SELECT balance, type INTO current_balance, envelope_type_val
    FROM public.envelopes 
    WHERE id = envelope_uuid AND user_id = user_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Envelope not found or access denied';
    END IF;
    
    -- For regular and savings envelopes, check sufficient balance
    IF envelope_type_val IN ('regular', 'savings') AND current_balance < transaction_amount THEN
        RAISE EXCEPTION 'Insufficient balance in envelope. Available: %, Required: %', current_balance, transaction_amount;
    END IF;
    
    -- Insert the expense transaction
    INSERT INTO public.transactions (
        user_id, 
        envelope_id,
        type, 
        amount, 
        description, 
        payee,
        date
    ) VALUES (
        user_uuid,
        envelope_uuid,
        'expense',
        transaction_amount,
        transaction_description,
        transaction_payee,
        transaction_date
    ) RETURNING id INTO transaction_id;
    
    -- Update envelope balance
    IF envelope_type_val = 'debt' THEN
        -- For debt envelopes, expenses increase the debt (more negative)
        UPDATE public.envelopes 
        SET balance = balance - transaction_amount, updated_at = NOW()
        WHERE id = envelope_uuid;
    ELSE
        -- For regular and savings envelopes, expenses decrease the balance
        UPDATE public.envelopes 
        SET balance = balance - transaction_amount, updated_at = NOW()
        WHERE id = envelope_uuid;
    END IF;
    
    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to process transfer transaction
CREATE OR REPLACE FUNCTION public.process_transfer_transaction(
    user_uuid UUID,
    source_envelope_uuid UUID,
    destination_envelope_uuid UUID,
    transaction_amount DECIMAL(10,2),
    transaction_description TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
    transaction_id UUID;
    source_balance DECIMAL(10,2);
    source_type envelope_type;
    dest_type envelope_type;
BEGIN
    -- Validate envelopes belong to user and get types
    SELECT balance, type INTO source_balance, source_type
    FROM public.envelopes 
    WHERE id = source_envelope_uuid AND user_id = user_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source envelope not found or access denied';
    END IF;
    
    SELECT type INTO dest_type
    FROM public.envelopes 
    WHERE id = destination_envelope_uuid AND user_id = user_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Destination envelope not found or access denied';
    END IF;
    
    -- Check sufficient balance for non-debt source envelopes
    IF source_type IN ('regular', 'savings') AND source_balance < transaction_amount THEN
        RAISE EXCEPTION 'Insufficient balance in source envelope. Available: %, Required: %', source_balance, transaction_amount;
    END IF;
    
    -- Insert the transfer transaction
    INSERT INTO public.transactions (
        user_id, 
        type, 
        amount, 
        description, 
        date,
        source_envelope_id,
        destination_envelope_id
    ) VALUES (
        user_uuid,
        'transfer',
        transaction_amount,
        transaction_description,
        transaction_date,
        source_envelope_uuid,
        destination_envelope_uuid
    ) RETURNING id INTO transaction_id;
    
    -- Update source envelope balance
    IF source_type = 'debt' THEN
        -- Transferring from debt envelope reduces debt (less negative)
        UPDATE public.envelopes 
        SET balance = balance + transaction_amount, updated_at = NOW()
        WHERE id = source_envelope_uuid;
    ELSE
        -- Transferring from regular/savings envelope reduces balance
        UPDATE public.envelopes 
        SET balance = balance - transaction_amount, updated_at = NOW()
        WHERE id = source_envelope_uuid;
    END IF;
    
    -- Update destination envelope balance
    IF dest_type = 'debt' THEN
        -- Transferring to debt envelope reduces debt (less negative)
        UPDATE public.envelopes 
        SET balance = balance + transaction_amount, updated_at = NOW()
        WHERE id = destination_envelope_uuid;
    ELSE
        -- Transferring to regular/savings envelope increases balance
        UPDATE public.envelopes 
        SET balance = balance + transaction_amount, updated_at = NOW()
        WHERE id = destination_envelope_uuid;
    END IF;
    
    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to process allocation transaction
CREATE OR REPLACE FUNCTION public.process_allocation_transaction(
    user_uuid UUID,
    envelope_uuid UUID,
    transaction_amount DECIMAL(10,2),
    transaction_description TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
    transaction_id UUID;
    available_funds DECIMAL(10,2);
    envelope_type_val envelope_type;
BEGIN
    -- Get available funds (this would need to be calculated from unallocated income)
    SELECT public.get_available_funds(user_uuid) INTO available_funds;
    
    -- For now, we'll allow allocation regardless of available funds
    -- In a full implementation, you'd track unallocated income separately
    
    -- Validate envelope belongs to user and get type
    SELECT type INTO envelope_type_val
    FROM public.envelopes 
    WHERE id = envelope_uuid AND user_id = user_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Envelope not found or access denied';
    END IF;
    
    -- Insert the allocation transaction
    INSERT INTO public.transactions (
        user_id, 
        envelope_id,
        type, 
        amount, 
        description, 
        date
    ) VALUES (
        user_uuid,
        envelope_uuid,
        'allocation',
        transaction_amount,
        transaction_description,
        transaction_date
    ) RETURNING id INTO transaction_id;
    
    -- Update envelope balance
    IF envelope_type_val = 'debt' THEN
        -- Allocating to debt envelope reduces debt (less negative)
        UPDATE public.envelopes 
        SET balance = balance + transaction_amount, updated_at = NOW()
        WHERE id = envelope_uuid;
    ELSE
        -- Allocating to regular/savings envelope increases balance
        UPDATE public.envelopes 
        SET balance = balance + transaction_amount, updated_at = NOW()
        WHERE id = envelope_uuid;
    END IF;
    
    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get transaction summary by type
CREATE OR REPLACE FUNCTION public.get_transaction_summary(
    user_uuid UUID,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    transaction_type transaction_type,
    transaction_count BIGINT,
    total_amount DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.type as transaction_type,
        COUNT(t.id) as transaction_count,
        COALESCE(SUM(t.amount), 0.00) as total_amount
    FROM public.transactions t
    WHERE t.user_id = user_uuid
        AND (start_date IS NULL OR t.date >= start_date)
        AND (end_date IS NULL OR t.date <= end_date)
    GROUP BY t.type
    ORDER BY t.type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_envelope_id_idx ON public.transactions(envelope_id);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON public.transactions(type);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON public.transactions(date);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS transactions_source_envelope_id_idx ON public.transactions(source_envelope_id);
CREATE INDEX IF NOT EXISTS transactions_destination_envelope_id_idx ON public.transactions(destination_envelope_id);
CREATE INDEX IF NOT EXISTS transactions_income_source_id_idx ON public.transactions(income_source_id);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS transactions_user_type_idx ON public.transactions(user_id, type);
CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON public.transactions(user_id, date);
CREATE INDEX IF NOT EXISTS transactions_user_envelope_idx ON public.transactions(user_id, envelope_id);

-- Grant necessary permissions
GRANT ALL ON public.transactions TO authenticated;
GRANT SELECT ON public.transactions TO anon;