-- ======================================================================
-- Migration: Add p_start_date / p_end_date date range filtering to RPCs
-- This enables the frontend date filter to scope data precisely.
-- ======================================================================

-- 1. get_total_revenue
CREATE OR REPLACE FUNCTION get_total_revenue(
    p_country    text DEFAULT NULL,
    p_region     text DEFAULT NULL,
    p_product    text DEFAULT NULL,
    p_category   text DEFAULT NULL,
    p_start_date date DEFAULT NULL,
    p_end_date   date DEFAULT NULL
) RETURNS numeric LANGUAGE sql SECURITY DEFINER AS $$
    SELECT COALESCE(SUM(revenue), 0)
    FROM harmonized_sales
    WHERE (p_country    IS NULL OR country            = p_country)
      AND (p_region     IS NULL OR region              = p_region)
      AND (p_product    IS NULL OR normalized_product = p_product)
      AND (p_category   IS NULL OR category           = p_category)
      AND (p_start_date IS NULL OR sale_date              >= p_start_date)
      AND (p_end_date   IS NULL OR sale_date              <= p_end_date);
$$;

-- 2. get_monthly_sales
CREATE OR REPLACE FUNCTION get_monthly_sales(
    p_country    text DEFAULT NULL,
    p_region     text DEFAULT NULL,
    p_product    text DEFAULT NULL,
    p_category   text DEFAULT NULL,
    p_start_date date DEFAULT NULL,
    p_end_date   date DEFAULT NULL
) RETURNS TABLE (month text, revenue numeric) LANGUAGE sql SECURITY DEFINER AS $$
    WITH monthly_data AS (
        SELECT
            DATE_TRUNC('month', sale_date) AS month_start,
            SUM(revenue) AS total_revenue
        FROM harmonized_sales
        WHERE (p_country    IS NULL OR country            = p_country)
          AND (p_region     IS NULL OR region              = p_region)
          AND (p_product    IS NULL OR normalized_product = p_product)
          AND (p_category   IS NULL OR category           = p_category)
          AND (p_start_date IS NULL OR sale_date              >= p_start_date)
          AND (p_end_date   IS NULL OR sale_date              <= p_end_date)
        GROUP BY DATE_TRUNC('month', sale_date)
    )
    SELECT to_char(month_start, 'Mon YYYY') AS month, total_revenue AS revenue
    FROM monthly_data ORDER BY month_start ASC;
$$;

-- 3. get_category_distribution
CREATE OR REPLACE FUNCTION get_category_distribution(
    p_country    text DEFAULT NULL,
    p_region     text DEFAULT NULL,
    p_product    text DEFAULT NULL,
    p_category   text DEFAULT NULL,
    p_start_date date DEFAULT NULL,
    p_end_date   date DEFAULT NULL
) RETURNS TABLE (name text, value numeric) LANGUAGE sql SECURITY DEFINER AS $$
    WITH filtered_sales AS (
        SELECT category, revenue
        FROM harmonized_sales
        WHERE (p_country    IS NULL OR country            = p_country)
          AND (p_region     IS NULL OR region              = p_region)
          AND (p_product    IS NULL OR normalized_product = p_product)
          AND (p_category   IS NULL OR category           = p_category)
          AND (p_start_date IS NULL OR sale_date              >= p_start_date)
          AND (p_end_date   IS NULL OR sale_date              <= p_end_date)
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

-- 4. get_channel_revenue
CREATE OR REPLACE FUNCTION get_channel_revenue(
    p_country      text    DEFAULT NULL,
    p_region       text    DEFAULT NULL,
    p_product      text    DEFAULT NULL,
    p_category     text    DEFAULT NULL,
    p_target_month text    DEFAULT NULL,
    p_start_date   date    DEFAULT NULL,
    p_end_date     date    DEFAULT NULL
) RETURNS TABLE (channel text, revenue numeric, orders bigint, avg_order_value numeric)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        channel,
        ROUND(SUM(revenue), 2)   AS revenue,
        COUNT(*)                 AS orders,
        ROUND(AVG(revenue), 2)   AS avg_order_value
    FROM harmonized_sales
    WHERE (p_country    IS NULL OR country            = p_country)
      AND (p_region     IS NULL OR region              = p_region)
      AND (p_product    IS NULL OR normalized_product = p_product)
      AND (p_category   IS NULL OR category           = p_category)
      AND (p_target_month IS NULL OR TO_CHAR(sale_date, 'YYYY-MM') = p_target_month)
      AND (p_start_date IS NULL OR sale_date              >= p_start_date)
      AND (p_end_date   IS NULL OR sale_date              <= p_end_date)
    GROUP BY channel ORDER BY revenue DESC;
$$;

-- 5. get_category_performance
CREATE OR REPLACE FUNCTION get_category_performance(
    p_country      text DEFAULT NULL,
    p_region       text DEFAULT NULL,
    p_product      text DEFAULT NULL,
    p_category     text DEFAULT NULL,
    p_target_month text DEFAULT NULL,
    p_start_date   date DEFAULT NULL,
    p_end_date     date DEFAULT NULL
) RETURNS TABLE (category text, revenue numeric, units_sold bigint, channel_split text)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        category,
        ROUND(SUM(revenue), 2) AS revenue,
        SUM(quantity)          AS units_sold,
        ROUND(
            100.0 * SUM(CASE WHEN channel='online' THEN revenue ELSE 0 END) / NULLIF(SUM(revenue),0)
        , 1)::text || '% online' AS channel_split
    FROM harmonized_sales
    WHERE (p_country    IS NULL OR country            = p_country)
      AND (p_region     IS NULL OR region              = p_region)
      AND (p_product    IS NULL OR normalized_product = p_product)
      AND (p_category   IS NULL OR category           = p_category)
      AND (p_target_month IS NULL OR TO_CHAR(sale_date, 'YYYY-MM') = p_target_month)
      AND (p_start_date IS NULL OR sale_date              >= p_start_date)
      AND (p_end_date   IS NULL OR sale_date              <= p_end_date)
    GROUP BY category ORDER BY revenue DESC;
$$;

-- 6. get_channel_trend
CREATE OR REPLACE FUNCTION get_channel_trend(
    p_country      text DEFAULT NULL,
    p_region       text DEFAULT NULL,
    p_product      text DEFAULT NULL,
    p_category     text DEFAULT NULL,
    p_target_month text DEFAULT NULL,
    p_start_date   date DEFAULT NULL,
    p_end_date     date DEFAULT NULL
) RETURNS TABLE (month text, online_revenue numeric, store_revenue numeric)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        to_char(DATE_TRUNC('month', sale_date), 'Mon YYYY') AS month,
        ROUND(SUM(CASE WHEN channel='online' THEN revenue ELSE 0 END), 2) AS online_revenue,
        ROUND(SUM(CASE WHEN channel='store'  THEN revenue ELSE 0 END), 2) AS store_revenue
    FROM harmonized_sales
    WHERE (p_country    IS NULL OR country            = p_country)
      AND (p_region     IS NULL OR region              = p_region)
      AND (p_product    IS NULL OR normalized_product = p_product)
      AND (p_category   IS NULL OR category           = p_category)
      AND (p_target_month IS NULL OR TO_CHAR(sale_date, 'YYYY-MM') = p_target_month)
      AND (p_start_date IS NULL OR sale_date              >= p_start_date)
      AND (p_end_date   IS NULL OR sale_date              <= p_end_date)
    GROUP BY DATE_TRUNC('month', sale_date) ORDER BY DATE_TRUNC('month', sale_date);
$$;

-- 7. get_top_products (adds category + date range)
CREATE OR REPLACE FUNCTION get_top_products(
    p_country    text    DEFAULT NULL,
    p_region     text    DEFAULT NULL,
    p_product    text    DEFAULT NULL,
    p_category   text    DEFAULT NULL,
    p_limit      integer DEFAULT 6,
    p_start_date date    DEFAULT NULL,
    p_end_date   date    DEFAULT NULL
) RETURNS TABLE (product_name text, category text, revenue numeric, units_sold bigint)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        normalized_product AS product_name,
        category,
        ROUND(SUM(revenue), 2) AS revenue,
        SUM(quantity)          AS units_sold
    FROM harmonized_sales
    WHERE (p_country    IS NULL OR country            = p_country)
      AND (p_region     IS NULL OR region              = p_region)
      AND (p_product    IS NULL OR normalized_product = p_product)
      AND (p_category   IS NULL OR category           = p_category)
      AND (p_start_date IS NULL OR sale_date              >= p_start_date)
      AND (p_end_date   IS NULL OR sale_date              <= p_end_date)
    GROUP BY normalized_product, category
    ORDER BY revenue DESC
    LIMIT p_limit;
$$;

-- 8. get_sales_kpis (with date range override)
CREATE OR REPLACE FUNCTION public.get_sales_kpis(
    p_country      text DEFAULT NULL,
    p_state        text DEFAULT NULL,
    p_product      text DEFAULT NULL,
    p_category     text DEFAULT NULL,
    p_target_month text DEFAULT NULL,
    p_start_date   date DEFAULT NULL,
    p_end_date     date DEFAULT NULL
) RETURNS TABLE(metric text, value numeric, label text)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  eff_start date;
  eff_end   date;
  curr_rev  numeric;
  prev_rev  numeric;
  curr_orders bigint;
  aov       numeric;
BEGIN
  -- Determine effective date range
  IF p_start_date IS NOT NULL THEN
    eff_start := p_start_date;
    eff_end   := COALESCE(p_end_date, CURRENT_DATE);
  ELSIF p_target_month IS NOT NULL THEN
    eff_start := TO_DATE(p_target_month || '-01', 'YYYY-MM-DD');
    eff_end   := (eff_start + INTERVAL '1 month - 1 day')::date;
  ELSE
    eff_start := date_trunc('month', NOW())::date;
    eff_end   := CURRENT_DATE;
  END IF;

  SELECT COALESCE(SUM(revenue),0) INTO curr_rev FROM harmonized_sales
  WHERE sale_date >= eff_start AND sale_date <= eff_end
    AND (p_country  IS NULL OR country            = p_country)
    AND (p_state    IS NULL OR region              = p_state)
    AND (p_product  IS NULL OR normalized_product = p_product)
    AND (p_category IS NULL OR category           = p_category);

  -- Previous period of same duration
  SELECT COALESCE(SUM(revenue),0) INTO prev_rev FROM harmonized_sales
  WHERE sale_date >= (eff_start - (eff_end - eff_start + 1))
    AND sale_date <  eff_start
    AND (p_country  IS NULL OR country            = p_country)
    AND (p_state    IS NULL OR region              = p_state)
    AND (p_product  IS NULL OR normalized_product = p_product)
    AND (p_category IS NULL OR category           = p_category);

  SELECT COUNT(*) INTO curr_orders FROM harmonized_sales
  WHERE sale_date >= eff_start AND sale_date <= eff_end
    AND (p_country  IS NULL OR country            = p_country)
    AND (p_state    IS NULL OR region              = p_state)
    AND (p_product  IS NULL OR normalized_product = p_product)
    AND (p_category IS NULL OR category           = p_category);

  SELECT COALESCE(SUM(revenue)/NULLIF(COUNT(*),0),0) INTO aov FROM harmonized_sales
  WHERE sale_date >= eff_start AND sale_date <= eff_end
    AND (p_country  IS NULL OR country            = p_country)
    AND (p_state    IS NULL OR region              = p_state)
    AND (p_product  IS NULL OR normalized_product = p_product)
    AND (p_category IS NULL OR category           = p_category);

  RETURN QUERY VALUES
    ('current_month_revenue', curr_rev, 'Period Revenue'),
    ('prev_month_revenue', prev_rev, 'Previous Period Revenue'),
    ('mom_growth_pct',
      CASE WHEN prev_rev = 0 THEN NULL
           ELSE ROUND(((curr_rev - prev_rev)/prev_rev)*100, 2) END,
      'Period-over-Period Growth'),
    ('current_month_orders', curr_orders::numeric, 'Orders in Period'),
    ('avg_order_value', ROUND(aov, 2), 'Avg Order Value');
END;
$$;

-- 9. get_mom_growth (with date range)
CREATE OR REPLACE FUNCTION public.get_mom_growth(
    p_country      text DEFAULT NULL,
    p_state        text DEFAULT NULL,
    p_product      text DEFAULT NULL,
    p_category     text DEFAULT NULL,
    p_target_month text DEFAULT NULL,
    p_start_date   date DEFAULT NULL,
    p_end_date     date DEFAULT NULL
) RETURNS TABLE(category text, current_month_revenue numeric, prev_month_revenue numeric, growth_pct numeric)
LANGUAGE sql SECURITY DEFINER AS $$
  WITH monthly AS (
    SELECT
      category,
      TO_CHAR(sale_date, 'YYYY-MM') AS month,
      SUM(revenue) AS total_revenue
    FROM harmonized_sales
    WHERE (p_country    IS NULL OR country            = p_country)
      AND (p_state      IS NULL OR region              = p_state)
      AND (p_product    IS NULL OR normalized_product = p_product)
      AND (p_category   IS NULL OR category           = p_category)
      AND (
        CASE
          WHEN p_start_date IS NOT NULL THEN sale_date >= p_start_date AND sale_date <= COALESCE(p_end_date, CURRENT_DATE)
          WHEN p_target_month IS NOT NULL THEN
            sale_date >= TO_DATE(p_target_month || '-01', 'YYYY-MM-DD') - INTERVAL '1 month'
            AND sale_date <= (TO_DATE(p_target_month || '-01', 'YYYY-MM-DD') + INTERVAL '1 month - 1 day')::date
          ELSE sale_date >= date_trunc('month', NOW()) - INTERVAL '1 month'
        END
      )
    GROUP BY 1, 2
  ),
  ref_month AS (
    SELECT CASE
      WHEN p_target_month IS NOT NULL THEN p_target_month
      ELSE TO_CHAR(NOW(), 'YYYY-MM')
    END AS m
  ),
  curr AS (SELECT category, total_revenue FROM monthly WHERE month = (SELECT m FROM ref_month)),
  prev AS (SELECT category, total_revenue FROM monthly WHERE month = TO_CHAR(
    TO_DATE((SELECT m FROM ref_month) || '-01', 'YYYY-MM-DD') - INTERVAL '1 month', 'YYYY-MM'))
  SELECT
    COALESCE(c.category, p.category)      AS category,
    COALESCE(c.total_revenue, 0)          AS current_month_revenue,
    COALESCE(p.total_revenue, 0)          AS prev_month_revenue,
    CASE WHEN COALESCE(p.total_revenue, 0) = 0 THEN NULL
         ELSE ROUND(((COALESCE(c.total_revenue,0) - COALESCE(p.total_revenue,0))
                    / COALESCE(p.total_revenue,0)) * 100, 2)
    END AS growth_pct
  FROM curr c FULL OUTER JOIN prev p USING (category)
  ORDER BY growth_pct DESC NULLS LAST;
$$;

-- 10. get_top_regions (with date range)
CREATE OR REPLACE FUNCTION public.get_top_regions(
    p_limit        integer DEFAULT 8,
    p_country      text    DEFAULT NULL,
    p_region       text    DEFAULT NULL,
    p_product      text    DEFAULT NULL,
    p_category     text    DEFAULT NULL,
    p_target_month text    DEFAULT NULL,
    p_start_date   date    DEFAULT NULL,
    p_end_date     date    DEFAULT NULL
) RETURNS TABLE(country text, region text, revenue numeric, orders bigint)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT h.country, h.region,
         SUM(h.revenue) AS revenue, COUNT(*) AS orders
  FROM harmonized_sales h
  WHERE (p_country    IS NULL OR h.country            = p_country)
    AND (p_region     IS NULL OR h.region              = p_region)
    AND (p_product    IS NULL OR h.normalized_product = p_product)
    AND (p_category   IS NULL OR h.category           = p_category)
    AND (p_target_month IS NULL OR TO_CHAR(h.sale_date, 'YYYY-MM') = p_target_month)
    AND (p_start_date IS NULL OR h.sale_date              >= p_start_date)
    AND (p_end_date   IS NULL OR h.sale_date              <= p_end_date)
  GROUP BY h.country, h.region
  ORDER BY revenue DESC
  LIMIT p_limit;
$$;

-- 11. get_filter_options — enrich to return categories and regions as expected by frontend
CREATE OR REPLACE FUNCTION get_filter_options()
RETURNS TABLE (countries json, regions json, products json, categories json) LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        (SELECT json_agg(DISTINCT country ORDER BY country) FROM harmonized_sales WHERE country IS NOT NULL) AS countries,
        (SELECT json_agg(r) FROM (
            SELECT DISTINCT country, region
            FROM harmonized_sales
            WHERE region IS NOT NULL
            ORDER BY country, region
        ) r) AS regions,
        (SELECT json_agg(DISTINCT normalized_product ORDER BY normalized_product) FROM harmonized_sales WHERE normalized_product IS NOT NULL) AS products,
        (SELECT json_agg(DISTINCT category ORDER BY category) FROM harmonized_sales WHERE category IS NOT NULL) AS categories;
$$;
