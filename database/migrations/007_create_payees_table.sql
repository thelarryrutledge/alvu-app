-- Migration 007: Create payees table for saved payee information
-- This table manages saved payee information for quick expense entry
-- SAFE TO RUN: Uses IF NOT EXISTS and IF EXISTS clauses to prevent conflicts

-- Create payees table
CREATE TABLE IF NOT EXISTS public.payees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    default_envelope_id UUID REFERENCES public.envelopes(id) ON DELETE SET NULL,
    default_amount DECIMAL(10,2) CHECK (default_amount > 0),
    notes TEXT,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT payees_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT payees_unique_name_per_user UNIQUE (user_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.payees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and modify their own payees
CREATE POLICY "Users can view own payees" ON public.payees
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payees" ON public.payees
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payees" ON public.payees
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payees" ON public.payees
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to get or create payee
CREATE OR REPLACE FUNCTION public.get_or_create_payee(
    user_uuid UUID,
    payee_name TEXT,
    payee_category TEXT DEFAULT NULL,
    envelope_uuid UUID DEFAULT NULL,
    amount DECIMAL(10,2) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    payee_id UUID;
    existing_payee RECORD;
BEGIN
    -- Clean up the payee name
    payee_name := TRIM(payee_name);
    
    IF LENGTH(payee_name) = 0 THEN
        RAISE EXCEPTION 'Payee name cannot be empty';
    END IF;
    
    -- Try to find existing payee
    SELECT id, default_envelope_id, default_amount INTO existing_payee
    FROM public.payees 
    WHERE user_id = user_uuid AND LOWER(name) = LOWER(payee_name);
    
    IF FOUND THEN
        payee_id := existing_payee.id;
        
        -- Update usage statistics
        UPDATE public.payees 
        SET 
            usage_count = usage_count + 1,
            last_used_at = NOW(),
            updated_at = NOW(),
            -- Update defaults if provided and not already set
            default_envelope_id = COALESCE(existing_payee.default_envelope_id, envelope_uuid),
            default_amount = COALESCE(existing_payee.default_amount, amount)
        WHERE id = payee_id;
    ELSE
        -- Create new payee
        INSERT INTO public.payees (
            user_id,
            name,
            category,
            default_envelope_id,
            default_amount,
            usage_count,
            last_used_at
        ) VALUES (
            user_uuid,
            payee_name,
            payee_category,
            envelope_uuid,
            amount,
            1,
            NOW()
        ) RETURNING id INTO payee_id;
    END IF;
    
    RETURN payee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get payee suggestions
CREATE OR REPLACE FUNCTION public.get_payee_suggestions(
    user_uuid UUID,
    search_term TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    payee_id UUID,
    payee_name TEXT,
    category TEXT,
    default_envelope_id UUID,
    default_envelope_name TEXT,
    default_amount DECIMAL(10,2),
    usage_count INTEGER,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_favorite BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as payee_id,
        p.name as payee_name,
        p.category,
        p.default_envelope_id,
        e.name as default_envelope_name,
        p.default_amount,
        p.usage_count,
        p.last_used_at,
        p.is_favorite
    FROM public.payees p
    LEFT JOIN public.envelopes e ON p.default_envelope_id = e.id
    WHERE p.user_id = user_uuid
        AND (search_term IS NULL OR p.name ILIKE '%' || search_term || '%')
    ORDER BY 
        p.is_favorite DESC,
        p.usage_count DESC,
        p.last_used_at DESC NULLS LAST,
        p.name
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get payees by category
CREATE OR REPLACE FUNCTION public.get_payees_by_category(
    user_uuid UUID
)
RETURNS TABLE (
    category TEXT,
    payee_count BIGINT,
    payees JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(p.category, 'Uncategorized') as category,
        COUNT(p.id) as payee_count,
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'id', p.id,
                'name', p.name,
                'default_envelope_id', p.default_envelope_id,
                'default_amount', p.default_amount,
                'usage_count', p.usage_count,
                'is_favorite', p.is_favorite,
                'last_used_at', p.last_used_at
            ) ORDER BY p.is_favorite DESC, p.usage_count DESC, p.name
        ) as payees
    FROM public.payees p
    WHERE p.user_id = user_uuid
    GROUP BY COALESCE(p.category, 'Uncategorized')
    ORDER BY category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update payee usage
CREATE OR REPLACE FUNCTION public.update_payee_usage(
    payee_uuid UUID,
    user_uuid UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.payees 
    SET 
        usage_count = usage_count + 1,
        last_used_at = NOW(),
        updated_at = NOW()
    WHERE id = payee_uuid AND user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to merge payees
CREATE OR REPLACE FUNCTION public.merge_payees(
    user_uuid UUID,
    source_payee_uuid UUID,
    target_payee_uuid UUID
)
RETURNS VOID AS $$
DECLARE
    source_payee RECORD;
    target_payee RECORD;
BEGIN
    -- Get payee information
    SELECT * INTO source_payee FROM public.payees WHERE id = source_payee_uuid AND user_id = user_uuid;
    SELECT * INTO target_payee FROM public.payees WHERE id = target_payee_uuid AND user_id = user_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'One or both payees not found or access denied';
    END IF;
    
    -- Update all transactions to use target payee
    UPDATE public.transactions 
    SET payee = target_payee.name, updated_at = NOW()
    WHERE user_id = user_uuid AND payee = source_payee.name;
    
    -- Update target payee with combined usage statistics
    UPDATE public.payees 
    SET 
        usage_count = usage_count + source_payee.usage_count,
        last_used_at = GREATEST(last_used_at, source_payee.last_used_at),
        is_favorite = is_favorite OR source_payee.is_favorite,
        -- Keep existing defaults unless target doesn't have them
        default_envelope_id = COALESCE(default_envelope_id, source_payee.default_envelope_id),
        default_amount = COALESCE(default_amount, source_payee.default_amount),
        category = COALESCE(category, source_payee.category),
        notes = CASE 
            WHEN notes IS NULL THEN source_payee.notes
            WHEN source_payee.notes IS NULL THEN notes
            ELSE notes || E'\n\n' || source_payee.notes
        END,
        updated_at = NOW()
    WHERE id = target_payee_uuid;
    
    -- Delete source payee
    DELETE FROM public.payees WHERE id = source_payee_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up unused payees
CREATE OR REPLACE FUNCTION public.cleanup_unused_payees(
    user_uuid UUID,
    days_unused INTEGER DEFAULT 365
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.payees 
    WHERE user_id = user_uuid 
        AND usage_count = 0 
        AND is_favorite = false
        AND (last_used_at IS NULL OR last_used_at < NOW() - (days_unused || ' days')::INTERVAL)
        AND created_at < NOW() - (days_unused || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_payees_updated_at
    BEFORE UPDATE ON public.payees
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS payees_user_id_idx ON public.payees(user_id);
CREATE INDEX IF NOT EXISTS payees_name_idx ON public.payees(name);
CREATE INDEX IF NOT EXISTS payees_category_idx ON public.payees(category);
CREATE INDEX IF NOT EXISTS payees_default_envelope_id_idx ON public.payees(default_envelope_id);
CREATE INDEX IF NOT EXISTS payees_is_favorite_idx ON public.payees(is_favorite);
CREATE INDEX IF NOT EXISTS payees_usage_count_idx ON public.payees(usage_count);
CREATE INDEX IF NOT EXISTS payees_last_used_at_idx ON public.payees(last_used_at);
CREATE INDEX IF NOT EXISTS payees_created_at_idx ON public.payees(created_at);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS payees_user_name_idx ON public.payees(user_id, name);
CREATE INDEX IF NOT EXISTS payees_user_category_idx ON public.payees(user_id, category);
CREATE INDEX IF NOT EXISTS payees_user_favorite_usage_idx ON public.payees(user_id, is_favorite, usage_count);

-- Create text search index for payee names
CREATE INDEX IF NOT EXISTS payees_name_search_idx ON public.payees USING gin(to_tsvector('english', name));

-- Grant necessary permissions
GRANT ALL ON public.payees TO authenticated;
GRANT SELECT ON public.payees TO anon;