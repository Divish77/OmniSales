-- ==========================================
-- OMNISALES MULTI-AGENT SYSTEM — MIGRATION v2
-- ==========================================

-- 1. Harmonized Sales Table (Agent 1 output)
CREATE TABLE IF NOT EXISTS harmonized_sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    product_name text NOT NULL,
    normalized_product text NOT NULL,
    category text NOT NULL,
    quantity integer NOT NULL,
    price numeric NOT NULL,
    revenue numeric GENERATED ALWAYS AS (quantity * price) STORED,
    region text NOT NULL,
    channel text NOT NULL CHECK (channel IN ('store', 'online')),
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_harm_date ON harmonized_sales(date);
CREATE INDEX IF NOT EXISTS idx_harm_category ON harmonized_sales(category);
CREATE INDEX IF NOT EXISTS idx_harm_channel ON harmonized_sales(channel);
CREATE INDEX IF NOT EXISTS idx_harm_region ON harmonized_sales(region);

-- 2. Analytics Results Table (Agent 2 output)
CREATE TABLE IF NOT EXISTS analytics_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name text NOT NULL,
    metric_value numeric,
    dimension text,
    dimension_value text,
    run_at timestamptz DEFAULT now()
);

-- 3. Customer Behavior Table (Agent 3 output)
CREATE TABLE IF NOT EXISTS customer_behavior (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_type text NOT NULL,
    channel text,
    region text,
    category text,
    product_name text,
    value numeric,
    label text,
    run_at timestamptz DEFAULT now()
);

-- 4. Forecasts Table (Agent 4 ML output)
CREATE TABLE IF NOT EXISTS forecasts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_month date NOT NULL,
    category text NOT NULL,
    product_name text,
    predicted_revenue numeric NOT NULL,
    predicted_quantity integer,
    model_name text DEFAULT 'LinearRegression',
    confidence numeric,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forecasts_month ON forecasts(forecast_month);
CREATE INDEX IF NOT EXISTS idx_forecasts_category ON forecasts(category);

-- 5. AI Recommendations Table (Agent 5 output)
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    recommendation text NOT NULL,
    category text,
    channel text,
    region text,
    impact_level text CHECK (impact_level IN ('high', 'medium', 'low')) DEFAULT 'medium',
    metric_basis text,
    metric_value numeric,
    created_at timestamptz DEFAULT now()
);

-- ==========================================
-- RLS Policies for new tables
-- ==========================================
ALTER TABLE harmonized_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read harmonized_sales" ON harmonized_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read analytics_results" ON analytics_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read customer_behavior" ON customer_behavior FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read forecasts" ON forecasts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read ai_recommendations" ON ai_recommendations FOR SELECT TO authenticated USING (true);

-- ==========================================
-- AGENT 1: DATA HARMONIZATION FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION run_harmonization()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count integer;
BEGIN
    -- Clear and repopulate (idempotent)
    TRUNCATE TABLE harmonized_sales;

    INSERT INTO harmonized_sales (date, product_name, normalized_product, category, quantity, price, region, channel)
    SELECT
        s.date,
        s.product_name,
        -- Normalize product names to Title Case and standardize known aliases
        INITCAP(CASE
            WHEN LOWER(s.product_name) IN ('wireless earbuds', 'earbuds', 'bt earbuds') THEN 'Wireless Earbuds'
            WHEN LOWER(s.product_name) IN ('smart watch', 'smartwatch') THEN 'Smart Watch'
            WHEN LOWER(s.product_name) IN ('mechanical keyboard', 'mech keyboard') THEN 'Mechanical Keyboard'
            WHEN LOWER(s.product_name) IN ('ergonomic chair', 'office chair') THEN 'Ergonomic Chair'
            ELSE s.product_name
        END) AS normalized_product,
        INITCAP(s.category) AS category,
        s.quantity,
        s.price,
        COALESCE(s.city, 'Unknown') AS region,
        'store' AS channel
    FROM store_sales s

    UNION ALL

    SELECT
        o.date,
        o.product_name,
        INITCAP(CASE
            WHEN LOWER(o.product_name) IN ('wireless earbuds', 'earbuds', 'bt earbuds') THEN 'Wireless Earbuds'
            WHEN LOWER(o.product_name) IN ('smart watch', 'smartwatch') THEN 'Smart Watch'
            WHEN LOWER(o.product_name) IN ('mechanical keyboard', 'mech keyboard') THEN 'Mechanical Keyboard'
            WHEN LOWER(o.product_name) IN ('ergonomic chair', 'office chair') THEN 'Ergonomic Chair'
            ELSE o.product_name
        END) AS normalized_product,
        INITCAP(o.category) AS category,
        o.quantity,
        o.price,
        COALESCE(o.location, 'Unknown') AS region,
        'online' AS channel
    FROM online_sales o;

    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$$;

-- ==========================================
-- AGENT 2: SALES ANALYTICS RPC FUNCTIONS
-- ==========================================

-- Channel Revenue Comparison
CREATE OR REPLACE FUNCTION get_channel_revenue()
RETURNS TABLE (channel text, revenue numeric, orders bigint, avg_order_value numeric)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        channel,
        ROUND(SUM(revenue), 2) AS revenue,
        COUNT(*) AS orders,
        ROUND(AVG(revenue), 2) AS avg_order_value
    FROM harmonized_sales
    GROUP BY channel
    ORDER BY revenue DESC;
$$;

-- Category Performance
CREATE OR REPLACE FUNCTION get_category_performance()
RETURNS TABLE (category text, revenue numeric, units_sold bigint, channel_split text)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        category,
        ROUND(SUM(revenue), 2) AS revenue,
        SUM(quantity) AS units_sold,
        ROUND(
            100.0 * SUM(CASE WHEN channel='online' THEN revenue ELSE 0 END) / NULLIF(SUM(revenue),0)
        , 1)::text || '% online' AS channel_split
    FROM harmonized_sales
    GROUP BY category
    ORDER BY revenue DESC;
$$;

-- Regional Demand
CREATE OR REPLACE FUNCTION get_regional_demand()
RETURNS TABLE (region text, revenue numeric, units_sold bigint, top_category text)
LANGUAGE sql SECURITY DEFINER AS $$
    WITH base AS (
        SELECT region, category, SUM(revenue) AS rev, SUM(quantity) AS units
        FROM harmonized_sales GROUP BY region, category
    ),
    top_cat AS (
        SELECT DISTINCT ON (region) region, category AS top_category
        FROM base ORDER BY region, rev DESC
    )
    SELECT b.region, ROUND(SUM(b.rev),2), SUM(b.units), tc.top_category
    FROM base b JOIN top_cat tc ON b.region = tc.region
    GROUP BY b.region, tc.top_category
    ORDER BY SUM(b.rev) DESC;
$$;

-- ==========================================
-- AGENT 3: CUSTOMER BEHAVIOR RPC FUNCTIONS
-- ==========================================

-- Channel Preference by Region
CREATE OR REPLACE FUNCTION get_channel_preference()
RETURNS TABLE (region text, online_pct numeric, store_pct numeric, dominant_channel text)
LANGUAGE sql SECURITY DEFINER AS $$
    WITH totals AS (
        SELECT region,
            SUM(CASE WHEN channel='online' THEN revenue ELSE 0 END) AS online_rev,
            SUM(CASE WHEN channel='store'  THEN revenue ELSE 0 END) AS store_rev,
            SUM(revenue) AS total_rev
        FROM harmonized_sales GROUP BY region
    )
    SELECT
        region,
        ROUND(100.0 * online_rev / NULLIF(total_rev,0), 1) AS online_pct,
        ROUND(100.0 * store_rev  / NULLIF(total_rev,0), 1) AS store_pct,
        CASE WHEN online_rev > store_rev THEN 'online' ELSE 'store' END AS dominant_channel
    FROM totals ORDER BY total_rev DESC;
$$;

-- Online vs Store Monthly Trend
CREATE OR REPLACE FUNCTION get_channel_trend()
RETURNS TABLE (month text, online_revenue numeric, store_revenue numeric)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        to_char(DATE_TRUNC('month', date), 'Mon YYYY') AS month,
        ROUND(SUM(CASE WHEN channel='online' THEN revenue ELSE 0 END), 2) AS online_revenue,
        ROUND(SUM(CASE WHEN channel='store'  THEN revenue ELSE 0 END), 2) AS store_revenue
    FROM harmonized_sales
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY DATE_TRUNC('month', date);
$$;

-- Best Repeat Products (proxy: high quantity per transaction)
CREATE OR REPLACE FUNCTION get_repeat_products()
RETURNS TABLE (product_name text, category text, total_units bigint, avg_quantity numeric, channels text)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        normalized_product AS product_name,
        category,
        SUM(quantity) AS total_units,
        ROUND(AVG(quantity), 1) AS avg_quantity,
        string_agg(DISTINCT channel, ' & ') AS channels
    FROM harmonized_sales
    GROUP BY normalized_product, category
    HAVING AVG(quantity) > 2
    ORDER BY avg_quantity DESC
    LIMIT 10;
$$;

-- ==========================================
-- AGENT 5: BUSINESS RECOMMENDATION ENGINE
-- ==========================================
CREATE OR REPLACE FUNCTION generate_recommendations()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    rec RECORD;
    inserted integer := 0;
BEGIN
    -- Clear old recommendations
    TRUNCATE TABLE ai_recommendations;

    -- Rule 1: Categories with >60% online revenue → boost digital
    FOR rec IN
        SELECT category,
            ROUND(100.0 * SUM(CASE WHEN channel='online' THEN revenue ELSE 0 END) / NULLIF(SUM(revenue),0), 1) AS online_pct,
            ROUND(SUM(revenue), 0) AS total_rev
        FROM harmonized_sales GROUP BY category
        HAVING SUM(CASE WHEN channel='online' THEN revenue ELSE 0 END) / NULLIF(SUM(revenue),0) > 0.6
    LOOP
        INSERT INTO ai_recommendations (title, recommendation, category, channel, impact_level, metric_basis, metric_value)
        VALUES (
            rec.category || ' dominates online at ' || rec.online_pct || '%',
            'Increase digital advertising budget for ' || rec.category || '. ' || rec.online_pct || '% of revenue comes from online channels. Consider targeted social media campaigns and influencer partnerships.',
            rec.category, 'online', 'high', 'online_revenue_pct', rec.online_pct
        );
        inserted := inserted + 1;
    END LOOP;

    -- Rule 2: Categories with high store revenue → regional promotions
    FOR rec IN
        SELECT category,
            ROUND(100.0 * SUM(CASE WHEN channel='store' THEN revenue ELSE 0 END) / NULLIF(SUM(revenue),0), 1) AS store_pct,
            SUM(quantity) AS total_units
        FROM harmonized_sales GROUP BY category
        HAVING SUM(CASE WHEN channel='store' THEN revenue ELSE 0 END) / NULLIF(SUM(revenue),0) > 0.5
    LOOP
        INSERT INTO ai_recommendations (title, recommendation, category, channel, impact_level, metric_basis, metric_value)
        VALUES (
            'Strengthen in-store strategy for ' || rec.category,
            rec.category || ' has strong store preference (' || rec.store_pct || '% store revenue). Focus on in-store displays, loyalty programs, and regional store-specific promotions.',
            rec.category, 'store', 'medium', 'store_revenue_pct', rec.store_pct
        );
        inserted := inserted + 1;
    END LOOP;

    -- Rule 3: Top selling products → stock optimization
    FOR rec IN
        SELECT normalized_product, category, SUM(quantity) AS total_qty
        FROM harmonized_sales GROUP BY normalized_product, category
        ORDER BY SUM(quantity) DESC LIMIT 3
    LOOP
        INSERT INTO ai_recommendations (title, recommendation, category, impact_level, metric_basis, metric_value)
        VALUES (
            'Prioritize stock for ' || rec.normalized_product,
            rec.normalized_product || ' is your top seller with ' || rec.total_qty || ' units sold. Maintain at least 30% safety stock and consider bundle deals to increase average order value.',
            rec.category, 'high', 'total_units_sold', rec.total_qty
        );
        inserted := inserted + 1;
    END LOOP;

    -- Rule 4: Low revenue regions → expansion opportunity
    FOR rec IN
        SELECT region, ROUND(SUM(revenue), 0) AS rev
        FROM harmonized_sales GROUP BY region
        ORDER BY SUM(revenue) ASC LIMIT 2
    LOOP
        INSERT INTO ai_recommendations (title, recommendation, region, impact_level, metric_basis, metric_value)
        VALUES (
            'Growth opportunity in ' || rec.region,
            rec.region || ' shows the lowest sales volume ($' || rec.rev || '). Consider targeted regional promotions, local partnerships, or pop-up store events to grow presence.',
            rec.region, 'medium', 'regional_revenue', rec.rev
        );
        inserted := inserted + 1;
    END LOOP;

    RETURN inserted;
END;
$$;

-- ==========================================
-- DASHBOARD RPC: Get all recommendations
-- ==========================================
CREATE OR REPLACE FUNCTION get_ai_recommendations()
RETURNS TABLE (
    id uuid, title text, recommendation text, category text,
    channel text, region text, impact_level text, metric_value numeric, created_at timestamptz
)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT id, title, recommendation, category, channel, region, impact_level, metric_value, created_at
    FROM ai_recommendations ORDER BY
        CASE impact_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC;
$$;

-- ==========================================
-- DASHBOARD RPC: Get forecasts
-- ==========================================
CREATE OR REPLACE FUNCTION get_forecasts()
RETURNS TABLE (
    forecast_month text, category text, predicted_revenue numeric,
    predicted_quantity integer, confidence numeric
)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        to_char(forecast_month, 'Mon YYYY') AS forecast_month,
        category,
        predicted_revenue,
        predicted_quantity,
        confidence
    FROM forecasts ORDER BY forecast_month, category;
$$;

-- ==========================================
-- RUN AGENTS 1 & 5 immediately with seed data
-- ==========================================
SELECT run_harmonization();
SELECT generate_recommendations();
