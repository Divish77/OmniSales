-- ============================================================
-- FULL FIX: Drop ambiguous overloads + recreate all RPCs
-- from harmonized_sales data
-- ============================================================

-- 1. Drop all overloaded/ambiguous functions first
DROP FUNCTION IF EXISTS get_channel_trend(text,text,text,text,text);
DROP FUNCTION IF EXISTS get_channel_trend(text,text,text,text,text,date,date);
DROP FUNCTION IF EXISTS get_basket_analysis(text,text,text,text);
DROP FUNCTION IF EXISTS get_basket_analysis(text,text,text,text,date,date);
DROP FUNCTION IF EXISTS get_loyalty_signals(text,text,text,text);
DROP FUNCTION IF EXISTS get_loyalty_signals(text,text,text,text,date,date);
DROP FUNCTION IF EXISTS get_channel_kpis(text,text,text,text);
DROP FUNCTION IF EXISTS get_channel_kpis(text,text,text,text,date,date);
DROP FUNCTION IF EXISTS get_repeat_products(text,text,text,text);
DROP FUNCTION IF EXISTS get_strategic_briefing(text,text,text,text,text);
DROP FUNCTION IF EXISTS get_analytics_insights(text,text,text,text);
DROP FUNCTION IF EXISTS get_sales_kpis(text,text,text,text,text);
DROP FUNCTION IF EXISTS get_sales_kpis(text,text,text,text,text,date,date);
DROP FUNCTION IF EXISTS public.get_sales_kpis(text,text,text,text,text,date,date);
DROP FUNCTION IF EXISTS get_mom_growth(text,text,text,text,text);
DROP FUNCTION IF EXISTS get_mom_growth(text,text,text,text,text,date,date);
DROP FUNCTION IF EXISTS public.get_mom_growth(text,text,text,text,text,date,date);
DROP FUNCTION IF EXISTS get_top_regions(integer,text,text,text,text,text);
DROP FUNCTION IF EXISTS get_top_regions(integer,text,text,text,text,text,date,date);
DROP FUNCTION IF EXISTS public.get_top_regions(integer,text,text,text,text,text,date,date);
DROP FUNCTION IF EXISTS get_forecasts_v2(text,text,text,text,text);
DROP FUNCTION IF EXISTS get_dynamic_ml_insights(text,text,text,text,text);
DROP FUNCTION IF EXISTS get_ai_insights_v2(text,text,text,text,text);
DROP FUNCTION IF EXISTS get_ai_recommendations(text,text,text,text);


-- ============================================================
-- 2. get_channel_trend
-- ============================================================
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
    WHERE (p_country      IS NULL OR country            = p_country)
      AND (p_region       IS NULL OR region              = p_region)
      AND (p_product      IS NULL OR normalized_product = p_product)
      AND (p_category     IS NULL OR category           = p_category)
      AND (p_target_month IS NULL OR TO_CHAR(sale_date, 'YYYY-MM') = p_target_month)
      AND (p_start_date   IS NULL OR sale_date          >= p_start_date)
      AND (p_end_date     IS NULL OR sale_date          <= p_end_date)
    GROUP BY DATE_TRUNC('month', sale_date)
    ORDER BY DATE_TRUNC('month', sale_date);
$$;

-- ============================================================
-- 3. get_basket_analysis
-- ============================================================
CREATE OR REPLACE FUNCTION get_basket_analysis(
    p_country      text DEFAULT NULL,
    p_region       text DEFAULT NULL,
    p_category     text DEFAULT NULL,
    p_target_month text DEFAULT NULL,
    p_start_date   date DEFAULT NULL,
    p_end_date     date DEFAULT NULL
) RETURNS TABLE (category text, channel text, avg_basket_value numeric, avg_units numeric, total_transactions bigint)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        category,
        channel,
        ROUND(AVG(price * quantity), 2)  AS avg_basket_value,
        ROUND(AVG(quantity), 2)           AS avg_units,
        COUNT(*)                          AS total_transactions
    FROM harmonized_sales
    WHERE (p_country      IS NULL OR country   = p_country)
      AND (p_region       IS NULL OR region    = p_region)
      AND (p_category     IS NULL OR category  = p_category)
      AND (p_target_month IS NULL OR TO_CHAR(sale_date, 'YYYY-MM') = p_target_month)
      AND (p_start_date   IS NULL OR sale_date >= p_start_date)
      AND (p_end_date     IS NULL OR sale_date <= p_end_date)
    GROUP BY category, channel
    ORDER BY avg_basket_value DESC;
$$;

-- ============================================================
-- 4. get_loyalty_signals (high-repeat products)
-- ============================================================
CREATE OR REPLACE FUNCTION get_loyalty_signals(
    p_country      text DEFAULT NULL,
    p_region       text DEFAULT NULL,
    p_category     text DEFAULT NULL,
    p_target_month text DEFAULT NULL,
    p_start_date   date DEFAULT NULL,
    p_end_date     date DEFAULT NULL
) RETURNS TABLE (product_name text, category text, total_units bigint, total_orders bigint, avg_quantity numeric, channels text)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        normalized_product              AS product_name,
        category,
        SUM(quantity)                   AS total_units,
        COUNT(*)                        AS total_orders,
        ROUND(AVG(quantity), 2)         AS avg_quantity,
        STRING_AGG(DISTINCT channel, ', ' ORDER BY channel) AS channels
    FROM harmonized_sales
    WHERE (p_country      IS NULL OR country   = p_country)
      AND (p_region       IS NULL OR region    = p_region)
      AND (p_category     IS NULL OR category  = p_category)
      AND (p_target_month IS NULL OR TO_CHAR(sale_date, 'YYYY-MM') = p_target_month)
      AND (p_start_date   IS NULL OR sale_date >= p_start_date)
      AND (p_end_date     IS NULL OR sale_date <= p_end_date)
    GROUP BY normalized_product, category
    ORDER BY total_orders DESC
    LIMIT 20;
$$;

-- ============================================================
-- 5. get_channel_kpis
-- ============================================================
CREATE OR REPLACE FUNCTION get_channel_kpis(
    p_country      text DEFAULT NULL,
    p_region       text DEFAULT NULL,
    p_category     text DEFAULT NULL,
    p_target_month text DEFAULT NULL,
    p_start_date   date DEFAULT NULL,
    p_end_date     date DEFAULT NULL
) RETURNS TABLE (channel text, revenue numeric, orders bigint, share_pct numeric, avg_basket numeric)
LANGUAGE sql SECURITY DEFINER AS $$
    WITH base AS (
        SELECT
            channel,
            SUM(price * quantity) AS rev,
            COUNT(*)              AS ord,
            AVG(price * quantity) AS basket
        FROM harmonized_sales
        WHERE (p_country      IS NULL OR country   = p_country)
          AND (p_region       IS NULL OR region    = p_region)
          AND (p_category     IS NULL OR category  = p_category)
          AND (p_target_month IS NULL OR TO_CHAR(sale_date, 'YYYY-MM') = p_target_month)
          AND (p_start_date   IS NULL OR sale_date >= p_start_date)
          AND (p_end_date     IS NULL OR sale_date <= p_end_date)
        GROUP BY channel
    ),
    total AS (SELECT NULLIF(SUM(rev), 0) AS t FROM base)
    SELECT
        channel,
        ROUND(rev, 2)                           AS revenue,
        ord                                      AS orders,
        ROUND(rev / (SELECT t FROM total) * 100, 1) AS share_pct,
        ROUND(basket, 2)                        AS avg_basket
    FROM base ORDER BY revenue DESC;
$$;

-- ============================================================
-- 6. get_repeat_products
-- ============================================================
CREATE OR REPLACE FUNCTION get_repeat_products(
    p_country  text DEFAULT NULL,
    p_region   text DEFAULT NULL,
    p_product  text DEFAULT NULL,
    p_category text DEFAULT NULL
) RETURNS TABLE (product_name text, category text, total_units bigint, avg_quantity numeric, channels text)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        normalized_product              AS product_name,
        category,
        SUM(quantity)                   AS total_units,
        ROUND(AVG(quantity), 2)         AS avg_quantity,
        STRING_AGG(DISTINCT channel, ', ' ORDER BY channel) AS channels
    FROM harmonized_sales
    WHERE (p_country  IS NULL OR country            = p_country)
      AND (p_region   IS NULL OR region              = p_region)
      AND (p_product  IS NULL OR normalized_product = p_product)
      AND (p_category IS NULL OR category           = p_category)
    GROUP BY normalized_product, category
    ORDER BY total_units DESC
    LIMIT 20;
$$;

-- ============================================================
-- 7. get_sales_kpis (single clean version)
-- ============================================================
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

-- ============================================================
-- 8. get_mom_growth (single clean version)
-- ============================================================
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

-- ============================================================
-- 9. get_top_regions (single clean version)
-- ============================================================
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
         ROUND(SUM(h.revenue), 2) AS revenue, COUNT(*) AS orders
  FROM harmonized_sales h
  WHERE (p_country      IS NULL OR h.country            = p_country)
    AND (p_region       IS NULL OR h.region              = p_region)
    AND (p_product      IS NULL OR h.normalized_product = p_product)
    AND (p_category     IS NULL OR h.category           = p_category)
    AND (p_target_month IS NULL OR TO_CHAR(h.sale_date, 'YYYY-MM') = p_target_month)
    AND (p_start_date   IS NULL OR h.sale_date          >= p_start_date)
    AND (p_end_date     IS NULL OR h.sale_date          <= p_end_date)
  GROUP BY h.country, h.region
  ORDER BY revenue DESC
  LIMIT p_limit;
$$;

-- ============================================================
-- 10. get_forecasts_v2 — rolling 6-month projection from real data
-- ============================================================
CREATE OR REPLACE FUNCTION get_forecasts_v2(
    p_country      text DEFAULT NULL,
    p_region       text DEFAULT NULL,
    p_product      text DEFAULT NULL,
    p_category     text DEFAULT NULL,
    p_target_month text DEFAULT NULL
) RETURNS TABLE (
    forecast_month     text,
    category           text,
    predicted_revenue  numeric,
    predicted_quantity numeric,
    confidence         numeric,
    lower_bound        numeric,
    upper_bound        numeric,
    insight_label      text,
    region             text,
    top_product        text
)
LANGUAGE sql SECURITY DEFINER AS $$
  WITH hist AS (
    SELECT
      category,
      DATE_TRUNC('month', sale_date) AS m,
      SUM(revenue)   AS rev,
      SUM(quantity)  AS qty
    FROM harmonized_sales
    WHERE sale_date >= CURRENT_DATE - INTERVAL '6 months'
      AND (p_country  IS NULL OR country            = p_country)
      AND (p_region   IS NULL OR region              = p_region)
      AND (p_product  IS NULL OR normalized_product = p_product)
      AND (p_category IS NULL OR category           = p_category)
    GROUP BY 1, 2
  ),
  avg_hist AS (
    SELECT category, AVG(rev) AS avg_rev, AVG(qty) AS avg_qty, STDDEV(rev) AS std_rev
    FROM hist GROUP BY category
  ),
  top_prod AS (
    SELECT DISTINCT ON (category)
      category, normalized_product AS tp
    FROM harmonized_sales
    WHERE (p_country  IS NULL OR country            = p_country)
      AND (p_region   IS NULL OR region              = p_region)
      AND (p_category IS NULL OR category           = p_category)
    GROUP BY category, normalized_product
    ORDER BY category, SUM(revenue) DESC
  ),
  months AS (
    SELECT generate_series(
      DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month'),
      DATE_TRUNC('month', CURRENT_DATE + INTERVAL '6 months'),
      INTERVAL '1 month'
    ) AS fm
  )
  SELECT
    TO_CHAR(m.fm, 'YYYY-MM')                          AS forecast_month,
    a.category,
    ROUND(a.avg_rev * (1 + 0.05 * (ROW_NUMBER() OVER (PARTITION BY a.category ORDER BY m.fm))), 2) AS predicted_revenue,
    ROUND(a.avg_qty * (1 + 0.03 * (ROW_NUMBER() OVER (PARTITION BY a.category ORDER BY m.fm))), 2) AS predicted_quantity,
    ROUND(LEAST(95, 70 + 25 * (1 - COALESCE(a.std_rev,0) / NULLIF(a.avg_rev,1))), 1) AS confidence,
    ROUND(a.avg_rev * 0.85, 2)  AS lower_bound,
    ROUND(a.avg_rev * 1.20, 2)  AS upper_bound,
    CASE WHEN a.avg_rev > 500000 THEN 'High Growth Expected'
         WHEN a.avg_rev > 100000 THEN 'Steady Growth'
         ELSE 'Emerging Opportunity' END AS insight_label,
    COALESCE(p_region, 'All Regions')  AS region,
    COALESCE(tp.tp, 'Various')          AS top_product
  FROM months m
  CROSS JOIN avg_hist a
  LEFT JOIN top_prod tp ON tp.category = a.category
  ORDER BY a.category, m.fm;
$$;

-- ============================================================
-- 11. get_dynamic_ml_insights (customer behaviour ML insights)
-- ============================================================
CREATE OR REPLACE FUNCTION get_dynamic_ml_insights(
    p_country      text DEFAULT NULL,
    p_region       text DEFAULT NULL,
    p_category     text DEFAULT NULL,
    p_product      text DEFAULT NULL,
    p_target_month text DEFAULT NULL
) RETURNS TABLE (
    id           text,
    insight_type text,
    channel      text,
    region       text,
    category     text,
    product_name text,
    value        numeric,
    label        text,
    run_at       text
)
LANGUAGE sql SECURITY DEFINER AS $$
  WITH base AS (
    SELECT
      category, channel, region,
      normalized_product AS product_name,
      SUM(revenue) AS rev, SUM(quantity) AS qty, COUNT(*) AS cnt
    FROM harmonized_sales
    WHERE (p_country      IS NULL OR country            = p_country)
      AND (p_region       IS NULL OR region              = p_region)
      AND (p_category     IS NULL OR category           = p_category)
      AND (p_product      IS NULL OR normalized_product = p_product)
      AND (p_target_month IS NULL OR TO_CHAR(sale_date, 'YYYY-MM') = p_target_month)
    GROUP BY category, channel, region, normalized_product
  )
  SELECT
    gen_random_uuid()::text                        AS id,
    CASE WHEN channel = 'online' THEN 'online_preference'
         ELSE 'store_preference' END               AS insight_type,
    channel,
    region,
    category,
    product_name,
    ROUND(rev, 2)                                  AS value,
    category || ' | ' || channel || ' | ' || ROUND(rev/NULLIF(cnt,0),0)::text || ' avg order' AS label,
    NOW()::text                                    AS run_at
  FROM base
  ORDER BY rev DESC
  LIMIT 50;
$$;

-- ============================================================
-- 12. get_ai_insights_v2 — auto-generated insights from data
-- ============================================================
CREATE OR REPLACE FUNCTION get_ai_insights_v2(
    p_country  text DEFAULT NULL,
    p_state    text DEFAULT NULL,
    p_product  text DEFAULT NULL,
    p_category text DEFAULT NULL,
    p_month    text DEFAULT NULL
) RETURNS TABLE (
    id            text,
    insight_type  text,
    category      text,
    product_name  text,
    country       text,
    state         text,
    impact_level  text,
    title         text,
    body          text,
    metric_value  numeric,
    metric_label  text,
    generated_at  text,
    insight_month text
)
LANGUAGE sql SECURITY DEFINER AS $$
  WITH monthly AS (
    SELECT
      category,
      normalized_product,
      country,
      region,
      TO_CHAR(sale_date, 'YYYY-MM') AS mo,
      SUM(revenue) AS rev,
      SUM(quantity) AS qty
    FROM harmonized_sales
    WHERE (p_country  IS NULL OR country            = p_country)
      AND (p_state    IS NULL OR region              = p_state)
      AND (p_product  IS NULL OR normalized_product = p_product)
      AND (p_category IS NULL OR category           = p_category)
      AND (p_month    IS NULL OR TO_CHAR(sale_date,'YYYY-MM') = p_month)
    GROUP BY category, normalized_product, country, region, TO_CHAR(sale_date,'YYYY-MM')
  ),
  ranked AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY category ORDER BY rev DESC) AS rn
    FROM monthly
  )
  SELECT
    gen_random_uuid()::text AS id,
    'trend_acceleration'    AS insight_type,
    category,
    normalized_product      AS product_name,
    country,
    region                  AS state,
    CASE WHEN rev > 500000 THEN 'high'
         WHEN rev > 100000 THEN 'medium'
         ELSE 'low' END     AS impact_level,
    category || ' is trending in ' || country AS title,
    'Revenue of ' || ROUND(rev,0)::text || ' with ' || qty::text || ' units sold in ' || mo AS body,
    ROUND(rev, 2)           AS metric_value,
    'Revenue'               AS metric_label,
    NOW()::text             AS generated_at,
    mo                      AS insight_month
  FROM ranked
  WHERE rn <= 3
  ORDER BY rev DESC
  LIMIT 40;
$$;

-- ============================================================
-- 13. get_ai_recommendations
-- ============================================================
CREATE OR REPLACE FUNCTION get_ai_recommendations(
    p_country  text DEFAULT NULL,
    p_region   text DEFAULT NULL,
    p_product  text DEFAULT NULL,
    p_category text DEFAULT NULL
) RETURNS TABLE (
    id            text,
    title         text,
    recommendation text,
    category      text,
    channel       text,
    region        text,
    impact_level  text,
    metric_value  numeric,
    created_at    text
)
LANGUAGE sql SECURITY DEFINER AS $$
  WITH top AS (
    SELECT
      category, channel, region,
      SUM(revenue) AS rev, COUNT(*) AS cnt
    FROM harmonized_sales
    WHERE (p_country  IS NULL OR country            = p_country)
      AND (p_region   IS NULL OR region              = p_region)
      AND (p_product  IS NULL OR normalized_product = p_product)
      AND (p_category IS NULL OR category           = p_category)
    GROUP BY category, channel, region
    ORDER BY rev DESC
    LIMIT 15
  )
  SELECT
    gen_random_uuid()::text AS id,
    'Boost ' || category || ' via ' || channel AS title,
    'Focus ' || channel || ' investment in ' || region || ' for ' || category || '. Revenue potential: ' || ROUND(rev,0)::text AS recommendation,
    category,
    channel,
    region,
    CASE WHEN rev > 500000 THEN 'high'
         WHEN rev > 100000 THEN 'medium'
         ELSE 'low' END AS impact_level,
    ROUND(rev, 2) AS metric_value,
    NOW()::text   AS created_at
  FROM top;
$$;

-- ============================================================
-- 14. get_analytics_insights
-- ============================================================
CREATE OR REPLACE FUNCTION get_analytics_insights(
    p_country  text DEFAULT NULL,
    p_region   text DEFAULT NULL,
    p_product  text DEFAULT NULL,
    p_category text DEFAULT NULL
) RETURNS TABLE (
    id           text,
    insight_type text,
    title        text,
    metric_key   text,
    metric_value numeric,
    metric_delta numeric,
    details      json,
    severity     text,
    computed_at  text
)
LANGUAGE sql SECURITY DEFINER AS $$
  WITH curr AS (
    SELECT category, SUM(revenue) AS rev, COUNT(*) AS cnt
    FROM harmonized_sales
    WHERE sale_date >= date_trunc('month', NOW())
      AND (p_country  IS NULL OR country            = p_country)
      AND (p_region   IS NULL OR region              = p_region)
      AND (p_product  IS NULL OR normalized_product = p_product)
      AND (p_category IS NULL OR category           = p_category)
    GROUP BY category
  ),
  prev AS (
    SELECT category, SUM(revenue) AS rev
    FROM harmonized_sales
    WHERE sale_date >= date_trunc('month', NOW()) - INTERVAL '1 month'
      AND sale_date <  date_trunc('month', NOW())
      AND (p_country  IS NULL OR country            = p_country)
      AND (p_region   IS NULL OR region              = p_region)
      AND (p_product  IS NULL OR normalized_product = p_product)
      AND (p_category IS NULL OR category           = p_category)
    GROUP BY category
  )
  SELECT
    gen_random_uuid()::text AS id,
    'revenue_trend'         AS insight_type,
    c.category || ' Revenue Trend' AS title,
    'monthly_revenue'       AS metric_key,
    ROUND(c.rev, 2)         AS metric_value,
    CASE WHEN COALESCE(p.rev,0)=0 THEN NULL
         ELSE ROUND(((c.rev - p.rev)/p.rev)*100, 2) END AS metric_delta,
    json_build_object('category', c.category, 'orders', c.cnt) AS details,
    CASE WHEN c.rev > 500000 THEN 'high'
         WHEN c.rev > 100000 THEN 'medium'
         ELSE 'low' END AS severity,
    NOW()::text AS computed_at
  FROM curr c LEFT JOIN prev p USING (category)
  ORDER BY c.rev DESC;
$$;

-- ============================================================
-- 15. get_strategic_briefing
-- ============================================================
CREATE OR REPLACE FUNCTION get_strategic_briefing(
    p_country      text DEFAULT NULL,
    p_region       text DEFAULT NULL,
    p_product      text DEFAULT NULL,
    p_category     text DEFAULT NULL,
    p_target_month text DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_recs   json;
  v_sigs   json;
  v_top    json;
  v_result json;
BEGIN
  SELECT json_agg(r) INTO v_recs FROM (
    SELECT gen_random_uuid()::text AS id,
      'Boost ' || category || ' via ' || channel AS title,
      'Increase ' || channel || ' spend for ' || category AS recommendation,
      category, channel,
      COALESCE(p_region, 'All') AS region,
      CASE WHEN SUM(revenue)>500000 THEN 'high' WHEN SUM(revenue)>100000 THEN 'medium' ELSE 'low' END AS impact_level,
      ROUND(SUM(revenue),2) AS metric_value,
      NOW()::text AS created_at
    FROM harmonized_sales
    WHERE (p_country IS NULL OR country=p_country)
      AND (p_region  IS NULL OR region =p_region)
      AND (p_category IS NULL OR category=p_category)
    GROUP BY category, channel ORDER BY SUM(revenue) DESC LIMIT 5
  ) r;

  SELECT json_agg(s) INTO v_sigs FROM (
    SELECT
      'revenue_signal' AS insight_type,
      category         AS label,
      category,
      ROUND(SUM(revenue),2) AS value
    FROM harmonized_sales
    WHERE (p_country IS NULL OR country=p_country)
      AND (p_region  IS NULL OR region =p_region)
    GROUP BY category ORDER BY value DESC LIMIT 5
  ) s;

  SELECT json_build_object('category', category, 'potential_gain', ROUND(SUM(revenue)*0.15, 2))
  INTO v_top FROM harmonized_sales
  WHERE (p_country IS NULL OR country=p_country)
  GROUP BY category ORDER BY SUM(revenue) DESC LIMIT 1;

  v_result := json_build_object(
    'recommendations',         COALESCE(v_recs, '[]'::json),
    'signals',                 COALESCE(v_sigs, '[]'::json),
    'top_growth_opportunity',  COALESCE(v_top, '{}'::json),
    'generated_at',            NOW()::text
  );
  RETURN v_result;
END;
$$;
