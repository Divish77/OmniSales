-- =======================================================================================
-- NATIVE ANALYTICS ENGINE
-- Function to natively generate Analytics Insights avoiding the Python legacy system
-- =======================================================================================

CREATE OR REPLACE FUNCTION public.generate_analytics_insights_engine()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    now_ts timestamp with time zone := NOW();
BEGIN
    -- 1. Strict Tenant Isolation wipe
    DELETE FROM public.analytics_insights WHERE user_id = auth.uid();

    -- 2. Build temporal mapping (Trailing 90 days vs Prior 90 days)
    DROP TABLE IF EXISTS temp_analytics_agg;
    
    CREATE TEMP TABLE temp_analytics_agg ON COMMIT DROP AS
    WITH periods AS (
        SELECT 
            category,
            channel,
            SUM(CASE WHEN sale_date >= (CURRENT_DATE - INTERVAL '90 days') THEN revenue ELSE 0 END) AS recent_rev,
            SUM(CASE WHEN sale_date >= (CURRENT_DATE - INTERVAL '180 days') AND sale_date < (CURRENT_DATE - INTERVAL '90 days') THEN revenue ELSE 0 END) AS past_rev
        FROM harmonized_sales
        -- RLS implicitly filters to user_id
        GROUP BY category, channel
    )
    SELECT *,
        CASE WHEN past_rev > 0 THEN ((recent_rev - past_rev) / past_rev) * 100 ELSE 100 END as growth_pct
    FROM periods;

    -- 3. Top Category Breakout (Positive)
    INSERT INTO public.analytics_insights (insight_type, title, metric_key, metric_value, metric_delta, details, severity, computed_at, user_id)
    SELECT 
        'surge', 'Surge in ' || category, 'revenue_growth', recent_rev, growth_pct, 
        jsonb_build_object('interpretation', category || ' revenue is growing rapidly over the final 90 day window.'),
        'positive', now_ts, auth.uid()
    FROM temp_analytics_agg 
    WHERE recent_rev > 1000 AND growth_pct > 20
    ORDER BY growth_pct DESC LIMIT 2;

    -- 4. Channel Drop Warning (Negative)
    INSERT INTO public.analytics_insights (insight_type, title, metric_key, metric_value, metric_delta, details, severity, computed_at, user_id)
    SELECT 
        'pullback', 'Pullback in ' || channel || ' (' || category || ')', 'revenue_drop', recent_rev, growth_pct, 
        jsonb_build_object('interpretation', channel || ' sales for ' || category || ' have contracted significantly compared to previous baseline.'),
        'negative', now_ts, auth.uid()
    FROM temp_analytics_agg 
    WHERE past_rev > 500 AND growth_pct < -15
    ORDER BY growth_pct ASC LIMIT 2;

    -- 5. Stable Foundation (Info)
    INSERT INTO public.analytics_insights (insight_type, title, metric_key, metric_value, metric_delta, details, severity, computed_at, user_id)
    SELECT 
        'stable', 'Stable Baseline: ' || category, 'baseline_rev', recent_rev, growth_pct, 
        jsonb_build_object('interpretation', category || ' remains your steady anchor, maintaining flat revenue dynamics month-over-month.'),
        'info', now_ts, auth.uid()
    FROM temp_analytics_agg 
    WHERE recent_rev > 500 AND growth_pct BETWEEN -5 AND 5
    ORDER BY recent_rev DESC LIMIT 2;

END;
$$;
