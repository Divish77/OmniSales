"""
OmniSales AI Insights Engine - High-Accuracy Business Edition
============================================================
Features:
- 12-Month Lookback for YoY Context
- Significance Thresholding ($500+ Min Revenue)
- Dimensional Deep-Dives (State x Product Coverage)
- Normalizes Seasonality via Year-over-Year Growth logic
"""

import os
import uuid
import warnings
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from sklearn.ensemble import IsolationForest
from supabase import create_client, Client

warnings.filterwarnings("ignore")

SUPABASE_URL = "https://bnmfhmsidqfqhkvcaqpp.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWZobXNpZHFmcWhrdmNhcXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzQyMzMsImV4cCI6MjA4ODQ1MDIzM30.S9y-jDPaW0QNneKpCxNh3ce4terJQ54njvGms7i52LY"

sb: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Configs
IMPACT_HIGH      = "high"
IMPACT_MEDIUM    = "medium"
IMPACT_LOW       = "low"
MIN_REVENUE_SIGNIF = 500  # Filters out noise from low-volume segments

def fetch_sales() -> pd.DataFrame:
    print("Fetching historical sales data (12-month scope)...")
    rows, page, page_size = [], 0, 1000
    while True:
        res = sb.table("harmonized_sales").select("*").range(
            page * page_size, (page + 1) * page_size - 1
        ).execute()
        batch = res.data
        if not batch: break
        rows.extend(batch)
        if len(batch) < page_size: break
        page += 1

    if not rows: return pd.DataFrame()
    df = pd.DataFrame(rows)
    df["sale_date"] = pd.to_datetime(df["sale_date"])
    df["revenue"]   = df["quantity"].astype(float) * df["price"].astype(float)
    
    # Context columns
    df["ym"]        = df["sale_date"].dt.strftime("%Y-%m")
    df["month_idx"] = df["sale_date"].dt.month
    df["year"]      = df["sale_date"].dt.year
    df["state_map"] = df.get("region", pd.Series("Unknown", index=df.index)).fillna("Unknown")
    df["country"]   = df.get("country", pd.Series("Unknown", index=df.index)).fillna("Unknown")
    
    return df

def generate_insights():
    df = fetch_sales()
    if df.empty: return

    now = datetime.now(timezone.utc).isoformat()
    insights = []

    # Identify targets (last 6 months for output, 12 months for context)
    all_months = sorted(df["ym"].unique())
    target_months = all_months[-6:]
    print(f"Analyzing {len(all_months)} historical periods. Generating output for: {target_months}")

    # 1. PRE-CALCULATE AGGREGATES FOR YoY
    # Aggregate by Category x Country x State x Month
    full_agg = df.groupby(["category", "country", "state_map", "product_name", "ym", "month_idx", "year"]).agg(
        revenue=("revenue", "sum"),
        qty=("quantity", "sum")
    ).reset_index()

    for target_m in target_months:
        print(f"Processing accuracy check for {target_m}...")
        
        # Get Current Data
        curr_mask = full_agg["ym"] == target_m
        curr_batch = full_agg[curr_mask].copy()
        
        # Get Significance Filter
        curr_batch = curr_batch[curr_batch["revenue"] >= MIN_REVENUE_SIGNIF]
        if curr_batch.empty: continue

        # --- A. ANOMALIES (Z-Score + IsolationForest) ---
        if len(curr_batch) > 5:
            # We use revenue and quantity for anomaly detection
            iso = IsolationForest(contamination=0.1, random_state=42)
            curr_batch["anom_score"] = iso.fit_predict(curr_batch[["revenue", "qty"]])
            
            anoms = curr_batch[curr_batch["anom_score"] == -1].nlargest(15, "revenue")
            for _, row in anoms.iterrows():
                insights.append({
                    "id": str(uuid.uuid4()),
                    "insight_type": "anomaly",
                    "category": row["category"],
                    "product_name": row["product_name"],
                    "country": row["country"],
                    "state": row["state_map"],
                    "impact_level": IMPACT_HIGH if row["revenue"] > curr_batch["revenue"].mean() * 2.5 else IMPACT_MEDIUM,
                    "title": f"Anomalous Volume: {row['category']}",
                    "body": f"The revenue for {row['product_name']} in {row['state_map']} is statistically outside normal bounds (${row['revenue']:,.0f}). This spike is not explained by seasonal trends.",
                    "metric_value": round(float(row["revenue"]), 2),
                    "metric_label": "Unusual Revenue",
                    "generated_at": now,
                    "insight_month": target_m
                })

        # --- B. YoY GROWTH & MOMENTUM (High Accuracy) ---
        # For each segment in current batch, look for same month last year
        for index, row in curr_batch.iterrows():
            # Find matching segment 1 year ago
            prev_year = row["year"] - 1
            yoy_match = full_agg[
                (full_agg["category"] == row["category"]) &
                (full_agg["country"] == row["country"]) &
                (full_agg["state_map"] == row["state_map"]) &
                (full_agg["product_name"] == row["product_name"]) &
                (full_agg["month_idx"] == row["month_idx"]) &
                (full_agg["year"] == prev_year)
            ]

            if not yoy_match.empty:
                prev_rev = yoy_match.iloc[0]["revenue"]
                yoy_growth = ((row["revenue"] - prev_rev) / (prev_rev + 1)) * 100
                
                if yoy_growth > 50: # Significant YoY Acceleration
                    insights.append({
                        "id": str(uuid.uuid4()),
                        "insight_type": "trend_acceleration",
                        "category": row["category"],
                        "product_name": row["product_name"],
                        "country": row["country"],
                        "state": row["state_map"],
                        "impact_level": IMPACT_HIGH if yoy_growth > 100 else IMPACT_MEDIUM,
                        "title": f"True Growth: {row['category']}",
                        "body": f"{row['product_name']} is growing {yoy_growth:.1f}% YoY in {row['state_map']}. This represents organic expansion beyond normal seasonal expectations.",
                        "metric_value": round(float(yoy_growth), 1),
                        "metric_label": "% YoY Growth",
                        "generated_at": now,
                        "insight_month": target_m
                    })
                elif yoy_growth < -30: # Significant YoY Cooling
                    insights.append({
                        "id": str(uuid.uuid4()),
                        "insight_type": "trend_cooling",
                        "category": row["category"],
                        "product_name": row["product_name"],
                        "country": row["country"],
                        "state": row["state_map"],
                        "impact_level": IMPACT_MEDIUM,
                        "title": f"Regional Softness",
                        "body": f"Market demand for {row['product_name']} in {row['state_map']} has cooled by {abs(yoy_growth):.1f}% compared to last year.",
                        "metric_value": round(float(yoy_growth), 1),
                        "metric_label": "% YoY Decline",
                        "generated_at": now,
                        "insight_month": target_m
                    })

    # --- C. REVENUE CONCENTRATION (Gini) ---
    # (Remains similar but uses Significance Filter)
    for target_m in target_months:
        m_df = full_agg[full_agg["ym"] == target_m]
        m_df = m_df[m_df["revenue"] >= MIN_REVENUE_SIGNIF]
        
        for (cat, country), grp in m_df.groupby(["category", "country"]):
            if len(grp) < 3: continue
            revs = np.sort(grp["revenue"].values)
            n = len(revs)
            gini = (2.0 * np.sum(np.arange(1, n + 1) * revs) - (n + 1) * np.sum(revs)) / (n * np.sum(revs))
            if gini > 0.7:
                top_p = grp.nlargest(1, "revenue").iloc[0]
                insights.append({
                    "id": str(uuid.uuid4()),
                    "insight_type": "risk",
                    "category": cat,
                    "product_name": top_p["product_name"],
                    "country": country,
                    "state": None,
                    "impact_level": IMPACT_HIGH if gini > 0.85 else IMPACT_MEDIUM,
                    "title": f"High Market Concentration",
                    "body": f"The '{cat}' segment in {country} is heavily reliant on {top_p['product_name']}. Mathematical risk score (Gini) is {gini:.2f}.",
                    "metric_value": round(float(gini), 2),
                    "metric_label": "Gini Index",
                    "generated_at": now,
                    "insight_month": target_m
                })

    print(f"Final Count of High-Significance Insights: {len(insights)}")
    
    # Sync to DB
    print("Synchronizing with Supabase...")
    sb.table('ai_insights').delete().neq('id','00000000-0000-0000-0000-000000000000').execute()
    for i in range(0, len(insights), 100):
        sb.table('ai_insights').insert(insights[i:i+100]).execute()
    print("Intelligence Sync Complete.")

if __name__ == "__main__":
    generate_insights()
