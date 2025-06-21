-- Migration 006: Create allocations table for income distribution
-- This table manages allocation rules and history for distributing income to envelopes
-- SAFE TO RUN: Uses IF NOT EXISTS and IF EXISTS clauses to prevent conflicts

-- Create allocations table
CREATE TABLE IF NOT EXISTS public.allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    envelope_id UUID REFERENCES public.envelopes(id) ON DELETE CASCADE NOT NULL,
    income_source_id UUID REFERENCES public.income_sources(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    percentage DECIMAL(5,2) CHECK (percentage > 0 AND percentage <= 100),
    is_percentage BOOLEAN NOT NULL DEFAULT false,
    is_automatic BOOLEAN NOT NULL DEFAULT false,
    priority INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT allocations_amount_or_percentage CHECK (
        (is_percentage = true AND percentage IS NOT NULL AND amount > 0) OR
        (is_percentage = false AND percentage IS NULL AND amount > 0)
    ),
    CONSTRAINT allocations_unique_envelope_income_source UNIQUE (envelope_id, income_source_id)
);

-- Enable Row Level Security
ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and modify their own allocations
CREATE POLICY "Users can view own allocations" ON public.allocations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own allocations" ON public.allocations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own allocations" ON public.allocations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own allocations" ON public.allocations
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to calculate allocation amount
CREATE OR REPLACE FUNCTION public.calculate_allocation_amount(
    allocation_record public.allocations,
    income_amount DECIMAL(10,2)
)
RETURNS DECIMAL(10,2) AS $$
BEGIN
    IF allocation_record.is_percentage THEN
        RETURN ROUND((income_amount * allocation_record.percentage / 100), 2);
    ELSE
        RETURN allocation_record.amount;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get allocation rules for income source
CREATE OR REPLACE FUNCTION public.get_allocation_rules(
    user_uuid UUID,
    income_source_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
    allocation_id UUID,
    envelope_id UUID,
    envelope_name TEXT,
    amount DECIMAL(10,2),
    percentage DECIMAL(5,2),
    is_percentage BOOLEAN,
    is_automatic BOOLEAN,
    priority INTEGER,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as allocation_id,
        a.envelope_id,
        e.name as envelope_name,
        a.amount,
        a.percentage,
        a.is_percentage,
        a.is_automatic,
        a.priority,
        a.description
    FROM public.allocations a
    JOIN public.envelopes e ON a.envelope_id = e.id
    WHERE a.user_id = user_uuid
        AND (income_source_uuid IS NULL OR a.income_source_id = income_source_uuid OR a.income_source_id IS NULL)
    ORDER BY a.priority DESC, a.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to process automatic allocations
CREATE OR REPLACE FUNCTION public.process_automatic_allocations(
    user_uuid UUID,
    income_source_uuid UUID,
    income_amount DECIMAL(10,2)
)
RETURNS TABLE (
    envelope_id UUID,
    allocated_amount DECIMAL(10,2),
    transaction_id UUID
) AS $$
DECLARE
    allocation_rule RECORD;
    calculated_amount DECIMAL(10,2);
    remaining_amount DECIMAL(10,2) := income_amount;
    new_transaction_id UUID;
BEGIN
    -- Process automatic allocations in priority order
    FOR allocation_rule IN 
        SELECT * FROM public.allocations 
        WHERE user_id = user_uuid 
            AND (income_source_id = income_source_uuid OR income_source_id IS NULL)
            AND is_automatic = true
        ORDER BY priority DESC, created_at
    LOOP
        -- Calculate allocation amount
        calculated_amount := public.calculate_allocation_amount(allocation_rule, income_amount);
        
        -- Don't allocate more than remaining amount
        calculated_amount := LEAST(calculated_amount, remaining_amount);
        
        IF calculated_amount > 0 THEN
            -- Create allocation transaction
            INSERT INTO public.transactions (
                user_id,
                envelope_id,
                type,
                amount,
                description,
                date
            ) VALUES (
                user_uuid,
                allocation_rule.envelope_id,
                'allocation',
                calculated_amount,
                COALESCE(allocation_rule.description, 'Automatic allocation'),
                CURRENT_DATE
            ) RETURNING id INTO new_transaction_id;
            
            -- Update envelope balance
            UPDATE public.envelopes 
            SET balance = balance + calculated_amount, updated_at = NOW()
            WHERE id = allocation_rule.envelope_id;
            
            -- Update remaining amount
            remaining_amount := remaining_amount - calculated_amount;
            
            -- Return the allocation details
            envelope_id := allocation_rule.envelope_id;
            allocated_amount := calculated_amount;
            transaction_id := new_transaction_id;
            RETURN NEXT;
            
            -- Stop if no remaining amount
            IF remaining_amount <= 0 THEN
                EXIT;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate allocation percentages
CREATE OR REPLACE FUNCTION public.validate_allocation_percentages(
    user_uuid UUID,
    income_source_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
    total_percentage DECIMAL(5,2),
    is_valid BOOLEAN,
    message TEXT
) AS $$
DECLARE
    total_pct DECIMAL(5,2);
BEGIN
    SELECT COALESCE(SUM(percentage), 0) INTO total_pct
    FROM public.allocations
    WHERE user_id = user_uuid
        AND is_percentage = true
        AND (income_source_uuid IS NULL OR income_source_id = income_source_uuid OR income_source_id IS NULL);
    
    total_percentage := total_pct;
    
    IF total_pct > 100 THEN
        is_valid := false;
        message := 'Total allocation percentages exceed 100%';
    ELSIF total_pct = 100 THEN
        is_valid := true;
        message := 'All income will be allocated automatically';
    ELSE
        is_valid := true;
        message := FORMAT('%.2f%% of income will be allocated automatically', total_pct);
    END IF;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_allocations_updated_at
    BEFORE UPDATE ON public.allocations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS allocations_user_id_idx ON public.allocations(user_id);
CREATE INDEX IF NOT EXISTS allocations_envelope_id_idx ON public.allocations(envelope_id);
CREATE INDEX IF NOT EXISTS allocations_income_source_id_idx ON public.allocations(income_source_id);
CREATE INDEX IF NOT EXISTS allocations_is_automatic_idx ON public.allocations(is_automatic);
CREATE INDEX IF NOT EXISTS allocations_priority_idx ON public.allocations(priority);
CREATE INDEX IF NOT EXISTS allocations_created_at_idx ON public.allocations(created_at);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS allocations_user_envelope_idx ON public.allocations(user_id, envelope_id);
CREATE INDEX IF NOT EXISTS allocations_user_income_source_idx ON public.allocations(user_id, income_source_id);
CREATE INDEX IF NOT EXISTS allocations_automatic_priority_idx ON public.allocations(is_automatic, priority);

-- Grant necessary permissions
GRANT ALL ON public.allocations TO authenticated;
GRANT SELECT ON public.allocations TO anon;