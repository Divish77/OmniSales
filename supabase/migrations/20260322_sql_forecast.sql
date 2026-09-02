-- SQL-based ML Forecasting using PostgreSQL built-in linear regression functions
-- Replaces the need for the Python agent entirely

CREATE OR REPLACE FUNCTION run_sql_forecast()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    inserted_count integer := 0;
    rec RECORD;
    next_month_num integer;
    pred_rev numeric;
    pred_qty integer;
    r2_val numeric;
    last_month date;
BEGIN
    -- Clear old forecasts
    TRUNCATE TABLE forecasts;

    -- For each category, run linear regression on monthly revenue
    FOR rec IN
        WITH monthly AS (
            SELECT
                category,
                DATE_TRUNC('month', date)::date AS month,
                EXTRACT(EPOCH FROM DATE_TRUNC('month', date)) / 2592000 AS month_num, -- months since epoch
                SUM(revenue) AS revenue,
                SUM(quantity) AS total_qty
            FROM harmonized_sales
            GROUP BY category, DATE_TRUNC('month', date)
        ),
        regression AS (
            SELECT
                category,
                regr_slope(revenue, month_num)     AS slope_rev,
                regr_intercept(revenue, month_num) AS intercept_rev,
                regr_slope(total_qty, month_num)   AS slope_qty,
                regr_intercept(total_qty, month_num) AS intercept_qty,
                regr_r2(revenue, month_num)        AS r2,
                MAX(month_num)                     AS max_month_num,
                MAX(month)                         AS max_month,
                COUNT(*)                           AS data_points
            FROM monthly
            GROUP BY category
            HAVING COUNT(*) >= 2  -- need at least 2 points for regression
        )
        SELECT * FROM regression
    LOOP
        -- Compute R² confidence (clamped 0-100)
        r2_val := GREATEST(0, LEAST(100, ROUND(COALESCE(rec.r2, 0) * 100, 1)));
        last_month := rec.max_month;

        -- Generate 3 monthly forecasts
        FOR i IN 1..3 LOOP
            next_month_num := rec.max_month_num + i;
            -- Linear prediction: y = slope * x + intercept
            pred_rev := GREATEST(0, rec.slope_rev * next_month_num + rec.intercept_rev);
            pred_qty := GREATEST(0, ROUND(rec.slope_qty * next_month_num + rec.intercept_qty))::integer;

            INSERT INTO forecasts (forecast_month, category, predicted_revenue, predicted_quantity, model_name, confidence)
            VALUES (
                (last_month + (i || ' months')::interval)::date,
                rec.category,
                ROUND(pred_rev, 2),
                pred_qty,
                'PostgreSQL LinearRegression',
                r2_val
            );
            inserted_count := inserted_count + 1;
        END LOOP;
    END LOOP;

    RETURN inserted_count;
END;
$$;

-- Run it immediately
SELECT run_sql_forecast();
