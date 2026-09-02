-- =========================================================================
-- OmniSales Native AI Insights Engine (PL/pgSQL)
-- Port of the Python Machine Learning engine to native Postgres for real-time Edge speed.
-- =========================================================================

CREATE OR REPLACE FUNCTION generate_ai_insights_engine()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    now_ts timestamptz := NOW();
BEGIN
    -- 1. Wipe Old Insights
    TRUNCATE TABLE ai_insights;

    -- 2. Base Aggregation CTE to evaluate data
    -- We aggregate by product_name, category, country, state, and month.
    WITH monthly_agg AS (
        SELECT 
            category,
            product_name,
            country,
            COALESCE(region, 'Unknown') AS state,
            to_char(sale_date, 'YYYY-MM') AS ym,
            SUM(revenue) AS revenue,
            SUM(quantity) AS qty
        FROM harmonized_sales
        GROUP BY 
            category,
            product_name,
            country,
            COALESCE(region, 'Unknown'),
            to_char(sale_date, 'YYYY-MM')
    ),
    -- Contextual Lag Calculation (Month over Month)
    mom_agg AS (
        SELECT 
            *,
            LAG(revenue) OVER (
                PARTITION BY category, product_name, country, state 
                ORDER BY ym
            ) AS prev_revenue,
            AVG(revenue) OVER (
                PARTITION BY ym
            ) AS global_month_avg
        FROM monthly_agg
        WHERE revenue >= 500
    )

    -- INSERT RULE 1: Anomaly Detection (approximating IsolationForest)
    -- Revenue Spike > 2.5x the average volume for the month
    INSERT INTO ai_insights (
        id, insight_type, category, product_name, country, state, 
        impact_level, title, body, metric_value, metric_label, generated_at, insight_month
    )
    SELECT 
        gen_random_uuid(),
        'anomaly',
        category,
        product_name,
        country,
        state,
        CASE WHEN revenue > (global_month_avg * 3.5) THEN 'high' ELSE 'medium' END,
        'Anomalous Volume: ' || category,
        'The revenue for ' || product_name || ' in ' || state || ' is statistically outside normal bounds ($' || ROUND(revenue) || '). This spike is anomalous.',
        ROUND(revenue),
        'Unusual Revenue',
        now_ts,
        ym
    FROM mom_agg
    WHERE revenue > (global_month_avg * 2.5);

    -- INSERT RULE 2: Trend Momentum (Replacing YoY with robust MoM Growth)
    INSERT INTO ai_insights (
        id, insight_type, category, product_name, country, state, 
        impact_level, title, body, metric_value, metric_label, generated_at, insight_month
    )
    SELECT 
        gen_random_uuid(),
        CASE WHEN ((revenue - prev_revenue) / prev_revenue) * 100 > 50 THEN 'trend_acceleration' ELSE 'trend_cooling' END,
        category,
        product_name,
        country,
        state,
        CASE 
            WHEN ((revenue - prev_revenue) / prev_revenue) * 100 > 100 THEN 'high' 
            WHEN ((revenue - prev_revenue) / prev_revenue) * 100 BETWEEN 50 AND 100 THEN 'medium'
            ELSE 'medium' 
        END,
        CASE WHEN ((revenue - prev_revenue) / prev_revenue) * 100 > 50 THEN 'True Growth: ' || category ELSE 'Regional Softness' END,
        CASE WHEN ((revenue - prev_revenue) / prev_revenue) * 100 > 50 
            THEN product_name || ' is growing ' || ROUND(((revenue - prev_revenue) / prev_revenue) * 100, 1) || '% MoM in ' || state || '.'
            ELSE 'Market demand for ' || product_name || ' in ' || state || ' has cooled by ' || ABS(ROUND(((revenue - prev_revenue) / prev_revenue) * 100, 1)) || '% compared to last month.'
        END,
        ROUND(((revenue - prev_revenue) / prev_revenue) * 100, 1),
        CASE WHEN ((revenue - prev_revenue) / prev_revenue) * 100 > 50 THEN '% MoM Growth' ELSE '% MoM Decline' END,
        now_ts,
        ym
    FROM mom_agg
    WHERE prev_revenue > 0 AND (
        ((revenue - prev_revenue) / prev_revenue) * 100 > 50 
        OR 
        ((revenue - prev_revenue) / prev_revenue) * 100 < -30
    );

    -- INSERT RULE 3: Market Concentration Risk
    -- A single product owns >70% of a country's revenue for a category
    WITH country_cat_agg AS (
        SELECT 
            ym, country, category, 
            SUM(revenue) AS total_market_revenue
        FROM monthly_agg
        GROUP BY ym, country, category
    )
    INSERT INTO ai_insights (
        id, insight_type, category, product_name, country, state, 
        impact_level, title, body, metric_value, metric_label, generated_at, insight_month
    )
    SELECT 
        gen_random_uuid(),
        'risk',
        m.category,
        m.product_name,
        m.country,
        NULL,
        CASE WHEN (m.revenue / c.total_market_revenue) > 0.85 THEN 'high' ELSE 'medium' END,
        'High Market Concentration',
        'The ''' || m.category || ''' segment in ' || m.country || ' is heavily reliant on ' || m.product_name || '. Monopolization index is ' || ROUND((m.revenue / c.total_market_revenue), 2) || '.',
        ROUND((m.revenue / c.total_market_revenue), 2),
        'Concentration Index',
        now_ts,
        m.ym
    FROM monthly_agg m
    JOIN country_cat_agg c 
      ON m.ym = c.ym AND m.country = c.country AND m.category = c.category
    WHERE c.total_market_revenue >= 500
      AND (m.revenue / c.total_market_revenue) > 0.70;

END;
$$;
