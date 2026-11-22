-- ==============================================================================
-- NEXUS SENTINEL — PRODUCTION SUPABASE POSTGRESQL SCHEMA
-- Phase 1: Core Relational Architecture, RLS Policies, Triggers & Initial Seeds
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS & SCHEMA PREPARATION
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Ensure auth schema exists (for standalone PostgreSQL testing outside Supabase)
CREATE SCHEMA IF NOT EXISTS auth;

-- Stub auth.users if running in bare Postgres environments without Supabase GoTrue
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID,
    email VARCHAR(255) UNIQUE,
    encrypted_password VARCHAR(255),
    email_confirmed_at TIMESTAMPTZ,
    invited_at TIMESTAMPTZ,
    confirmation_token VARCHAR(255),
    confirmation_sent_at TIMESTAMPTZ,
    recovery_token VARCHAR(255),
    recovery_sent_at TIMESTAMPTZ,
    email_change_token_new VARCHAR(255),
    email_change VARCHAR(255),
    email_change_sent_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    raw_app_meta_data JSONB DEFAULT '{}'::jsonb,
    raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
    is_super_admin BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    phone VARCHAR(255) UNIQUE,
    phone_confirmed_at TIMESTAMPTZ,
    phone_change VARCHAR(255),
    phone_change_token VARCHAR(255),
    phone_change_sent_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    email_change_token_current VARCHAR(255),
    email_change_confirm_status SMALLINT,
    banned_until TIMESTAMPTZ,
    reauthentication_token VARCHAR(255),
    reauthentication_sent_at TIMESTAMPTZ,
    is_sso_user BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 2. CORE TABLES DEFINITION
-- ------------------------------------------------------------------------------

-- (1) PROFILES TABLE (3-Tier Organizational Hierarchy)
-- Level 1: super_admin | Level 2: lead_analyst | Level 3: field_investigator
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'lead_analyst', 'field_investigator')),
    hierarchy_level INT NOT NULL CHECK (hierarchy_level IN (1, 2, 3)),
    totp_secret TEXT,
    is_2fa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- (2) SCRAPED POSTS TABLE (Ingested classified ads & social media posts)
CREATE TABLE IF NOT EXISTS public.scraped_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 deduplication hash
    group_name TEXT,
    sender_phone TEXT,
    raw_text TEXT NOT NULL,
    extracted_json JSONB NOT NULL DEFAULT '{}'::jsonb, -- make, model, year, city, asking_price, chassis_number
    slang_flags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    llm_reasoning TEXT,
    predicted_market_price NUMERIC(14, 2),
    price_deviation_pct NUMERIC(6, 2), -- % below or above benchmark
    risk_score INT NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'flagged', 'verified_ncp', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- (3) VEHICLE BENCHMARKS TABLE (Historical PakWheels market pricing baselines)
CREATE TABLE IF NOT EXISTS public.vehicle_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INT NOT NULL,
    variant TEXT,
    city TEXT,
    avg_market_price NUMERIC(14, 2) NOT NULL,
    min_price NUMERIC(14, 2),
    max_price NUMERIC(14, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- (4) SLANG LEXICON TABLE (Roman Urdu and local smuggling glossary)
CREATE TABLE IF NOT EXISTS public.slang_lexicon (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term TEXT UNIQUE NOT NULL,
    normalized_meaning TEXT NOT NULL,
    severity_weight INT NOT NULL CHECK (severity_weight >= 1 AND severity_weight <= 10),
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- (5) INVESTIGATION CASES TABLE (Case management & workflow escalation)
CREATE TABLE IF NOT EXISTS public.investigation_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.scraped_posts(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    escalated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    field_notes TEXT,
    verdict TEXT NOT NULL DEFAULT 'pending' CHECK (verdict IN ('pending', 'under_investigation', 'confirmed_smuggled', 'cleared', 'inconclusive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- (6) AUDIT LOGS TABLE (Immutable platform audit trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_table TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES FOR HIGH-THROUGHPUT QUERYING & SEARCH
-- ------------------------------------------------------------------------------

-- Scraped Posts Indexes
CREATE INDEX IF NOT EXISTS idx_scraped_posts_hash ON public.scraped_posts(message_hash);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_status ON public.scraped_posts(status);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_risk_score ON public.scraped_posts(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_created_at ON public.scraped_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_extracted_json ON public.scraped_posts USING GIN (extracted_json);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_slang_flags ON public.scraped_posts USING GIN (slang_flags);

-- Vehicle Benchmarks Indexes
CREATE INDEX IF NOT EXISTS idx_benchmarks_lookup ON public.vehicle_benchmarks(make, model, year, city);
CREATE INDEX IF NOT EXISTS idx_benchmarks_make_model ON public.vehicle_benchmarks(make, model);

-- Slang Lexicon Indexes
CREATE INDEX IF NOT EXISTS idx_slang_lexicon_term ON public.slang_lexicon(term);
CREATE INDEX IF NOT EXISTS idx_slang_lexicon_severity ON public.slang_lexicon(severity_weight DESC);

-- Investigation Cases Indexes
CREATE INDEX IF NOT EXISTS idx_cases_post_id ON public.investigation_cases(post_id);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON public.investigation_cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cases_escalated_by ON public.investigation_cases(escalated_by);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON public.investigation_cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_verdict ON public.investigation_cases(verdict);
CREATE INDEX IF NOT EXISTS idx_cases_updated_at ON public.investigation_cases(updated_at DESC);

-- Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_table);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. AUTOMATIC TIMESTAMP TRIGGERS
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_scraped_posts_updated_at ON public.scraped_posts;
CREATE TRIGGER trg_scraped_posts_updated_at
    BEFORE UPDATE ON public.scraped_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_investigation_cases_updated_at ON public.investigation_cases;
CREATE TRIGGER trg_investigation_cases_updated_at
    BEFORE UPDATE ON public.investigation_cases
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 5. ROW-LEVEL SECURITY (RLS) & HELPER FUNCTIONS
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slang_lexicon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper: Get role of currently executing user
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: Get hierarchy level of currently executing user
CREATE OR REPLACE FUNCTION public.get_current_hierarchy_level()
RETURNS INT AS $$
    SELECT hierarchy_level FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- --- RLS POLICIES: PROFILES ---
-- Any authenticated user can read profiles (needed for case assignment & name resolution)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Users can update their own non-critical profile settings
DROP POLICY IF EXISTS "Users can update self profile" ON public.profiles;
CREATE POLICY "Users can update self profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Super admin can insert/update/delete any profile
DROP POLICY IF EXISTS "Super admin full profile management" ON public.profiles;
CREATE POLICY "Super admin full profile management"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.get_current_user_role() = 'super_admin');

-- --- RLS POLICIES: SCRAPED POSTS ---
-- Authenticated users across all hierarchy tiers can view scraped posts
DROP POLICY IF EXISTS "Authenticated staff can view scraped posts" ON public.scraped_posts;
CREATE POLICY "Authenticated staff can view scraped posts"
    ON public.scraped_posts FOR SELECT
    TO authenticated
    USING (true);

-- Lead Analysts & Super Admins can insert or update scraped posts
DROP POLICY IF EXISTS "Super admin & Analysts can manage scraped posts" ON public.scraped_posts;
CREATE POLICY "Super admin & Analysts can manage scraped posts"
    ON public.scraped_posts FOR ALL
    TO authenticated
    USING (public.get_current_user_role() IN ('super_admin', 'lead_analyst'))
    WITH CHECK (public.get_current_user_role() IN ('super_admin', 'lead_analyst'));

-- --- RLS POLICIES: VEHICLE BENCHMARKS ---
-- All staff can read benchmarks for market analysis
DROP POLICY IF EXISTS "Authenticated staff can read benchmarks" ON public.vehicle_benchmarks;
CREATE POLICY "Authenticated staff can read benchmarks"
    ON public.vehicle_benchmarks FOR SELECT
    TO authenticated
    USING (true);

-- Only Super Admin & Lead Analyst can mutate benchmarks
DROP POLICY IF EXISTS "Admins and Analysts can mutate benchmarks" ON public.vehicle_benchmarks;
CREATE POLICY "Admins and Analysts can mutate benchmarks"
    ON public.vehicle_benchmarks FOR ALL
    TO authenticated
    USING (public.get_current_user_role() IN ('super_admin', 'lead_analyst'))
    WITH CHECK (public.get_current_user_role() IN ('super_admin', 'lead_analyst'));

-- --- RLS POLICIES: SLANG LEXICON ---
-- All staff can read the slang glossary
DROP POLICY IF EXISTS "Authenticated staff can read slang lexicon" ON public.slang_lexicon;
CREATE POLICY "Authenticated staff can read slang lexicon"
    ON public.slang_lexicon FOR SELECT
    TO authenticated
    USING (true);

-- Only Super Admin & Lead Analyst can mutate the lexicon
DROP POLICY IF EXISTS "Admins and Analysts can manage lexicon" ON public.slang_lexicon;
CREATE POLICY "Admins and Analysts can manage lexicon"
    ON public.slang_lexicon FOR ALL
    TO authenticated
    USING (public.get_current_user_role() IN ('super_admin', 'lead_analyst'))
    WITH CHECK (public.get_current_user_role() IN ('super_admin', 'lead_analyst'));

-- --- RLS POLICIES: INVESTIGATION CASES ---
-- Super Admin and Lead Analyst can view all cases
-- Field Investigator can only view cases assigned to them
DROP POLICY IF EXISTS "Role based case read access" ON public.investigation_cases;
CREATE POLICY "Role based case read access"
    ON public.investigation_cases FOR SELECT
    TO authenticated
    USING (
        public.get_current_user_role() IN ('super_admin', 'lead_analyst')
        OR (public.get_current_user_role() = 'field_investigator' AND assigned_to = auth.uid())
    );

-- Super Admin and Lead Analyst can create cases
DROP POLICY IF EXISTS "Admins and Analysts can insert cases" ON public.investigation_cases;
CREATE POLICY "Admins and Analysts can insert cases"
    ON public.investigation_cases FOR INSERT
    TO authenticated
    WITH CHECK (public.get_current_user_role() IN ('super_admin', 'lead_analyst'));

-- Super Admin / Lead Analyst can update any case; Field Investigator can update only assigned cases (e.g., field notes)
DROP POLICY IF EXISTS "Role based case update access" ON public.investigation_cases;
CREATE POLICY "Role based case update access"
    ON public.investigation_cases FOR UPDATE
    TO authenticated
    USING (
        public.get_current_user_role() IN ('super_admin', 'lead_analyst')
        OR (public.get_current_user_role() = 'field_investigator' AND assigned_to = auth.uid())
    )
    WITH CHECK (
        public.get_current_user_role() IN ('super_admin', 'lead_analyst')
        OR (public.get_current_user_role() = 'field_investigator' AND assigned_to = auth.uid())
    );

-- Only Super Admin can delete cases
DROP POLICY IF EXISTS "Only Super Admin can delete cases" ON public.investigation_cases;
CREATE POLICY "Only Super Admin can delete cases"
    ON public.investigation_cases FOR DELETE
    TO authenticated
    USING (public.get_current_user_role() = 'super_admin');

-- --- RLS POLICIES: AUDIT LOGS ---
-- Super Admin can view all audit logs; Lead Analyst can view audit logs
DROP POLICY IF EXISTS "Admins and Analysts can read audit logs" ON public.audit_logs;
CREATE POLICY "Admins and Analysts can read audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.get_current_user_role() IN ('super_admin', 'lead_analyst'));

-- Any authenticated user action can insert audit logs (via backend service or trigger)
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 6. SEED DATA
-- ------------------------------------------------------------------------------

-- Seed deterministic auth accounts (Miss Hiba, Abrar, Sulaman)
DO $$
DECLARE
    hiba_id UUID := '11111111-1111-1111-1111-111111111111';
    abrar_id UUID := '22222222-2222-2222-2222-222222222222';
    sulaman_id UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
    -- 1. Insert into auth.users if not present
    INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
    VALUES
        (hiba_id, 'hiba.superadmin@nexus-sentinel.gov.pk', '{"full_name": "Miss Hiba"}'::jsonb, NOW(), NOW()),
        (abrar_id, 'abrar.analyst@nexus-sentinel.gov.pk', '{"full_name": "Abrar"}'::jsonb, NOW(), NOW()),
        (sulaman_id, 'sulaman.investigator@nexus-sentinel.gov.pk', '{"full_name": "Sulaman"}'::jsonb, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

    -- 2. Insert into public.profiles
    -- Level 1: Miss Hiba (Super Admin)
    INSERT INTO public.profiles (id, full_name, email, phone, role, hierarchy_level, is_2fa_enabled)
    VALUES (
        hiba_id,
        'Miss Hiba',
        'hiba.superadmin@nexus-sentinel.gov.pk',
        '+92-300-1110001',
        'super_admin',
        1,
        TRUE
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        hierarchy_level = EXCLUDED.hierarchy_level;

    -- Level 2: Abrar (Lead Analyst)
    INSERT INTO public.profiles (id, full_name, email, phone, role, hierarchy_level, is_2fa_enabled)
    VALUES (
        abrar_id,
        'Abrar',
        'abrar.analyst@nexus-sentinel.gov.pk',
        '+92-300-2220002',
        'lead_analyst',
        2,
        TRUE
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        hierarchy_level = EXCLUDED.hierarchy_level;

    -- Level 3: Sulaman (Field Investigator)
    INSERT INTO public.profiles (id, full_name, email, phone, role, hierarchy_level, is_2fa_enabled)
    VALUES (
        sulaman_id,
        'Sulaman',
        'sulaman.investigator@nexus-sentinel.gov.pk',
        '+92-300-3330003',
        'field_investigator',
        3,
        FALSE
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        hierarchy_level = EXCLUDED.hierarchy_level;

END $$;

-- Seed Roman Urdu smuggling slang lexicon
INSERT INTO public.slang_lexicon (term, normalized_meaning, severity_weight, category)
VALUES
    (
        'non-custom',
        'Vehicle smuggled across borders without payment of statutory Federal Customs & Excise duties (NCP).',
        10,
        'customs_evasion'
    ),
    (
        'cut-piece',
        'Surgically severed vehicle bodies welded together from fragmented or scrap chassis to evade detection.',
        10,
        'structural_tampering'
    ),
    (
        'chalta phirta',
        'Vehicles operating on dubious or cloned documentation without proper legal registration or verifiable paper trail.',
        8,
        'documentation_fraud'
    ),
    (
        'kabuli',
        'Vehicles or assembled sub-assemblies illegally trafficked through porous northwest Afghan border corridors.',
        9,
        'origin_smuggling'
    ),
    (
        'without file',
        'Automobiles marketed devoid of original excise ownership dossier or registration book; indicator of theft or NCP status.',
        9,
        'documentation_fraud'
    ),
    (
        'tampered chassis',
        'Physical altering, grinding, re-engraving, or fraudulent transplanting of VIN/chassis plates to spoof legitimate records.',
        10,
        'identity_fraud'
    )
ON CONFLICT (term) DO UPDATE
SET normalized_meaning = EXCLUDED.normalized_meaning,
    severity_weight = EXCLUDED.severity_weight,
    category = EXCLUDED.category;

-- Initial audit log entry recording schema initialization
INSERT INTO public.audit_logs (actor_id, action, target_table, metadata)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'INITIALIZE_SCHEMA',
    'system',
    '{"version": "1.0.0", "phase": 1, "description": "Nexus Sentinel Phase 1 database schema initialized"}'::jsonb
);
