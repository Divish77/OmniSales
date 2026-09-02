-- =======================================================================================
-- UPDATE DATABASE ENGINES FOR TENANT ISOLATION
-- Replace TRUNCATE commands globally, add SECURITY INVOKER where needed, and update Triggers.
-- =======================================================================================

-- 1. Redefine the `generate_ai_insights_engine` securely without TRUNCATE
CREATE OR REPLACE FUNCTION generate_ai_insights_engine()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER -- Vital: Forces Postgres to use RLS 
AS $$
DECLARE
    now_ts timestamptz := NOW();
BEGIN
    -- Only delete THIS USER's insights, never TRUNCATE the whole table!
    DELETE FROM ai_insights WHERE user_id = auth.uid();

    DROP TABLE IF EXISTS temp_mom_agg;

    CREATE TEMP TABLE temp_mom_agg ON COMMIT DROP AS
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
        -- No `user_id` filter necessary here because RLS will automatically filter harmonized_sales!
        GROUP BY 
            category, product_name, country, COALESCE(region, 'Unknown'), to_char(sale_date, 'YYYY-MM')
    )
    SELECT *,
        LAG(revenue) OVER (PARTITION BY category, product_name, country, state ORDER BY ym) AS prev_revenue,
        AVG(revenue) OVER (PARTITION BY ym) AS global_month_avg
    FROM monthly_agg;

    INSERT INTO ai_insights (id, insight_type, category, product_name, country, state, impact_level, title, body, metric_value, metric_label, generated_at, insight_month)
    SELECT gen_random_uuid(), 'anomaly', category, product_name, country, state, CASE WHEN revenue > (global_month_avg * 3.5) THEN 'high' ELSE 'medium' END, 'Anomalous Volume: ' || category, 'The revenue for ' || product_name || ' in ' || state || ' is statistically outside normal bounds ($' || ROUND(revenue) || '). This spike is anomalous.', ROUND(revenue), 'Unusual Revenue', now_ts, ym
    FROM temp_mom_agg WHERE revenue > (global_month_avg * 2.5) AND revenue >= 500;

    INSERT INTO ai_insights (id, insight_type, category, product_name, country, state, impact_level, title, body, metric_value, metric_label, generated_at, insight_month)
    SELECT gen_random_uuid(), CASE WHEN ((revenue - prev_revenue) / prev_revenue) * 100 > 50 THEN 'trend_acceleration' ELSE 'trend_cooling' END, category, product_name, country, state, CASE WHEN ((revenue - prev_revenue) / prev_revenue) * 100 > 100 THEN 'high' WHEN ((revenue - prev_revenue) / prev_revenue) * 100 BETWEEN 50 AND 100 THEN 'medium' ELSE 'medium' END, CASE WHEN ((revenue - prev_revenue) / prev_revenue) * 100 > 50 THEN 'True Growth: ' || category ELSE 'Regional Softness' END, CASE WHEN ((revenue - prev_revenue) / prev_revenue) * 100 > 50 THEN product_name || ' is growing ' || ROUND(((revenue - prev_revenue) / prev_revenue) * 100, 1) || '% MoM in ' || state || '.' ELSE 'Market demand for ' || product_name || ' in ' || state || ' has cooled by ' || ABS(ROUND(((revenue - prev_revenue) / prev_revenue) * 100, 1)) || '% compared to last month.' END, ROUND(((revenue - prev_revenue) / prev_revenue) * 100, 1), CASE WHEN ((revenue - prev_revenue) / prev_revenue) * 100 > 50 THEN '% MoM Growth' ELSE '% MoM Decline' END, now_ts, ym
    FROM temp_mom_agg WHERE prev_revenue > 0 AND revenue >= 500 AND (((revenue - prev_revenue) / prev_revenue) * 100 > 50 OR ((revenue - prev_revenue) / prev_revenue) * 100 < -30);

    WITH country_cat_agg AS (SELECT ym, country, category, SUM(revenue) AS total_market_revenue FROM temp_mom_agg GROUP BY ym, country, category)
    INSERT INTO ai_insights (id, insight_type, category, product_name, country, state, impact_level, title, body, metric_value, metric_label, generated_at, insight_month)
    SELECT gen_random_uuid(), 'risk', m.category, m.product_name, m.country, NULL, CASE WHEN (m.revenue / c.total_market_revenue) > 0.85 THEN 'high' ELSE 'medium' END, 'High Market Concentration', 'The ''' || m.category || ''' segment in ' || m.country || ' is heavily reliant on ' || m.product_name || '. Monopolization index is ' || ROUND((m.revenue / c.total_market_revenue), 2) || '.', ROUND((m.revenue / c.total_market_revenue), 2), 'Concentration Index', now_ts, m.ym
    FROM temp_mom_agg m JOIN country_cat_agg c ON m.ym = c.ym AND m.country = c.country AND m.category = c.category WHERE c.total_market_revenue >= 500 AND (m.revenue / c.total_market_revenue) > 0.70;

END;
$$;

-- 2. Modify `generate_recommendations` to use DELETE
CREATE OR REPLACE FUNCTION generate_recommendations()
RETURNS integer
LANGUAGE plpgsql 
SECURITY INVOKER 
AS $$
DECLARE
    rec RECORD;
    inserted integer := 0;
BEGIN
    DELETE FROM ai_recommendations WHERE user_id = auth.uid();

    -- Rule 1
    FOR rec IN SELECT category, ROUND(100.0 * SUM(CASE WHEN channel='online' THEN revenue ELSE 0 END) / NULLIF(SUM(revenue),0), 1) AS online_pct, ROUND(SUM(revenue), 0) AS total_rev FROM harmonized_sales GROUP BY category HAVING SUM(CASE WHEN channel='online' THEN revenue ELSE 0 END) / NULLIF(SUM(revenue),0) > 0.6
    LOOP INSERT INTO ai_recommendations (title, recommendation, category, channel, impact_level, metric_basis, metric_value) VALUES (rec.category || ' dominates online at ' || rec.online_pct || '%', 'Increase digital advertising budget for ' || rec.category || '. ' || rec.online_pct || '% of revenue comes from online channels. Consider targeted social media campaigns and influencer partnerships.', rec.category, 'online', 'high', 'online_revenue_pct', rec.online_pct); inserted := inserted + 1; END LOOP;
    -- Rule 2
    FOR rec IN SELECT category, ROUND(100.0 * SUM(CASE WHEN channel='store' THEN revenue ELSE 0 END) / NULLIF(SUM(revenue),0), 1) AS store_pct, SUM(quantity) AS total_units FROM harmonized_sales GROUP BY category HAVING SUM(CASE WHEN channel='store' THEN revenue ELSE 0 END) / NULLIF(SUM(revenue),0) > 0.5
    LOOP INSERT INTO ai_recommendations (title, recommendation, category, channel, impact_level, metric_basis, metric_value) VALUES ('Strengthen in-store strategy for ' || rec.category, rec.category || ' has strong store preference (' || rec.store_pct || '% store revenue). Focus on in-store displays, loyalty programs, and regional store-specific promotions.', rec.category, 'store', 'medium', 'store_revenue_pct', rec.store_pct); inserted := inserted + 1; END LOOP;
    -- Rule 3
    FOR rec IN SELECT normalized_product, category, SUM(quantity) AS total_qty FROM harmonized_sales GROUP BY normalized_product, category ORDER BY SUM(quantity) DESC LIMIT 3
    LOOP INSERT INTO ai_recommendations (title, recommendation, category, impact_level, metric_basis, metric_value) VALUES ('Prioritize stock for ' || rec.normalized_product, rec.normalized_product || ' is your top seller with ' || rec.total_qty || ' units sold. Maintain at least 30% safety stock and consider bundle deals to increase average order value.', rec.category, 'high', 'total_units_sold', rec.total_qty); inserted := inserted + 1; END LOOP;
    -- Rule 4
    FOR rec IN SELECT region, ROUND(SUM(revenue), 0) AS rev FROM harmonized_sales GROUP BY region ORDER BY SUM(revenue) ASC LIMIT 2
    LOOP INSERT INTO ai_recommendations (title, recommendation, region, impact_level, metric_basis, metric_value) VALUES ('Growth opportunity in ' || rec.region, rec.region || ' shows the lowest sales volume ($' || rec.rev || '). Consider targeted regional promotions, local partnerships, or pop-up store events to grow presence.', rec.region, 'medium', 'regional_revenue', rec.rev); inserted := inserted + 1; END LOOP;
    
    RETURN inserted;
END;
$$;

-- 3. Modify insert triggers to map user_id safely
CREATE OR REPLACE FUNCTION sync_online_sale_to_harmonized() RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
  INSERT INTO harmonized_sales (id, sale_date, product_name, normalized_product, category, quantity, price, region, country, channel, store_name, user_id, created_at)
  VALUES (NEW.sale_id, NEW.sale_date, NEW.product_name, lower(trim(NEW.product_name)), NEW.category, NEW.quantity, NEW.price, NEW.region, NEW.country, 'online', NEW.store_name, NEW.user_id, NOW())
  ON CONFLICT (id) DO UPDATE SET sale_date=EXCLUDED.sale_date, product_name=EXCLUDED.product_name, normalized_product=EXCLUDED.normalized_product, category=EXCLUDED.category, quantity=EXCLUDED.quantity, price=EXCLUDED.price, region=EXCLUDED.region, country=EXCLUDED.country, store_name=EXCLUDED.store_name;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_store_sale_to_harmonized() RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
  INSERT INTO harmonized_sales (id, sale_date, product_name, normalized_product, category, quantity, price, region, country, channel, store_name, user_id, created_at)
  VALUES (NEW.sale_id, NEW.sale_date, NEW.product_name, lower(trim(NEW.product_name)), NEW.category, NEW.quantity, NEW.price, NEW.region, NEW.country, 'store', NEW.store_name, NEW.user_id, NOW())
  ON CONFLICT (id) DO UPDATE SET sale_date=EXCLUDED.sale_date, product_name=EXCLUDED.product_name, normalized_product=EXCLUDED.normalized_product, category=EXCLUDED.category, quantity=EXCLUDED.quantity, price=EXCLUDED.price, region=EXCLUDED.region, country=EXCLUDED.country, store_name=EXCLUDED.store_name;
  RETURN NEW;
END;
$$;

-- 4. Apply SECURITY INVOKER to ALL view queries globally!
ALTER FUNCTION get_ai_insights_v2 SECURITY INVOKER;
ALTER FUNCTION get_channel_revenue SECURITY INVOKER;
ALTER FUNCTION get_category_performance SECURITY INVOKER;
ALTER FUNCTION get_regional_demand SECURITY INVOKER;
ALTER FUNCTION get_channel_preference SECURITY INVOKER;
ALTER FUNCTION get_channel_trend SECURITY INVOKER;
ALTER FUNCTION get_repeat_products SECURITY INVOKER;
ALTER FUNCTION get_ai_recommendations SECURITY INVOKER;
ALTER FUNCTION get_forecasts SECURITY INVOKER;
ALTER FUNCTION get_analytics_insights SECURITY INVOKER;
ALTER FUNCTION get_sales_kpis SECURITY INVOKER;
ALTER FUNCTION get_monthly_sales SECURITY INVOKER;
ALTER FUNCTION get_top_products SECURITY INVOKER;
ALTER FUNCTION get_top_regions SECURITY INVOKER;
