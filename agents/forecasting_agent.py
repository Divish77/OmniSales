#!/usr/bin/env python3
"""
OmniSales — Agent 4: ML Forecasting Agent
Reads harmonized_sales from Supabase, trains a Linear Regression model,
and writes 3-month demand forecasts back to the forecasts table.

Requirements:
  pip install supabase scikit-learn pandas numpy
"""

import os
import sys
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

# Fix Windows terminal encoding for emoji output
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

try:
    import pandas as pd
    import numpy as np
    from sklearn.linear_model import LinearRegression
    from supabase import create_client, Client
except ImportError:
    print("❌ Missing dependencies. Run:")
    print("   pip install supabase scikit-learn pandas numpy python-dateutil")
    sys.exit(1)

# ── Supabase config ──────────────────────────────────────────────────────────
SUPABASE_URL = "https://bnmfhmsidqfqhkvcaqpp.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWZobXNpZHFmcWhrdmNhcXBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg3NDIzMywiZXhwIjoyMDg4NDUwMjMzfQ.VFU0YPc2tLYbGe9_5mDVr9axJHOywm8SRSrQC6-acrw"

print("🤖 OmniSales Forecasting Agent starting…")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Load harmonized sales data ────────────────────────────────────────────────
print("📥 Loading harmonized_sales from Supabase…")
response = supabase.table("harmonized_sales").select("date,category,quantity,price,revenue").execute()

if not response.data:
    print("⚠️  No data in harmonized_sales. Run run_harmonization() first.")
    sys.exit(0)

df = pd.DataFrame(response.data)
df["date"] = pd.to_datetime(df["date"])
df["revenue"] = df["quantity"] * df["price"]
df["month"] = df["date"].dt.to_period("M")
df["month_num"] = (df["month"] - df["month"].min()).apply(lambda x: x.n)

print(f"✅ Loaded {len(df)} records spanning {df['month'].nunique()} months")

# ── Train per-category Linear Regression ─────────────────────────────────────
forecasts = []
categories = df["category"].unique()
today = datetime.today()

for cat in categories:
    cat_df = df[df["category"] == cat].groupby("month_num").agg(
        revenue=("revenue", "sum"),
        quantity=("quantity", "sum")
    ).reset_index()

    if len(cat_df) < 2:
        print(f"  ⏭  Skipping {cat} (not enough data points)")
        continue

    X = cat_df[["month_num"]].values
    y_rev = cat_df["revenue"].values
    y_qty = cat_df["quantity"].values

    # Fit revenue model
    model_rev = LinearRegression()
    model_rev.fit(X, y_rev)

    # Fit quantity model  
    model_qty = LinearRegression()
    model_qty.fit(X, y_qty)

    # R² score as confidence proxy (clamped 0-1)
    from sklearn.metrics import r2_score
    r2 = max(0.0, min(1.0, float(r2_score(y_rev, model_rev.predict(X)))))

    max_month_num = int(cat_df["month_num"].max())

    # Predict next 3 months
    for i in range(1, 4):
        future_month_num = max_month_num + i
        pred_rev = float(model_rev.predict([[future_month_num]])[0])
        pred_qty = int(max(0, model_qty.predict([[future_month_num]])[0]))

        # Compute the actual calendar month
        months_ahead = i + (today.month - df["date"].dt.month.max())
        forecast_date = (today + relativedelta(months=i)).replace(day=1)

        forecasts.append({
            "forecast_month": forecast_date.strftime("%Y-%m-%d"),
            "category": cat,
            "predicted_revenue": round(max(0, pred_rev), 2),
            "predicted_quantity": pred_qty,
            "model_name": "LinearRegression",
            "confidence": round(r2 * 100, 1),
        })

    print(f"  ✅ {cat}: R²={r2:.2f}, predicting {len([f for f in forecasts if f['category']==cat])} months")

# ── Write forecasts to Supabase ───────────────────────────────────────────────
if not forecasts:
    print("⚠️  No forecasts generated.")
    sys.exit(0)

print(f"\n💾 Writing {len(forecasts)} forecasts to Supabase…")
# Clear old forecasts
supabase.table("forecasts").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

# Insert in batches
batch_size = 20
for i in range(0, len(forecasts), batch_size):
    batch = forecasts[i:i+batch_size]
    supabase.table("forecasts").insert(batch).execute()

print("✅ Forecasting complete!")
print(f"   Categories modelled: {', '.join(categories)}")
print(f"   Total forecasts stored: {len(forecasts)}")
print("\n🎯 Run this agent monthly or on a schedule to keep forecasts fresh.")
