-- Migration 002: Create income_sources table with frequency enum
-- This table manages multiple income sources for users with configurable frequencies
-- SAFE TO RUN: Uses IF NOT EXISTS and IF EXISTS clauses to prevent conflicts

-- Create frequency enum type
DO $$ BEGIN
    CREATE TYPE income_frequency AS ENUM (
        'weekly',
        'bi-weekly', 
        'semi-monthly',
        'monthly',
        'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create income_sources table
CREATE TABLE IF NOT EXISTS public.income_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    frequency income_frequency NOT NULL DEFAULT 'monthly',
    custom_frequency_days INTEGER CHECK (custom_frequency_days > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    next_expected_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT income_sources_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT custom_frequency_validation CHECK (
        (frequency = 'custom' AND custom_frequency_days IS NOT NULL) OR
        (frequency != 'custom' AND custom_frequency_days IS NULL)
    )
);

-- Enable Row Level Security
ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and modify their own income sources
CREATE POLICY "Users can view own income sources" ON public.income_sources
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income sources" ON public.income_sources
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income sources" ON public.income_sources
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income sources" ON public.income_sources
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to calculate next expected date based on frequency
CREATE OR REPLACE FUNCTION public.calculate_next_income_date(
    frequency_type income_frequency,
    custom_days INTEGER DEFAULT NULL,
    last_date DATE DEFAULT CURRENT_DATE
)
RETURNS DATE AS $$
BEGIN
    CASE frequency_type
        WHEN 'weekly' THEN
            RETURN last_date + INTERVAL '7 days';
        WHEN 'bi-weekly' THEN
            RETURN last_date + INTERVAL '14 days';
        WHEN 'semi-monthly' THEN
            -- Semi-monthly: 15th and last day of month
            IF EXTRACT(DAY FROM last_date) <= 15 THEN
                RETURN (DATE_TRUNC('month', last_date) + INTERVAL '1 month - 1 day')::DATE;
            ELSE
                RETURN (DATE_TRUNC('month', last_date) + INTERVAL '1 month' + INTERVAL '14 days')::DATE;
            END IF;
        WHEN 'monthly' THEN
            RETURN last_date + INTERVAL '1 month';
        WHEN 'custom' THEN
            IF custom_days IS NULL THEN
                RAISE EXCEPTION 'Custom frequency requires custom_days parameter';
            END IF;
            RETURN last_date + (custom_days || ' days')::INTERVAL;
        ELSE
            RAISE EXCEPTION 'Invalid frequency type: %', frequency_type;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_income_sources_updated_at
    BEFORE UPDATE ON public.income_sources
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to set next_expected_date on insert/update
CREATE OR REPLACE FUNCTION public.set_next_income_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if next_expected_date is not manually set
    IF NEW.next_expected_date IS NULL THEN
        NEW.next_expected_date = public.calculate_next_income_date(
            NEW.frequency,
            NEW.custom_frequency_days,
            CURRENT_DATE
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_income_sources_next_date
    BEFORE INSERT OR UPDATE ON public.income_sources
    FOR EACH ROW EXECUTE FUNCTION public.set_next_income_date();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS income_sources_user_id_idx ON public.income_sources(user_id);
CREATE INDEX IF NOT EXISTS income_sources_frequency_idx ON public.income_sources(frequency);
CREATE INDEX IF NOT EXISTS income_sources_is_active_idx ON public.income_sources(is_active);
CREATE INDEX IF NOT EXISTS income_sources_next_expected_date_idx ON public.income_sources(next_expected_date);
CREATE INDEX IF NOT EXISTS income_sources_created_at_idx ON public.income_sources(created_at);

-- Grant necessary permissions
GRANT ALL ON public.income_sources TO authenticated;
GRANT SELECT ON public.income_sources TO anon;