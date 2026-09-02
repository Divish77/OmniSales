-- ==========================================
-- 1. ADD COLUMNS
-- ==========================================
ALTER TABLE store_sales ADD COLUMN IF NOT EXISTS country text DEFAULT 'India';
ALTER TABLE store_sales ADD COLUMN IF NOT EXISTS state text;

ALTER TABLE online_sales ADD COLUMN IF NOT EXISTS country text DEFAULT 'India';
ALTER TABLE online_sales ADD COLUMN IF NOT EXISTS state text;

ALTER TABLE harmonized_sales ADD COLUMN IF NOT EXISTS country text DEFAULT 'India';
ALTER TABLE harmonized_sales ADD COLUMN IF NOT EXISTS state text;

-- ==========================================
-- 2. DUMMY DATA SEEDING (Rich data with Country, State, Products)
-- ==========================================
TRUNCATE TABLE store_sales, online_sales;

-- India Stores
INSERT INTO store_sales (date, product_name, category, quantity, price, city, country, state) VALUES 
(CURRENT_DATE - INTERVAL '2 days', 'Wireless Earbuds', 'Electronics', 3, 149.99, 'Mumbai', 'India', 'Maharashtra'),
(CURRENT_DATE - INTERVAL '5 days', 'Ergonomic Chair', 'Furniture', 1, 350.00, 'Delhi', 'India', 'Delhi'),
(CURRENT_DATE - INTERVAL '15 days', 'Smart Watch', 'Electronics', 4, 299.99, 'Bangalore', 'India', 'Karnataka');

-- USA Stores
INSERT INTO store_sales (date, product_name, category, quantity, price, city, country, state) VALUES 
(CURRENT_DATE - INTERVAL '3 days', 'Mechanical Keyboard', 'Electronics', 3, 139.99, 'San Francisco', 'USA', 'California'),
(CURRENT_DATE - INTERVAL '1 month', 'Cotton T-Shirt', 'Clothing', 10, 19.99, 'New York', 'USA', 'New York'),
(CURRENT_DATE - INTERVAL '45 days', 'Coffee Maker', 'Home Appliances', 2, 85.00, 'Austin', 'USA', 'Texas');

-- UK Stores
INSERT INTO store_sales (date, product_name, category, quantity, price, city, country, state) VALUES 
(CURRENT_DATE - INTERVAL '2.5 months', 'Bluetooth Speaker', 'Electronics', 5, 89.99, 'London', 'UK', 'London'),
(CURRENT_DATE - INTERVAL '4 months', 'Running Shoes', 'Clothing', 2, 120.00, 'Manchester', 'UK', 'Greater Manchester');

-- India Online
INSERT INTO online_sales (date, product_name, category, quantity, price, location, country, state) VALUES 
(CURRENT_DATE - INTERVAL '1 days', 'Smart Watch', 'Electronics', 1, 299.99, 'Kerala', 'India', 'Kerala'),
(CURRENT_DATE - INTERVAL '10 days', 'Wireless Earbuds', 'Electronics', 6, 149.99, 'Rajasthan', 'India', 'Rajasthan');

-- USA Online
INSERT INTO online_sales (date, product_name, category, quantity, price, location, country, state) VALUES 
(CURRENT_DATE - INTERVAL '20 days', 'Desk Lamp', 'Home Appliances', 3, 35.00, 'Seattle', 'USA', 'Washington'),
(CURRENT_DATE - INTERVAL '1 month', 'Winter Jacket', 'Clothing', 2, 180.00, 'Denver', 'USA', 'Colorado');

-- UK Online
INSERT INTO online_sales (date, product_name, category, quantity, price, location, country, state) VALUES 
(CURRENT_DATE - INTERVAL '3 weeks', 'USB-C Hub', 'Accessories', 8, 45.00, 'Birmingham', 'UK', 'West Midlands');


-- ==========================================
-- 3. UPDATE HARMONIZATION PROCEDURE
-- ==========================================
CREATE OR REPLACE FUNCTION run_harmonization()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count integer;
BEGIN
    TRUNCATE TABLE harmonized_sales;

    INSERT INTO harmonized_sales (date, product_name, normalized_product, category, quantity, price, region, channel, country, state)
    SELECT
        s.date,
        s.product_name,
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
        'store' AS channel,
        COALESCE(s.country, 'India') AS country,
        COALESCE(s.state, 'Unknown') AS state
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
        'online' AS channel,
        COALESCE(o.country, 'India') AS country,
        COALESCE(o.state, 'Unknown') AS state
    FROM online_sales o;

    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$$;

-- Rerun harmonization to populate table
SELECT run_harmonization();

-- ==========================================
-- 4. UPDATE RPCS WITH FILTERS
-- ==========================================

CREATE OR REPLACE FUNCTION get_total_revenue(
    p_country text DEFAULT NULL,
    p_state text DEFAULT NULL,
    p_product text DEFAULT NULL
) RETURNS numeric LANGUAGE sql SECURITY DEFINER AS $$
    SELECT COALESCE(SUM(revenue), 0) FROM harmonized_sales
    WHERE (p_country IS NULL OR country = p_country)
      AND (p_state IS NULL OR state = p_state)
      AND (p_product IS NULL OR normalized_product = p_product);
$$;

CREATE OR REPLACE FUNCTION get_monthly_sales(
    p_country text DEFAULT NULL,
    p_state text DEFAULT NULL,
    p_product text DEFAULT NULL
)
RETURNS TABLE (month text, revenue numeric) LANGUAGE sql SECURITY DEFINER AS $$
    WITH monthly_data AS (
        SELECT 
            DATE_TRUNC('month', date) AS month_start,
            SUM(revenue) AS total_revenue
        FROM harmonized_sales
        WHERE date >= (CURRENT_DATE - INTERVAL '11 months')
          AND (p_country IS NULL OR country = p_country)
          AND (p_state IS NULL OR state = p_state)
          AND (p_product IS NULL OR normalized_product = p_product)
        GROUP BY DATE_TRUNC('month', date)
    )
    SELECT to_char(month_start, 'Mon') AS month, total_revenue AS revenue
    FROM monthly_data ORDER BY month_start ASC;
$$;

CREATE OR REPLACE FUNCTION get_category_distribution(
    p_country text DEFAULT NULL,
    p_state text DEFAULT NULL,
    p_product text DEFAULT NULL
)
RETURNS TABLE (name text, value numeric) LANGUAGE sql SECURITY DEFINER AS $$
    WITH filtered_sales AS (
        SELECT category, revenue FROM harmonized_sales
        WHERE (p_country IS NULL OR country = p_country)
          AND (p_state IS NULL OR state = p_state)
          AND (p_product IS NULL OR normalized_product = p_product)
    ),
    total AS (
        SELECT NULLIF(SUM(revenue), 0) AS calc_total FROM filtered_sales
    )
    SELECT 
        category AS name,
        ROUND((SUM(revenue) / (SELECT calc_total FROM total) * 100), 1) AS value
    FROM filtered_sales
    GROUP BY category
    ORDER BY value DESC;
$$;

CREATE OR REPLACE FUNCTION get_channel_revenue(
    p_country text DEFAULT NULL,
    p_state text DEFAULT NULL,
    p_product text DEFAULT NULL
)
RETURNS TABLE (channel text, revenue numeric, orders bigint, avg_order_value numeric) LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        channel,
        ROUND(SUM(revenue), 2) AS revenue,
        COUNT(*) AS orders,
        ROUND(AVG(revenue), 2) AS avg_order_value
    FROM harmonized_sales
    WHERE (p_country IS NULL OR country = p_country)
      AND (p_state IS NULL OR state = p_state)
      AND (p_product IS NULL OR normalized_product = p_product)
    GROUP BY channel ORDER BY revenue DESC;
$$;

CREATE OR REPLACE FUNCTION get_category_performance(
    p_country text DEFAULT NULL,
    p_state text DEFAULT NULL,
    p_product text DEFAULT NULL
)
RETURNS TABLE (category text, revenue numeric, units_sold bigint, channel_split text) LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        category,
        ROUND(SUM(revenue), 2) AS revenue,
        SUM(quantity) AS units_sold,
        ROUND(
            100.0 * SUM(CASE WHEN channel='online' THEN revenue ELSE 0 END) / NULLIF(SUM(revenue),0)
        , 1)::text || '% online' AS channel_split
    FROM harmonized_sales
    WHERE (p_country IS NULL OR country = p_country)
      AND (p_state IS NULL OR state = p_state)
      AND (p_product IS NULL OR normalized_product = p_product)
    GROUP BY category ORDER BY revenue DESC;
$$;

CREATE OR REPLACE FUNCTION get_channel_trend(
    p_country text DEFAULT NULL,
    p_state text DEFAULT NULL,
    p_product text DEFAULT NULL
)
RETURNS TABLE (month text, online_revenue numeric, store_revenue numeric) LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        to_char(DATE_TRUNC('month', date), 'Mon YYYY') AS month,
        ROUND(SUM(CASE WHEN channel='online' THEN revenue ELSE 0 END), 2) AS online_revenue,
        ROUND(SUM(CASE WHEN channel='store'  THEN revenue ELSE 0 END), 2) AS store_revenue
    FROM harmonized_sales
    WHERE (p_country IS NULL OR country = p_country)
      AND (p_state IS NULL OR state = p_state)
      AND (p_product IS NULL OR normalized_product = p_product)
    GROUP BY DATE_TRUNC('month', date) ORDER BY DATE_TRUNC('month', date);
$$;

CREATE OR REPLACE FUNCTION get_repeat_products(
    p_country text DEFAULT NULL,
    p_state text DEFAULT NULL,
    p_product text DEFAULT NULL
)
RETURNS TABLE (product_name text, category text, total_units bigint, avg_quantity numeric, channels text) LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        normalized_product AS product_name,
        category,
        SUM(quantity) AS total_units,
        ROUND(AVG(quantity), 1) AS avg_quantity,
        string_agg(DISTINCT channel, ' & ') AS channels
    FROM harmonized_sales
    WHERE (p_country IS NULL OR country = p_country)
      AND (p_state IS NULL OR state = p_state)
      AND (p_product IS NULL OR normalized_product = p_product)
    GROUP BY normalized_product, category
    HAVING AVG(quantity) >= 1
    ORDER BY total_units DESC LIMIT 10;
$$;

CREATE OR REPLACE FUNCTION get_forecasts(
    p_country text DEFAULT NULL,
    p_state text DEFAULT NULL,
    p_product text DEFAULT NULL
)
RETURNS TABLE (forecast_month text, category text, predicted_revenue numeric, predicted_quantity integer, confidence numeric) LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        to_char(forecast_month, 'Mon YYYY') AS forecast_month,
        category,
        predicted_revenue,
        predicted_quantity,
        confidence
    FROM forecasts 
    WHERE (p_product IS NULL OR product_name = p_product)
    ORDER BY forecast_month, category;
$$;

CREATE OR REPLACE FUNCTION get_ai_recommendations(
    p_country text DEFAULT NULL,
    p_state text DEFAULT NULL,
    p_product text DEFAULT NULL
)
RETURNS TABLE (id uuid, title text, recommendation text, category text, channel text, region text, impact_level text, metric_value numeric, created_at timestamptz) LANGUAGE sql SECURITY DEFINER AS $$
    SELECT id, title, recommendation, category, channel, region, impact_level, metric_value, created_at
    FROM ai_recommendations 
    WHERE (p_country IS NULL OR title ILIKE '%'||p_country||'%' OR recommendation ILIKE '%'||p_country||'%')
      AND (p_state IS NULL OR title ILIKE '%'||p_state||'%' OR recommendation ILIKE '%'||p_state||'%')
    ORDER BY CASE impact_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC;
$$;

-- We also need a function to get available filter options for the frontend
CREATE OR REPLACE FUNCTION get_filter_options()
RETURNS TABLE (countries json, states json, products json) LANGUAGE sql SECURITY DEFINER AS $$
    SELECT 
        (SELECT json_agg(DISTINCT country) FROM harmonized_sales) AS countries,
        (SELECT json_agg(DISTINCT state) FROM harmonized_sales) AS states,
        (SELECT json_agg(DISTINCT normalized_product) FROM harmonized_sales) AS products;
$$;
