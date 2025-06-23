-- Migration 009: Create transaction tags system
-- This adds support for custom tags on transactions for better organization and filtering
-- SAFE TO RUN: Uses IF NOT EXISTS and IF EXISTS clauses to prevent conflicts

-- Create transaction_tags table
CREATE TABLE IF NOT EXISTS public.transaction_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280', -- Default gray color
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT transaction_tags_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT transaction_tags_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT transaction_tags_user_name_unique UNIQUE (user_id, name)
);

-- Create transaction_tag_assignments table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.transaction_tag_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES public.transaction_tags(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure unique assignment per transaction-tag pair
    CONSTRAINT transaction_tag_assignments_unique UNIQUE (transaction_id, tag_id)
);

-- Enable Row Level Security
ALTER TABLE public.transaction_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transaction_tags
CREATE POLICY "Users can view own transaction tags" ON public.transaction_tags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transaction tags" ON public.transaction_tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transaction tags" ON public.transaction_tags
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transaction tags" ON public.transaction_tags
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for transaction_tag_assignments
CREATE POLICY "Users can view own transaction tag assignments" ON public.transaction_tag_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.transactions t 
            WHERE t.id = transaction_id AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own transaction tag assignments" ON public.transaction_tag_assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.transactions t 
            WHERE t.id = transaction_id AND t.user_id = auth.uid()
        ) AND
        EXISTS (
            SELECT 1 FROM public.transaction_tags tt 
            WHERE tt.id = tag_id AND tt.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own transaction tag assignments" ON public.transaction_tag_assignments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.transactions t 
            WHERE t.id = transaction_id AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own transaction tag assignments" ON public.transaction_tag_assignments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.transactions t 
            WHERE t.id = transaction_id AND t.user_id = auth.uid()
        )
    );

-- Create function to get transaction tags for a user
CREATE OR REPLACE FUNCTION public.get_user_transaction_tags(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(50),
    color VARCHAR(7),
    description TEXT,
    usage_count BIGINT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tt.id,
        tt.name,
        tt.color,
        tt.description,
        COUNT(tta.id) as usage_count,
        tt.created_at
    FROM public.transaction_tags tt
    LEFT JOIN public.transaction_tag_assignments tta ON tt.id = tta.tag_id
    WHERE tt.user_id = user_uuid
    GROUP BY tt.id, tt.name, tt.color, tt.description, tt.created_at
    ORDER BY tt.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get tags for a specific transaction
CREATE OR REPLACE FUNCTION public.get_transaction_tags(transaction_uuid UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(50),
    color VARCHAR(7),
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tt.id,
        tt.name,
        tt.color,
        tt.description
    FROM public.transaction_tags tt
    INNER JOIN public.transaction_tag_assignments tta ON tt.id = tta.tag_id
    WHERE tta.transaction_id = transaction_uuid
    ORDER BY tt.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to assign tags to a transaction
CREATE OR REPLACE FUNCTION public.assign_transaction_tags(
    transaction_uuid UUID,
    tag_ids UUID[]
)
RETURNS VOID AS $$
DECLARE
    tag_id UUID;
    user_uuid UUID;
BEGIN
    -- Get the user_id for the transaction
    SELECT user_id INTO user_uuid
    FROM public.transactions
    WHERE id = transaction_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction not found';
    END IF;
    
    -- Verify user owns the transaction
    IF user_uuid != auth.uid() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Remove existing tag assignments for this transaction
    DELETE FROM public.transaction_tag_assignments
    WHERE transaction_id = transaction_uuid;
    
    -- Add new tag assignments
    FOREACH tag_id IN ARRAY tag_ids
    LOOP
        -- Verify user owns the tag
        IF EXISTS (
            SELECT 1 FROM public.transaction_tags 
            WHERE id = tag_id AND user_id = user_uuid
        ) THEN
            INSERT INTO public.transaction_tag_assignments (transaction_id, tag_id)
            VALUES (transaction_uuid, tag_id)
            ON CONFLICT (transaction_id, tag_id) DO NOTHING;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create or get a tag by name
CREATE OR REPLACE FUNCTION public.create_or_get_transaction_tag(
    user_uuid UUID,
    tag_name VARCHAR(50),
    tag_color VARCHAR(7) DEFAULT '#6B7280'
)
RETURNS UUID AS $$
DECLARE
    tag_id UUID;
BEGIN
    -- Try to get existing tag
    SELECT id INTO tag_id
    FROM public.transaction_tags
    WHERE user_id = user_uuid AND LOWER(name) = LOWER(tag_name);
    
    -- If not found, create new tag
    IF NOT FOUND THEN
        INSERT INTO public.transaction_tags (user_id, name, color)
        VALUES (user_uuid, tag_name, tag_color)
        RETURNING id INTO tag_id;
    END IF;
    
    RETURN tag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update updated_at for transaction_tags
CREATE TRIGGER update_transaction_tags_updated_at
    BEFORE UPDATE ON public.transaction_tags
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS transaction_tags_user_id_idx ON public.transaction_tags(user_id);
CREATE INDEX IF NOT EXISTS transaction_tags_name_idx ON public.transaction_tags(name);
CREATE INDEX IF NOT EXISTS transaction_tag_assignments_transaction_id_idx ON public.transaction_tag_assignments(transaction_id);
CREATE INDEX IF NOT EXISTS transaction_tag_assignments_tag_id_idx ON public.transaction_tag_assignments(tag_id);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS transaction_tags_user_name_idx ON public.transaction_tags(user_id, name);

-- Grant necessary permissions
GRANT ALL ON public.transaction_tags TO authenticated;
GRANT ALL ON public.transaction_tag_assignments TO authenticated;
GRANT SELECT ON public.transaction_tags TO anon;
GRANT SELECT ON public.transaction_tag_assignments TO anon;