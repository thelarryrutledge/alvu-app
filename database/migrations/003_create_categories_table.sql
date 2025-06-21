-- Migration 003: Create categories table with default categories
-- This table manages envelope categories with three default categories and user-defined custom categories
-- SAFE TO RUN: Uses IF NOT EXISTS and IF EXISTS clauses to prevent conflicts

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6B7280', -- Default gray color
    icon TEXT, -- Optional icon name/class
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT categories_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT categories_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT categories_unique_name_per_user UNIQUE (user_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and modify their own categories
CREATE POLICY "Users can view own categories" ON public.categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own non-default categories" ON public.categories
    FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- Create function to create default categories for new users
CREATE OR REPLACE FUNCTION public.create_default_categories(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Insert the three default categories
    INSERT INTO public.categories (user_id, name, color, description, is_default, sort_order) VALUES
    (user_uuid, 'Unassigned', '#6B7280', 'Default category for unassigned envelopes', true, 1),
    (user_uuid, 'Savings', '#10B981', 'Category for savings goals and emergency funds', true, 2),
    (user_uuid, 'Debt', '#EF4444', 'Category for debt payments and loan management', true, 3);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user function to create default categories
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile
    INSERT INTO public.users (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
    );
    
    -- Create default categories
    PERFORM public.create_default_categories(NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get category statistics
CREATE OR REPLACE FUNCTION public.get_category_stats(user_uuid UUID)
RETURNS TABLE (
    category_id UUID,
    category_name TEXT,
    envelope_count BIGINT,
    total_balance DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as category_id,
        c.name as category_name,
        COALESCE(COUNT(e.id), 0) as envelope_count,
        COALESCE(SUM(e.balance), 0.00) as total_balance
    FROM public.categories c
    LEFT JOIN public.envelopes e ON c.id = e.category_id
    WHERE c.user_id = user_uuid
    GROUP BY c.id, c.name, c.sort_order
    ORDER BY c.sort_order, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reorder categories
CREATE OR REPLACE FUNCTION public.reorder_categories(
    user_uuid UUID,
    category_ids UUID[]
)
RETURNS VOID AS $$
DECLARE
    i INTEGER;
BEGIN
    -- Update sort_order for each category
    FOR i IN 1..array_length(category_ids, 1) LOOP
        UPDATE public.categories 
        SET sort_order = i, updated_at = NOW()
        WHERE id = category_ids[i] AND user_id = user_uuid;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS categories_is_default_idx ON public.categories(is_default);
CREATE INDEX IF NOT EXISTS categories_sort_order_idx ON public.categories(sort_order);
CREATE INDEX IF NOT EXISTS categories_name_idx ON public.categories(name);
CREATE INDEX IF NOT EXISTS categories_created_at_idx ON public.categories(created_at);

-- Create partial unique index to ensure only one default category per name per user
CREATE UNIQUE INDEX IF NOT EXISTS categories_unique_default_per_user
    ON public.categories(user_id, name)
    WHERE is_default = true;

-- Grant necessary permissions
GRANT ALL ON public.categories TO authenticated;
GRANT SELECT ON public.categories TO anon;