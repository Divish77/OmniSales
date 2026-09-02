"""
OmniSales Customer Behavior Engine (Python ML)
================================================
Analyzes customer behavioral patterns from harmonized_sales:
  - Channel Preference     : Online vs Store split by region/category
  - Product Affinity       : Co-purchase frequency patterns
  - Basket Analysis        : Avg basket size, value segments
  - Seasonal Peaks         : Z-score peak month detection
  - Churn Signals          : Rolling window repeat-purchase decline
  - Loyalty Products       : Reorder rate leaders
  - Price Sensitivity      : Price elasticity by category
  - Channel Shift          : Trend of online/store ratio over time

Models: pandas, numpy, scikit-learn (LinearRegression), scipy (zscore)
Output: Writes rows to `customer_behavior` Supabase table

Usage:
  pip install supabase pandas numpy scikit-learn scipy
  python customer_behavior_engine.py
"""

import uuid, json
from datetime import datetime, timezone
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.linear_model import LinearRegression
from supabase import create_client, Client

# ── Config ─────────────────────────────────────────────────────────────────────
SUPABASE_URL = "https://bnmfhmsidqfqhkvcaqpp.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWZobXNpZHFmcWhrdmNhcXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzQyMzMsImV4cCI6MjA4ODQ1MDIzM30.S9y-jDPaW0QNneKpCxNh3ce4terJQ54njvGms7i52LY"

sb: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


# ── Data Fetch ─────────────────────────────────────────────────────────────────
def fetch_sales() -> pd.DataFrame:
    print("Fetching harmonized_sales data...")
    rows = []
    page, page_size = 0, 1000
    while True:
        res = (
            sb.table("harmonized_sales")
            .select("sale_date,category,channel,country,region,quantity,price,normalized_product,product_name")
            .range(page * page_size, (page + 1) * page_size - 1)
            .execute()
        )
        batch = res.data
        if not batch:
            break
        rows.extend(batch)
        if len(batch) < page_size:
            break
        page += 1

    df = pd.DataFrame(rows)
    df["sale_date"] = pd.to_datetime(df["sale_date"])
    df["revenue"] = df["quantity"].astype(float) * df["price"].astype(float)
    df["month"] = df["sale_date"].dt.to_period("M").astype(str)
    df["month_num"] = df["sale_date"].dt.to_period("M").apply(lambda p: p.ordinal)
    print(f"  Loaded {len(df):,} rows across {df['month'].nunique()} months.")
    return df


# ── Model 1: Channel Preference by Region ──────────────────────────────────────
def analyze_channel_preference(df: pd.DataFrame) -> list[dict]:
    """Calculate online vs store revenue share per region."""
    print("  [1/8] Analyzing channel preference by region...")
    rows = []
    grp = df.groupby(["region", "channel"])["revenue"].sum().reset_index()
    total_by_region = grp.groupby("region")["revenue"].sum()

    for region, sub in grp.groupby("region"):
        total = total_by_region[region]
        for _, row in sub.iterrows():
            pct = round(row["revenue"] / total * 100, 1) if total > 0 else 0
            rows.append({
                "id": str(uuid.uuid4()),
                "insight_type": "channel_preference",
                "channel": row["channel"],
                "region": region,
                "category": None,
                "product_name": None,
                "value": pct,
                "label": f"{row['channel'].title()} = {pct}% of {region} revenue",
                "run_at": datetime.now(timezone.utc).isoformat()
            })
    return rows


# ── Model 2: Basket Analysis (Avg Qty & Value per Order by Category) ──────────
def analyze_basket_size(df: pd.DataFrame) -> list[dict]:
    """Calculate average basket size and value per category and channel."""
    print("  [2/8] Analyzing basket size by category & channel...")
    rows = []

    # Order-level: treat each row as a transaction unit
    by_cat_channel = df.groupby(["category", "channel"]).agg(
        avg_qty=("quantity", "mean"),
        avg_value=("revenue", "mean"),
        total_orders=("quantity", "count")
    ).reset_index()

    for _, row in by_cat_channel.iterrows():
        rows.append({
            "id": str(uuid.uuid4()),
            "insight_type": "basket_analysis",
            "channel": row["channel"],
            "region": None,
            "category": row["category"],
            "product_name": None,
            "value": round(float(row["avg_value"]), 2),
            "label": f"Avg basket ${row['avg_value']:.0f} | {row['avg_qty']:.1f} units | {row['total_orders']} orders",
            "run_at": datetime.now(timezone.utc).isoformat()
        })
    return rows


# ── Model 3: Loyalty Products (Reorder Rate by Product) ───────────────────────
def analyze_loyalty_products(df: pd.DataFrame) -> list[dict]:
    """Find products with the highest purchase velocity (reorder signals)."""
    print("  [3/8] Computing loyalty product reorder rates...")
    rows = []

    product_stats = df.groupby(["normalized_product", "category"]).agg(
        total_units=("quantity", "sum"),
        total_orders=("quantity", "count"),
        avg_qty_per_order=("quantity", "mean"),
        months_active=("month", "nunique")
    ).reset_index()

    # Reorder rate = orders / months_active (velocity)
    product_stats["reorder_rate"] = (
        product_stats["total_orders"] / product_stats["months_active"].clip(lower=1)
    ).round(2)

    top = product_stats.nlargest(20, "reorder_rate")

    for _, row in top.iterrows():
        rows.append({
            "id": str(uuid.uuid4()),
            "insight_type": "loyalty_product",
            "channel": None,
            "region": None,
            "category": row["category"],
            "product_name": row["normalized_product"],
            "value": float(row["reorder_rate"]),
            "label": f"{row['reorder_rate']:.1f} orders/month | {int(row['total_units'])} total units",
            "run_at": datetime.now(timezone.utc).isoformat()
        })
    return rows


# ── Model 4: Seasonal Peaks (Z-score) ─────────────────────────────────────────
def analyze_seasonal_peaks(df: pd.DataFrame) -> list[dict]:
    """Detect peak and trough months per category using z-score anomaly detection."""
    print("  [4/8] Detecting seasonal purchase peaks...")
    rows = []

    monthly = df.groupby(["region", "category", "month"])["revenue"].sum().reset_index()

    for (region, cat), grp in monthly.groupby(["region", "category"]):
        if len(grp) < 4:
            continue
        values = grp["revenue"].values
        z_scores = stats.zscore(values)

        for i, z in enumerate(z_scores):
            if abs(z) > 1.5:
                mth = grp.iloc[i]["month"]
                is_peak = z > 0
                rows.append({
                    "id": str(uuid.uuid4()),
                    "insight_type": "seasonal_peak",
                    "channel": None,
                    "region": region,
                    "category": cat,
                    "product_name": None,
                    "value": round(float(z), 3),
                    "label": f"{'Peak' if is_peak else 'Dip'} in {mth} — z={z:.2f}",
                    "run_at": datetime.now(timezone.utc).isoformat()
                })
    return rows


# ── Model 5: Channel Shift Trend (Linear Regression on Online%) ───────────────
def analyze_channel_shift(df: pd.DataFrame) -> list[dict]:
    """Detect if a region is shifting toward online or store over time."""
    print("  [5/8] Modeling channel shift trends...")
    rows = []

    monthly_channel = df.groupby(["region", "month", "channel"])["revenue"].sum().reset_index()
    total_monthly = monthly_channel.groupby(["region", "month"])["revenue"].sum().reset_index(name="total")
    merged = monthly_channel.merge(total_monthly, on=["region", "month"])
    merged["share"] = merged["revenue"] / merged["total"].clip(lower=1)
    online = merged[merged["channel"] == "online"].copy()

    months_list = sorted(df["month"].unique())
    month_idx_map = {m: i for i, m in enumerate(months_list)}

    for region, grp in online.groupby("region"):
        if len(grp) < 3:
            continue
        grp = grp.sort_values("month")
        X = np.array([month_idx_map.get(m, 0) for m in grp["month"]]).reshape(-1, 1)
        y = grp["share"].values
        model = LinearRegression().fit(X, y)
        slope = float(model.coef_[0])
        current_share = round(float(grp["share"].iloc[-1]) * 100, 1)

        direction = "online" if slope > 0 else "store"
        rows.append({
            "id": str(uuid.uuid4()),
            "insight_type": "channel_shift",
            "channel": "online",
            "region": region,
            "category": None,
            "product_name": None,
            "value": round(slope * 100, 4),  # slope as % change per month
            "label": f"Shifting toward {direction} (+{abs(slope*100):.2f}%/mo)  |  Current online share: {current_share}%",
            "run_at": datetime.now(timezone.utc).isoformat()
        })
    return rows


# ── Model 6: Price Sensitivity (Price vs Qty Correlation per Category) ─────────
def analyze_price_sensitivity(df: pd.DataFrame) -> list[dict]:
    """Estimate price elasticity by correlating price levels with quantity sold."""
    print("  [6/8] Estimating price sensitivity by category...")
    rows = []

    for (region, cat), grp in df.groupby(["region", "category"]):
        if len(grp) < 10:
            continue
        # Bin prices into deciles, compute avg qty per bin
        grp = grp.copy()
        try:
            grp["price_bin"] = pd.qcut(grp["price"], q=5, duplicates="drop")
        except Exception:
            continue
        sensitivity = grp.groupby("price_bin", observed=True)["quantity"].mean()
        if len(sensitivity) < 3:
            continue

        # Compute correlation between price rank (bin midpoint) and qty
        bin_mids = [float(b.mid) for b in sensitivity.index]
        qtys = sensitivity.values
        if np.std(bin_mids) == 0 or np.std(qtys) == 0:
            continue
        corr = float(np.corrcoef(bin_mids, qtys)[0, 1])
        sensitivity_label = "high" if abs(corr) > 0.6 else ("medium" if abs(corr) > 0.3 else "low")
        direction = "price-elastic" if corr < -0.3 else ("price-inelastic" if corr > 0.3 else "neutral")

        rows.append({
            "id": str(uuid.uuid4()),
            "insight_type": "price_sensitivity",
            "channel": None,
            "region": region,
            "category": cat,
            "product_name": None,
            "value": round(corr, 4),
            "label": f"{direction} | correlation={corr:.2f} | sensitivity={sensitivity_label}",
            "run_at": datetime.now(timezone.utc).isoformat()
        })
    return rows


# ── Model 7: Churn Signals (Declining Repeat Purchase Rate) ────────────────────
def analyze_churn_signals(df: pd.DataFrame) -> list[dict]:
    """Detect categories with declining monthly purchase volume (churn risk)."""
    print("  [7/8] Detecting churn signals...")
    rows = []

    monthly = df.groupby(["region", "category", "month_num"])["quantity"].sum().reset_index()

    for (region, cat), grp in monthly.groupby(["region", "category"]):
        if len(grp) < 4:
            continue
        grp = grp.sort_values("month_num")
        X = grp["month_num"].values.reshape(-1, 1)
        y = grp["quantity"].values
        model = LinearRegression().fit(X, y)
        slope = float(model.coef_[0])

        if slope < -5:  # meaningful decline
            pct_decline = round(abs(slope) / (y.mean() + 1e-9) * 100, 1)
            rows.append({
                "id": str(uuid.uuid4()),
                "insight_type": "churn_signal",
                "channel": None,
                "region": region,
                "category": cat,
                "product_name": None,
                "value": round(slope, 2),
                "label": f"Declining {pct_decline:.1f}%/month | Action needed",
                "run_at": datetime.now(timezone.utc).isoformat()
            })
    return rows


# ── Model 8: Top Product Affinity (Co-Category Purchase by Channel) ────────────
def analyze_product_affinity(df: pd.DataFrame) -> list[dict]:
    """Find which categories are frequently purchased together on the same channel."""
    print("  [8/8] Mining product category affinity...")
    rows = []

    # Proxy: group by (month, region, channel) as a "basket", count category pairs
    basket_group = df.groupby(["month", "region", "channel"])["category"].apply(
        lambda cats: sorted(set(cats))
    ).reset_index()

    pair_counts: dict = {}
    for _, row in basket_group.iterrows():
        cats = row["category"]
        ch = row["channel"]
        region = row["region"]
        for i in range(len(cats)):
            for j in range(i + 1, len(cats)):
                key = (region, ch, cats[i], cats[j])
                pair_counts[key] = pair_counts.get(key, 0) + 1

    # Top pairs globally (but segmented by region/channel)
    top_pairs = sorted(pair_counts.items(), key=lambda x: x[1], reverse=True)[:50]
    for (region, channel, cat_a, cat_b), count in top_pairs:
        rows.append({
            "id": str(uuid.uuid4()),
            "insight_type": "product_affinity",
            "channel": channel,
            "region": region,
            "category": cat_a,
            "product_name": cat_b,  # second category stored here
            "value": float(count),
            "label": f"{cat_a} + {cat_b} co-purchased {count}x on {channel}",
            "run_at": datetime.now(timezone.utc).isoformat()
        })
    return rows


# ── Push to Supabase ───────────────────────────────────────────────────────────
def push_customer_behavior(rows: list[dict]):
    if not rows:
        print("  No rows to push.")
        return
    print(f"  Clearing old customer_behavior data...")
    sb.table("customer_behavior").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

    # Insert in batches of 500
    batch_size = 500
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        sb.table("customer_behavior").insert(batch).execute()
    print(f"  OK Pushed {len(rows)} customer behavior insights to Supabase.")


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  OmniSales Customer Behavior Engine — Python ML")
    print("=" * 60)

    df = fetch_sales()
    if df.empty:
        print("No data found. Exiting.")
        return

    all_rows = []

    all_rows += analyze_channel_preference(df)
    all_rows += analyze_basket_size(df)
    all_rows += analyze_loyalty_products(df)
    all_rows += analyze_seasonal_peaks(df)
    all_rows += analyze_channel_shift(df)
    all_rows += analyze_price_sensitivity(df)
    all_rows += analyze_churn_signals(df)
    all_rows += analyze_product_affinity(df)

    push_customer_behavior(all_rows)

    # Summary
    by_type = {}
    for r in all_rows:
        t = r["insight_type"]
        by_type[t] = by_type.get(t, 0) + 1

    print("\n── Results ─────────────────────────────────────────────")
    for t, count in by_type.items():
        print(f"  {t:<25} {count:>4} records")
    print(f"  {'TOTAL':<25} {len(all_rows):>4} records")
    print("\nDone! Refresh the Customer Behavior page to see results.")


if __name__ == "__main__":
    main()
