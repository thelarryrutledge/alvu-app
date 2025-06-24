-- Migration 010: Create goal history tracking table
-- This table tracks changes and milestones for savings goals
-- SAFE TO RUN: Uses IF NOT EXISTS and IF EXISTS clauses to prevent conflicts

-- Create goal history event type enum
DO $$ BEGIN
    CREATE TYPE goal_history_event_type AS ENUM (
        'goal_created',
        'goal_modified',
        'milestone_reached',
        'goal_completed',
        'progress_update',
        'target_date_changed',
        'target_amount_changed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create goal_history table
CREATE TABLE IF NOT EXISTS public.goal_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    envelope_id UUID REFERENCES public.envelopes(id) ON DELETE CASCADE NOT NULL,
    event_type goal_history_event_type NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Goal state at time of event
    balance_at_event DECIMAL(10,2) NOT NULL,
    target_amount_at_event DECIMAL(10,2),
    target_date_at_event DATE,
    progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    
    -- Change details (for modification events)
    previous_target_amount DECIMAL(10,2),
    previous_target_date DATE,
    previous_progress_percentage DECIMAL(5,2),
    
    -- Milestone details (for milestone events)
    milestone_percentage INTEGER CHECK (milestone_percentage IN (25, 50, 75, 100)),
    
    -- Additional metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT goal_history_progress_valid CHECK (
        progress_percentage >= 0 AND progress_percentage <= 100
    ),
    CONSTRAINT goal_history_previous_progress_valid CHECK (
        previous_progress_percentage IS NULL OR 
        (previous_progress_percentage >= 0 AND previous_progress_percentage <= 100)
    )
);

-- Enable Row Level Security
ALTER TABLE public.goal_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and modify their own goal history
CREATE POLICY "Users can view own goal history" ON public.goal_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal history" ON public.goal_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goal history" ON public.goal_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal history" ON public.goal_history
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to add goal history entry
CREATE OR REPLACE FUNCTION public.add_goal_history_entry(
    p_user_id UUID,
    p_envelope_id UUID,
    p_event_type goal_history_event_type,
    p_balance_at_event DECIMAL(10,2),
    p_target_amount_at_event DECIMAL(10,2) DEFAULT NULL,
    p_target_date_at_event DATE DEFAULT NULL,
    p_progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    p_previous_target_amount DECIMAL(10,2) DEFAULT NULL,
    p_previous_target_date DATE DEFAULT NULL,
    p_previous_progress_percentage DECIMAL(5,2) DEFAULT NULL,
    p_milestone_percentage INTEGER DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    history_id UUID;
BEGIN
    INSERT INTO public.goal_history (
        user_id,
        envelope_id,
        event_type,
        balance_at_event,
        target_amount_at_event,
        target_date_at_event,
        progress_percentage,
        previous_target_amount,
        previous_target_date,
        previous_progress_percentage,
        milestone_percentage,
        notes,
        metadata
    ) VALUES (
        p_user_id,
        p_envelope_id,
        p_event_type,
        p_balance_at_event,
        p_target_amount_at_event,
        p_target_date_at_event,
        p_progress_percentage,
        p_previous_target_amount,
        p_previous_target_date,
        p_previous_progress_percentage,
        p_milestone_percentage,
        p_notes,
        p_metadata
    ) RETURNING id INTO history_id;
    
    RETURN history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get goal history for an envelope
CREATE OR REPLACE FUNCTION public.get_goal_history(
    p_user_id UUID,
    p_envelope_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    event_type goal_history_event_type,
    event_date TIMESTAMP WITH TIME ZONE,
    balance_at_event DECIMAL(10,2),
    target_amount_at_event DECIMAL(10,2),
    target_date_at_event DATE,
    progress_percentage DECIMAL(5,2),
    previous_target_amount DECIMAL(10,2),
    previous_target_date DATE,
    previous_progress_percentage DECIMAL(5,2),
    milestone_percentage INTEGER,
    notes TEXT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gh.id,
        gh.event_type,
        gh.event_date,
        gh.balance_at_event,
        gh.target_amount_at_event,
        gh.target_date_at_event,
        gh.progress_percentage,
        gh.previous_target_amount,
        gh.previous_target_date,
        gh.previous_progress_percentage,
        gh.milestone_percentage,
        gh.notes,
        gh.metadata
    FROM public.goal_history gh
    WHERE gh.user_id = p_user_id 
      AND gh.envelope_id = p_envelope_id
    ORDER BY gh.event_date DESC, gh.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get goal history summary
CREATE OR REPLACE FUNCTION public.get_goal_history_summary(
    p_user_id UUID,
    p_envelope_id UUID
)
RETURNS TABLE (
    total_events BIGINT,
    milestones_reached INTEGER,
    modifications_made INTEGER,
    days_since_created INTEGER,
    first_event_date TIMESTAMP WITH TIME ZONE,
    last_event_date TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN gh.event_type = 'milestone_reached' THEN 1 END)::INTEGER as milestones_reached,
        COUNT(CASE WHEN gh.event_type IN ('goal_modified', 'target_date_changed', 'target_amount_changed') THEN 1 END)::INTEGER as modifications_made,
        COALESCE(EXTRACT(DAY FROM NOW() - MIN(gh.event_date))::INTEGER, 0) as days_since_created,
        MIN(gh.event_date) as first_event_date,
        MAX(gh.event_date) as last_event_date,
        MAX(CASE WHEN gh.event_type = 'goal_completed' THEN gh.event_date END) as completion_date
    FROM public.goal_history gh
    WHERE gh.user_id = p_user_id 
      AND gh.envelope_id = p_envelope_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get progress timeline
CREATE OR REPLACE FUNCTION public.get_progress_timeline(
    p_user_id UUID,
    p_envelope_id UUID,
    p_days_back INTEGER DEFAULT 90
)
RETURNS TABLE (
    event_date DATE,
    progress_percentage DECIMAL(5,2),
    balance_at_event DECIMAL(10,2),
    target_amount_at_event DECIMAL(10,2),
    event_type goal_history_event_type
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gh.event_date::DATE as event_date,
        gh.progress_percentage,
        gh.balance_at_event,
        gh.target_amount_at_event,
        gh.event_type
    FROM public.goal_history gh
    WHERE gh.user_id = p_user_id 
      AND gh.envelope_id = p_envelope_id
      AND gh.event_date >= NOW() - INTERVAL '1 day' * p_days_back
    ORDER BY gh.event_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically track goal creation
CREATE OR REPLACE FUNCTION public.track_goal_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only track savings envelopes with goals
    IF NEW.type = 'savings' AND NEW.target_amount IS NOT NULL THEN
        PERFORM public.add_goal_history_entry(
            NEW.user_id,
            NEW.id,
            'goal_created',
            NEW.balance,
            NEW.target_amount,
            NEW.target_date,
            public.calculate_savings_progress(NEW.balance, NEW.target_amount),
            NULL,
            NULL,
            NULL,
            NULL,
            'Goal created',
            jsonb_build_object('envelope_name', NEW.name)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_goal_creation_trigger
    AFTER INSERT ON public.envelopes
    FOR EACH ROW EXECUTE FUNCTION public.track_goal_creation();

-- Create trigger to automatically track goal modifications
CREATE OR REPLACE FUNCTION public.track_goal_modifications()
RETURNS TRIGGER AS $$
DECLARE
    old_progress DECIMAL(5,2);
    new_progress DECIMAL(5,2);
    event_type goal_history_event_type;
    notes_text TEXT;
BEGIN
    -- Only track savings envelopes with goals
    IF NEW.type = 'savings' AND NEW.target_amount IS NOT NULL THEN
        old_progress := COALESCE(public.calculate_savings_progress(OLD.balance, OLD.target_amount), 0);
        new_progress := public.calculate_savings_progress(NEW.balance, NEW.target_amount);
        
        -- Determine event type and notes
        IF OLD.target_amount != NEW.target_amount AND (OLD.target_date IS DISTINCT FROM NEW.target_date) THEN
            event_type := 'goal_modified';
            notes_text := 'Target amount and date modified';
        ELSIF OLD.target_amount != NEW.target_amount THEN
            event_type := 'target_amount_changed';
            notes_text := 'Target amount changed';
        ELSIF OLD.target_date IS DISTINCT FROM NEW.target_date THEN
            event_type := 'target_date_changed';
            notes_text := 'Target date changed';
        ELSIF OLD.balance != NEW.balance THEN
            event_type := 'progress_update';
            notes_text := 'Balance updated';
        ELSE
            RETURN NEW; -- No relevant changes
        END IF;
        
        PERFORM public.add_goal_history_entry(
            NEW.user_id,
            NEW.id,
            event_type,
            NEW.balance,
            NEW.target_amount,
            NEW.target_date,
            new_progress,
            OLD.target_amount,
            OLD.target_date,
            old_progress,
            NULL,
            notes_text,
            jsonb_build_object(
                'envelope_name', NEW.name,
                'balance_change', NEW.balance - OLD.balance
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_goal_modifications_trigger
    AFTER UPDATE ON public.envelopes
    FOR EACH ROW EXECUTE FUNCTION public.track_goal_modifications();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS goal_history_user_id_idx ON public.goal_history(user_id);
CREATE INDEX IF NOT EXISTS goal_history_envelope_id_idx ON public.goal_history(envelope_id);
CREATE INDEX IF NOT EXISTS goal_history_event_type_idx ON public.goal_history(event_type);
CREATE INDEX IF NOT EXISTS goal_history_event_date_idx ON public.goal_history(event_date);
CREATE INDEX IF NOT EXISTS goal_history_milestone_idx ON public.goal_history(milestone_percentage);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS goal_history_user_envelope_idx ON public.goal_history(user_id, envelope_id);
CREATE INDEX IF NOT EXISTS goal_history_user_envelope_date_idx ON public.goal_history(user_id, envelope_id, event_date DESC);

-- Grant necessary permissions
GRANT ALL ON public.goal_history TO authenticated;
GRANT SELECT ON public.goal_history TO anon;