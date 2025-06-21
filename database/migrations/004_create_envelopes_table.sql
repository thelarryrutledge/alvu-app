-- Migration 004: Create envelopes table with type enum
-- This table manages budget envelopes with three types: regular, savings, and debt
-- SAFE TO RUN: Uses IF NOT EXISTS and IF EXISTS clauses to prevent conflicts

-- Create envelope type enum
DO $$ BEGIN
    CREATE TYPE envelope_type AS ENUM (
        'regular',
        'savings', 
        'debt'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create envelopes table
CREATE TABLE IF NOT EXISTS public.envelopes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT NOT NULL,
    name TEXT NOT NULL,
    type envelope_type NOT NULL DEFAULT 'regular',
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    target_amount DECIMAL(10,2) CHECK (target_amount >= 0),
    target_date DATE,
    apr DECIMAL(5,2) CHECK (apr >= 0 AND apr <= 100),
    minimum_payment DECIMAL(10,2) CHECK (minimum_payment >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT envelopes_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT envelopes_unique_name_per_user UNIQUE (user_id, name),
    
    -- Type-specific constraints
    CONSTRAINT savings_envelope_validation CHECK (
        (type = 'savings' AND target_amount IS NOT NULL) OR
        (type != 'savings')
    ),
    CONSTRAINT debt_envelope_validation CHECK (
        (type = 'debt' AND balance <= 0 AND apr IS NOT NULL) OR
        (type != 'debt')
    ),
    CONSTRAINT regular_envelope_validation CHECK (
        (type = 'regular' AND balance >= 0 AND apr IS NULL AND minimum_payment IS NULL) OR
        (type != 'regular')
    )
);

-- Enable Row Level Security
ALTER TABLE public.envelopes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and modify their own envelopes
CREATE POLICY "Users can view own envelopes" ON public.envelopes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own envelopes" ON public.envelopes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own envelopes" ON public.envelopes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own envelopes" ON public.envelopes
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to get envelope summary by type
CREATE OR REPLACE FUNCTION public.get_envelope_summary(user_uuid UUID)
RETURNS TABLE (
    envelope_type envelope_type,
    envelope_count BIGINT,
    total_balance DECIMAL(10,2),
    total_target DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.type as envelope_type,
        COUNT(e.id) as envelope_count,
        COALESCE(SUM(e.balance), 0.00) as total_balance,
        COALESCE(SUM(e.target_amount), 0.00) as total_target
    FROM public.envelopes e
    WHERE e.user_id = user_uuid
    GROUP BY e.type
    ORDER BY e.type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get available funds (total of all positive envelope balances)
CREATE OR REPLACE FUNCTION public.get_available_funds(user_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(balance) 
         FROM public.envelopes 
         WHERE user_id = user_uuid AND balance > 0),
        0.00
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get debt total (absolute value of negative balances)
CREATE OR REPLACE FUNCTION public.get_total_debt(user_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
BEGIN
    RETURN COALESCE(
        (SELECT ABS(SUM(balance)) 
         FROM public.envelopes 
         WHERE user_id = user_uuid AND type = 'debt' AND balance < 0),
        0.00
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate savings progress percentage
CREATE OR REPLACE FUNCTION public.calculate_savings_progress(
    current_balance DECIMAL(10,2),
    target_amount DECIMAL(10,2)
)
RETURNS DECIMAL(5,2) AS $$
BEGIN
    IF target_amount IS NULL OR target_amount = 0 THEN
        RETURN 0.00;
    END IF;
    
    RETURN LEAST(100.00, (current_balance / target_amount) * 100);
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate debt payoff progress (reverse progress)
CREATE OR REPLACE FUNCTION public.calculate_debt_progress(
    current_balance DECIMAL(10,2),
    original_balance DECIMAL(10,2)
)
RETURNS DECIMAL(5,2) AS $$
BEGIN
    IF original_balance IS NULL OR original_balance = 0 THEN
        RETURN 0.00;
    END IF;
    
    -- For debt, progress is how much we've paid off
    -- current_balance is negative, original_balance should be negative
    -- Progress = (original - current) / original * 100
    RETURN LEAST(100.00, ((original_balance - current_balance) / ABS(original_balance)) * 100);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_envelopes_updated_at
    BEFORE UPDATE ON public.envelopes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to validate envelope balance changes
CREATE OR REPLACE FUNCTION public.validate_envelope_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- For regular and savings envelopes, balance should not go negative
    IF NEW.type IN ('regular', 'savings') AND NEW.balance < 0 THEN
        RAISE EXCEPTION 'Balance cannot be negative for % envelopes', NEW.type;
    END IF;
    
    -- For debt envelopes, balance should not go positive
    IF NEW.type = 'debt' AND NEW.balance > 0 THEN
        RAISE EXCEPTION 'Debt envelope balance cannot be positive';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_envelope_balance_trigger
    BEFORE INSERT OR UPDATE ON public.envelopes
    FOR EACH ROW EXECUTE FUNCTION public.validate_envelope_balance();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS envelopes_user_id_idx ON public.envelopes(user_id);
CREATE INDEX IF NOT EXISTS envelopes_category_id_idx ON public.envelopes(category_id);
CREATE INDEX IF NOT EXISTS envelopes_type_idx ON public.envelopes(type);
CREATE INDEX IF NOT EXISTS envelopes_balance_idx ON public.envelopes(balance);
CREATE INDEX IF NOT EXISTS envelopes_target_date_idx ON public.envelopes(target_date);
CREATE INDEX IF NOT EXISTS envelopes_created_at_idx ON public.envelopes(created_at);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS envelopes_user_type_idx ON public.envelopes(user_id, type);
CREATE INDEX IF NOT EXISTS envelopes_user_category_idx ON public.envelopes(user_id, category_id);

-- Grant necessary permissions
GRANT ALL ON public.envelopes TO authenticated;
GRANT SELECT ON public.envelopes TO anon;