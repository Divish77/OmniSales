-- Update KPI and Analytics functions to support advanced region filters

CREATE OR REPLACE FUNCTION public.get_sales_kpis(
    p_country text DEFAULT NULL,
    p_state text DEFAULT NULL,
    p_product text DEFAULT NULL
) RETURNS TABLE(metric text, value numeric, label text)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  curr_rev numeric;
  prev_rev numeric;
  curr_orders bigint;
  aov numeric;
BEGIN
  SELECT COALESCE(SUM(revenue),0) INTO curr_rev FROM harmonized_sales
  WHERE date >= date_trunc('month', NOW())
    AND (p_country IS NULL OR country = p_country)
    AND (p_state IS NULL OR state = p_state)
    AND (p_product IS NULL OR normalized_product = p_product);

  SELECT COALESCE(SUM(revenue),0) INTO prev_rev FROM harmonized_sales
  WHERE date >= date_trunc('month', NOW()) - INTERVAL '1 month'
    AND date < date_trunc('month', NOW())
    AND (p_country IS NULL OR country = p_country)
    AND (p_state IS NULL OR state = p_state)
    AND (p_product IS NULL OR normalized_product = p_product);

  SELECT COUNT(*) INTO curr_orders FROM harmonized_sales
  WHERE date >= date_trunc('month', NOW())
    AND (p_country IS NULL OR country = p_country)
    AND (p_state IS NULL OR state = p_state)
    AND (p_product IS NULL OR normalized_product = p_product);

  SELECT COALESCE(SUM(revenue)/NULLIF(COUNT(*),0),0) INTO aov FROM harmonized_sales
  WHERE date >= date_trunc('month', NOW())
    AND (p_country IS NULL OR country = p_country)
    AND (p_state IS NULL OR state = p_state)
    AND (p_product IS NULL OR normalized_product = p_product);

  RETURN QUERY VALUES
    ('current_month_revenue', curr_rev, 'This Month Revenue'),
    ('prev_month_revenue', prev_rev, 'Last Month Revenue'),
    ('mom_growth_pct',
      CASE WHEN prev_rev = 0 THEN NULL
           ELSE ROUND(((curr_rev - prev_rev)/prev_rev)*100, 2) END,
      'MoM Growth'),
    ('current_month_orders', curr_orders::numeric, 'Orders This Month'),
    ('avg_order_value', ROUND(aov, 2), 'Avg Order Value');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_mom_growth(
    p_country text DEFAULT NULL,
    p_state text DEFAULT NULL,
    p_product text DEFAULT NULL
) RETURNS TABLE(category text, current_month_revenue numeric, prev_month_revenue numeric, growth_pct numeric)
LANGUAGE sql SECURITY DEFINER AS $$
  WITH monthly AS (
    SELECT
      category,
      TO_CHAR(date, 'YYYY-MM') AS month,
      SUM(revenue) AS total_revenue
    FROM harmonized_sales
    WHERE date >= date_trunc('month', NOW()) - INTERVAL '1 month'
      AND (p_country IS NULL OR country = p_country)
      AND (p_state IS NULL OR state = p_state)
      AND (p_product IS NULL OR normalized_product = p_product)
    GROUP BY 1, 2
  ),
  curr AS (SELECT category, total_revenue FROM monthly WHERE month = TO_CHAR(NOW(), 'YYYY-MM')),
  prev AS (SELECT category, total_revenue FROM monthly WHERE month = TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY-MM'))
  SELECT
    COALESCE(c.category, p.category) AS category,
    COALESCE(c.total_revenue, 0)           AS current_month_revenue,
    COALESCE(p.total_revenue, 0)           AS prev_month_revenue,
    CASE WHEN COALESCE(p.total_revenue, 0) = 0 THEN NULL
         ELSE ROUND(((COALESCE(c.total_revenue,0) - COALESCE(p.total_revenue,0)) / COALESCE(p.total_revenue,0)) * 100, 2)
    END AS growth_pct
  FROM curr c FULL OUTER JOIN prev p USING (category)
  ORDER BY growth_pct DESC NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION public.get_top_regions(
    p_limit integer DEFAULT 8,
    p_country text DEFAULT NULL,
    p_state text DEFAULT NULL,
    p_product text DEFAULT NULL
) RETURNS TABLE(country text, region text, revenue numeric, orders bigint)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT h.country, COALESCE(h.state, h.region) as region, SUM(h.revenue) AS revenue, COUNT(*) AS orders
  FROM harmonized_sales h
  WHERE (p_country IS NULL OR h.country = p_country)
    AND (p_state IS NULL OR h.state = p_state)
    AND (p_product IS NULL OR h.normalized_product = p_product)
  GROUP BY h.country, COALESCE(h.state, h.region)
  ORDER BY revenue DESC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.get_analytics_insights(
    p_country text DEFAULT NULL,
    p_state text DEFAULT NULL,
    p_product text DEFAULT NULL
) RETURNS TABLE(id uuid, insight_type text, title text, metric_key text, metric_value numeric, metric_delta numeric, details jsonb, severity text, computed_at timestamp with time zone)
LANGUAGE sql SECURITY DEFINER AS $$
  -- Insights table doesn't native support filtering but we must accept the params to fulfill the RPC signature.
  SELECT id, insight_type, title, metric_key, metric_value, metric_delta, details, severity, computed_at
  FROM analytics_insights
  ORDER BY computed_at DESC, insight_type;
$$;
