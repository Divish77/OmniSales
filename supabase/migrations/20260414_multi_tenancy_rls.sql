-- =======================================================================================
-- ADD MULTI-TENANCY RLS TO ALL DATA TABLES
-- =======================================================================================

DO $$ 
DECLARE 
    t text;
    tables_list text[] := ARRAY[
        'store_sales', 'online_sales', 'harmonized_sales', 
        'ai_insights', 'forecasts', 'ai_recommendations', 
        'analytics_results', 'customer_behavior', 'analytics_insights'
    ];
BEGIN
    FOR t IN SELECT unnest(tables_list) LOOP
        -- 1. Add user_id column if it doesn't exist
        EXECUTE format(
            'ALTER TABLE %I ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();', 
            t
        );

        -- 2. Drop existing loose policies (ignores errors if they don't exist)
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "auth read %I" ON %I;', t, t);
        EXCEPTION
            WHEN undefined_object THEN null;
        END;
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON %I;', t);
        EXCEPTION
            WHEN undefined_object THEN null;
        END;
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON %I;', t);
        EXCEPTION
            WHEN undefined_object THEN null;
        END;

        -- 3. Enforce Strict RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);

        -- 4. Create the strictly scoped Multi-Tenant policy
        EXECUTE format(
            'CREATE POLICY "Isolate Tenant Data" ON %I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());',
            t
        );
    END LOOP;
END $$;
