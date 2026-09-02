"""
OmniSales Advanced Forecast Engine (Random Forest ML)
======================================================
Rebuilt for high-potential demand forecasting:
  - Feature Engineering (Lags, Seasonality)
  - RandomForestRegressor (Non-linear pattern detection)
  - Confidence Interval generation (Residual Std Error)
  - Multi-granularity (Category + Region)
"""

import os, json, uuid
from datetime import datetime, timezone
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from supabase import create_client, Client

# ── Config ─────────────────────────────────────────────────────────────────────
SUPABASE_URL = "https://bnmfhmsidqfqhkvcaqpp.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWZobXNpZHFmcWhrdmNhcXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzQyMzMsImV4cCI6MjA4ODQ1MDIzM30.S9y-jDPaW0QNneKpCxNh3ce4terJQ54njvGms7i52LY"

sb: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def fetch_sales() -> pd.DataFrame:
    print("Fetching historical sales for ML training...")
    rows = []
    page, page_size = 0, 1000
    while True:
        res = sb.table("harmonized_sales").select("*").range(page*page_size, (page+1)*page_size-1).execute()
        batch = res.data
        if not batch: break
        rows.extend(batch)
        if len(batch) < page_size: break
        page += 1
    
    df = pd.DataFrame(rows)
    df["sale_date"] = pd.to_datetime(df["sale_date"])
    df["revenue"] = df["quantity"].astype(float) * df["price"].astype(float)
    df["year"] = df["sale_date"].dt.year
    df["month"] = df["sale_date"].dt.month
    df["ym"] = df["sale_date"].dt.to_period("M")
    return df

def generate_advanced_forecasts(df: pd.DataFrame) -> list[dict]:
    print("Initializing RandomForest Demand Hub...")
    forecast_results = []
    
    # 1. Aggregation and Top Product Mapping
    monthly = df.groupby(["ym", "category", "region"]).agg({
        "revenue": "sum",
        "quantity": "sum"
    }).reset_index().sort_values("ym")

    # Pre-calculate top products per category/region
    top_prods_df = df.groupby(["category", "region", "product_name"])["revenue"].sum().reset_index()
    top_prods_df = top_prods_df.sort_values("revenue", ascending=False).drop_duplicates(["category", "region"])
    top_prods_map = top_prods_df.set_index(["category", "region"])["product_name"].to_dict()
    
    # Generate lags for the whole dataset
    monthly["lag_rev_1"] = monthly.groupby(["category", "region"])["revenue"].shift(1)
    monthly["lag_rev_2"] = monthly.groupby(["category", "region"])["revenue"].shift(2)
    monthly = monthly.fillna(0)

    unique_groups = monthly.groupby(["category", "region"])
    
    # Next 4 months to project
    last_ym = monthly["ym"].max()
    next_yms = [last_ym + i for i in range(1, 5)]

    for (cat, region), group in unique_groups:
        if len(group) < 5: continue # Need enough history for Forest
        
        top_product = top_prods_map.get((cat, region), "Unknown Product")
        
        # Prepare Features
        # Features: month_num, lag1, lag2
        X = group[["lag_rev_1", "lag_rev_2"]].copy()
        X["month_num"] = group["ym"].apply(lambda x: x.month)
        
        # Target
        y_rev = group["revenue"].values
        y_qty = group["quantity"].values

        # Train Model
        model_rev = RandomForestRegressor(n_estimators=50, random_state=42).fit(X, y_rev)
        model_qty = RandomForestRegressor(n_estimators=50, random_state=42).fit(X, y_qty)

        # Confidence Calculation (Simplified standard error of residuals)
        preds_train = model_rev.predict(X)
        residuals = y_rev - preds_train
        std_error = np.std(residuals) if len(residuals) > 1 else 0
        r_squared = model_rev.score(X, y_rev)

        # Strategic Insight Label logic
        seasonal_avg = group.groupby(group["ym"].apply(lambda x: x.month))["revenue"].mean()
        
        curr_lag1 = y_rev[-1]
        curr_lag2 = y_rev[-2] if len(y_rev) > 1 else y_rev[-1]

        for i, proj_ym in enumerate(next_yms):
            # Rolling lag calculation for the next month
            target_month = proj_ym.month
            
            # Predict
            X_prime = pd.DataFrame([[curr_lag1, curr_lag2, target_month]], columns=["lag_rev_1", "lag_rev_2", "month_num"])
            pred_r = float(model_rev.predict(X_prime)[0])
            pred_q = int(model_qty.predict(X_prime)[0])
            
            # Confidence Bounds (95% CI Approx)
            lower = max(0, pred_r - (1.96 * std_error))
            upper = pred_r + (1.96 * std_error)
            
            # Generate Insight
            month_name = proj_ym.strftime("%B")
            historic_peak = seasonal_avg.idxmax()
            
            insight = f"Steady trend expected for {cat}."
            if target_month == historic_peak:
                insight = f"Strategic Peak Alert: {month_name} remains your highest demand window for {cat} in {region}."
            elif pred_r > curr_lag1 * 1.1:
                insight = f"Accelerating Momentum: Growth of {round((pred_r/curr_lag1 - 1)*100)}% projected based on recent performance."
            elif pred_r < curr_lag1 * 0.9:
                insight = f"Cooling Demand: Volume expected to dip in {month_name}. Consider inventory adjustments."

            forecast_results.append({
                "forecast_month": proj_ym.strftime("%Y-%m-01"),
                "category": cat,
                "region": region,
                "predicted_revenue": round(pred_r, 2),
                "predicted_quantity": pred_q,
                "lower_bound": round(lower, 2),
                "upper_bound": round(upper, 2),
                "confidence": round(r_squared * 100, 1),
                "insight_label": insight,
                "model_name": "Random Forest (v2-Multivariate)",
                "top_product": top_product
            })
            
            # Update lags for multi-step projection
            curr_lag2 = curr_lag1
            curr_lag1 = pred_r

    return forecast_results

def main():
    print("-" * 60)
    print("  OmniSales Advanced Forecast Engine - REBUILT")
    print("-" * 60)
    
    df = fetch_sales()
    if df.empty:
        print("No sales data found.")
        return

    forecasts = generate_advanced_forecasts(df)
    
    print(f"Pushing {len(forecasts)} high-depth forecast rows...")
    # Clear old forecasts & Insert new
    sb.table("forecasts").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    if forecasts:
        sb.table("forecasts").insert(forecasts).execute()
    
    print("\nDeep Rebuild Complete! UI will now show uncertainty bands and strategic labels.")

if __name__ == "__main__":
    main()
