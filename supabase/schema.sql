-- ============================================================
-- VIDYUT GLOBAL REAL-TIME DATABASE SCHEMA
-- Run this in your Supabase SQL Editor to enable worldwide sync
-- ============================================================

-- 1. Inspection Challans Table
CREATE TABLE IF NOT EXISTS public.inspection_challans (
    id TEXT PRIMARY KEY,
    consumer TEXT NOT NULL,
    anomaly TEXT,
    load TEXT,
    penalty TEXT,
    penalty_raw NUMERIC,
    inspector TEXT,
    zone TEXT,
    details TEXT,
    status TEXT DEFAULT 'Issued',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Blacklisted / Suspended Consumers Table
CREATE TABLE IF NOT EXISTS public.blacklisted_consumers (
    id TEXT PRIMARY KEY,
    addr TEXT NOT NULL,
    severity TEXT,
    fine TEXT,
    status TEXT DEFAULT 'Meter Removed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Inspection Tasks Table
CREATE TABLE IF NOT EXISTS public.inspection_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id TEXT NOT NULL,
    transformer_id TEXT,
    zone TEXT,
    inspector_name TEXT,
    inspector_email TEXT,
    risk_class TEXT,
    risk_score NUMERIC,
    latitude NUMERIC,
    longitude NUMERIC,
    status TEXT DEFAULT 'Initiated',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Upload History Table
CREATE TABLE IF NOT EXISTS public.upload_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    consumers_count INTEGER DEFAULT 0,
    critical_count INTEGER DEFAULT 0,
    anomalies_count INTEGER DEFAULT 0,
    loss_calculated TEXT DEFAULT '₹0',
    analysis_data JSONB,
    uploaded_on TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Inspectors Directory Table
CREATE TABLE IF NOT EXISTS public.inspectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,
    badge_id TEXT,
    email TEXT UNIQUE NOT NULL,
    discom TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) & Global Access Policies
ALTER TABLE public.inspection_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blacklisted_consumers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspectors ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies
DROP POLICY IF EXISTS "Allow public all access on inspection_challans" ON public.inspection_challans;
CREATE POLICY "Allow public all access on inspection_challans" ON public.inspection_challans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on blacklisted_consumers" ON public.blacklisted_consumers;
CREATE POLICY "Allow public all access on blacklisted_consumers" ON public.blacklisted_consumers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on inspection_tasks" ON public.inspection_tasks;
CREATE POLICY "Allow public all access on inspection_tasks" ON public.inspection_tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on upload_history" ON public.upload_history;
CREATE POLICY "Allow public all access on upload_history" ON public.upload_history FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on inspectors" ON public.inspectors;
CREATE POLICY "Allow public all access on inspectors" ON public.inspectors FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for all tables safely
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.inspection_challans;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.blacklisted_consumers;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.inspection_tasks;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.upload_history;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;
