"""
OmniSales AI Insights Engine — Fully Self-Contained ML
=======================================================
100% local ML — zero external API credits required.

Models trained on your actual sales data:
  1. IsolationForest    → Anomaly/Spike Detection
  2. GradientBoosting   → Trend Classification (accelerating/stable/cooling)
  3. StandardScaler     → Feature normalization for all models
  4. Statistical Layer  → Seasonality, risk concentration, velocity scoring

Run:  python ai_insights_engine.py
Output: Upserts rows to the `ai_insights` Supabase table.
"""

import os
import uuid
import warnings
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from sklearn.ensemble import IsolationForest, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from supabase import create_client, Client

warnings.filterwarnings("ignore")

# ── Config ─────────────────────────────────────────────────────────────────────
SUPABASE_URL = "https://bnmfhmsidqfqhkvcaqpp.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWZobXNpZHFmcWhrdmNhcXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzQyMzMsImV4cCI6MjA4ODQ1MDIzM30.S9y-jDPaW0QNneKpCxNh3ce4terJQ54njvGms7i52LY"

sb: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

IMPACT_HIGH   = "high"
IMPACT_MEDIUM = "medium"
IMPACT_LOW    = "low"


# ══════════════════════════════════════════════════════════════════════════════
# 1. DATA FETCHING
# ══════════════════════════════════════════════════════════════════════════════
def fetch_sales() -> pd.DataFrame:
    print("📡 Fetching sales data from Supabase...")
    rows, page, page_size = [], 0, 1000
    while True:
        res = sb.table("harmonized_sales").select("*").range(
            page * page_size, (page + 1) * page_size - 1
        ).execute()
        batch = res.data
        if not batch:
            break
        rows.extend(batch)
        if len(batch) < page_size:
            break
        page += 1

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df["sale_date"] = pd.to_datetime(df["sale_date"])
    df["revenue"]   = df["quantity"].astype(float) * df["price"].astype(float)
    df["year"]      = df["sale_date"].dt.year
    df["month"]     = df["sale_date"].dt.month
    df["ym"]        = df["sale_date"].dt.to_period("M")
    df["country"]   = df.get("country", pd.Series("Unknown", index=df.index)).fillna("Unknown")
    df["state"]     = df.get("state",   pd.Series("Unknown", index=df.index)).fillna("Unknown")
    df["region"]    = df.get("region",  pd.Series("Unknown", index=df.index)).fillna("Unknown")
    print(f"   ✅ Loaded {len(df):,} sales records.")
    return df


# ══════════════════════════════════════════════════════════════════════════════
# 2. FEATURE ENGINEERING — creates the features every model trains on
# ══════════════════════════════════════════════════════════════════════════════
def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate to monthly level and build ML-ready features."""
    monthly = (
        df.groupby(["ym", "category", "country", "state", "region"])
        .agg(revenue=("revenue", "sum"), quantity=("quantity", "sum"))
        .reset_index()
        .sort_values("ym")
    )

    grp = monthly.groupby(["category", "country", "state", "region"])

    # Lag features
    monthly["lag_1"]     = grp["revenue"].shift(1)
    monthly["lag_2"]     = grp["revenue"].shift(2)
    monthly["lag_3"]     = grp["revenue"].shift(3)

    # Rolling stats
    monthly["roll_mean_3"] = grp["revenue"].transform(lambda x: x.rolling(3).mean())
    monthly["roll_std_3"]  = grp["revenue"].transform(lambda x: x.rolling(3).std().fillna(0))

    # Velocity: month-over-month percentage change
    monthly["velocity"]  = grp["revenue"].pct_change().fillna(0) * 100

    # Acceleration: change of change
    monthly["accel"]     = grp["velocity"].diff().fillna(0)

    # Z-score per group (for anomaly detection benchmark)
    monthly["z_score"]   = grp["revenue"].transform(
        lambda x: (x - x.mean()) / (x.std() + 1e-9)
    )

    # Month number for seasonality
    monthly["month_num"] = monthly["ym"].apply(lambda x: x.month)

    monthly = monthly.fillna(0)
    return monthly


# ══════════════════════════════════════════════════════════════════════════════
# 3. ML MODEL 1 — ISOLATION FOREST (Anomaly / Spike Detection)
# ══════════════════════════════════════════════════════════════════════════════
def train_anomaly_detector(monthly: pd.DataFrame):
    """
    Trains an IsolationForest to find genuinely unusual revenue events.
    Returns the trained model and scaler.
    """
    print("\n🤖 Training Model 1: IsolationForest Anomaly Detector...")
    features = ["revenue", "velocity", "z_score", "roll_std_3", "month_num"]
    X = monthly[features].copy()

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        n_estimators=200,
        contamination=0.08,   # expect ~8% of data points to be anomalies
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_scaled)

    # -1 = anomaly, 1 = normal
    monthly["anomaly_flag"] = model.predict(X_scaled)
    monthly["anomaly_score"] = model.score_samples(X_scaled)  # lower = more anomalous

    anomaly_count = (monthly["anomaly_flag"] == -1).sum()
    print(f"   ✅ Model trained. Detected {anomaly_count} anomalous revenue events.")
    return model, scaler, monthly


# ══════════════════════════════════════════════════════════════════════════════
# 4. ML MODEL 2 — GRADIENT BOOSTING CLASSIFIER (Trend Classification)
# ══════════════════════════════════════════════════════════════════════════════
def train_trend_classifier(monthly: pd.DataFrame):
    """
    Trains a GradientBoostingClassifier to label each group's trend:
      0 = Cooling  |  1 = Stable  |  2 = Accelerating
    Uses programmatic labeling based on velocity thresholds as training signal.
    """
    print("\n🤖 Training Model 2: GradientBoosting Trend Classifier...")

    # Programmatic labels (threshold-based ground truth)
    def label_trend(v):
        if v > 12:     return 2  # Accelerating
        elif v < -10:  return 0  # Cooling
        else:          return 1  # Stable

    monthly["trend_label"] = monthly["velocity"].apply(label_trend)

    features = ["lag_1", "lag_2", "lag_3", "velocity", "accel", "roll_mean_3", "roll_std_3", "month_num"]
    X = monthly[features].copy()
    y = monthly["trend_label"]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Only train if we have all 3 classes present
    if y.nunique() < 2:
        print("   ⚠️  Not enough class variety to train classifier. Using rule-based fallback.")
        monthly["trend_pred"] = y
        return None, None, monthly

    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42, stratify=y if y.nunique() >= 2 else None)

    model = GradientBoostingClassifier(
        n_estimators=150,
        learning_rate=0.1,
        max_depth=4,
        random_state=42
    )
    model.fit(X_train, y_train)

    acc = model.score(X_test, y_test)
    print(f"   ✅ Model trained. Test accuracy: {acc:.1%}")

    monthly["trend_pred"] = model.predict(X_scaled)
    return model, scaler, monthly


# ══════════════════════════════════════════════════════════════════════════════
# 5. STATISTICAL LAYER — Seasonality, Risk, Velocity Scoring
# ══════════════════════════════════════════════════════════════════════════════
def compute_seasonality_index(df: pd.DataFrame) -> pd.DataFrame:
    """Identifies which month is historically the peak for each category/country."""
    monthly_agg = (
        df.groupby(["category", "country", "month"])["revenue"]
        .mean()
        .reset_index()
        .rename(columns={"revenue": "avg_monthly_rev"})
    )

    peak_months = (
        monthly_agg.loc[monthly_agg.groupby(["category", "country"])["avg_monthly_rev"].idxmax()]
        [["category", "country", "month", "avg_monthly_rev"]]
        .rename(columns={"month": "peak_month", "avg_monthly_rev": "peak_rev"})
    )
    return peak_months


def compute_revenue_concentration(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes a risk score per category based on revenue concentration (simplified Gini).
    High concentration = over-reliance on one product = risk.
    """
    prod_rev = df.groupby(["category", "country", "product_name"])["revenue"].sum().reset_index()

    risks = []
    for (cat, country), grp in prod_rev.groupby(["category", "country"]):
        revs = grp["revenue"].values
        total = revs.sum()
        if total == 0 or len(revs) < 2:
            continue
        shares = np.sort(revs / total)
        n = len(shares)
        gini = (2.0 * np.sum(np.arange(1, n + 1) * shares) - (n + 1)) / n
        top_product = grp.nlargest(1, "revenue")["product_name"].values[0]
        top_share   = grp.nlargest(1, "revenue")["revenue"].values[0] / total * 100
        risks.append({
            "category": cat, "country": country,
            "gini_score": round(gini, 3),
            "top_product": top_product,
            "top_share_pct": round(top_share, 1),
            "total_revenue": round(total, 2)
        })

    return pd.DataFrame(risks)


# ══════════════════════════════════════════════════════════════════════════════
# 6. INSIGHT GENERATION — Convert ML outputs → structured insight cards
# ══════════════════════════════════════════════════════════════════════════════
TREND_LABELS = {2: "Accelerating", 1: "Stable", 0: "Cooling"}
TREND_EMOJI  = {2: "🚀", 1: "⚖️", 0: "📉"}
MONTH_NAMES  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]


def generate_insights(df: pd.DataFrame, monthly: pd.DataFrame,
                       peak_df: pd.DataFrame, risk_df: pd.DataFrame) -> list[dict]:
    insights = []
    now = datetime.now(timezone.utc).isoformat()

    # ── Latest month snapshot ────────────────────────────────────────────────
    latest_ym = monthly["ym"].max()
    latest    = monthly[monthly["ym"] == latest_ym].copy()

    # ── INSIGHT TYPE 1: Anomaly Spikes ───────────────────────────────────────
    spikes = latest[latest["anomaly_flag"] == -1].copy()
    spikes = spikes.sort_values("anomaly_score")  # most anomalous first

    for _, row in spikes.iterrows():
        direction = "surged" if row["velocity"] > 0 else "collapsed"
        impact    = IMPACT_HIGH if abs(row["z_score"]) > 2 else IMPACT_MEDIUM
        insights.append({
            "id": str(uuid.uuid4()),
            "insight_type": "anomaly",
            "category": row["category"],
            "product_name": None,
            "country": row["country"],
            "state": row["state"],
            "impact_level": impact,
            "title": f"Revenue {direction.title()} Detected — {row['category']}",
            "body": (
                f"The IsolationForest model flagged a statistically unusual revenue event in "
                f"{row['category']} ({row['country']}) this month. Revenue {direction} by "
                f"{abs(row['velocity']):.1f}% vs prior period (Z-score: {row['z_score']:.2f}). "
                f"Review inventory and pricing for this segment immediately."
            ),
            "metric_value": round(float(row["velocity"]), 1),
            "metric_label": "% Change",
            "generated_at": now,
        })

    # ── INSIGHT TYPE 2: Trend Cards (Accelerating) ───────────────────────────
    accelerating = latest[latest.get("trend_pred", latest["trend_label"]) == 2].nlargest(5, "velocity")
    for _, row in accelerating.iterrows():
        insights.append({
            "id": str(uuid.uuid4()),
            "insight_type": "trend_acceleration",
            "category": row["category"],
            "product_name": None,
            "country": row["country"],
            "state": row["state"],
            "impact_level": IMPACT_HIGH,
            "title": f"🚀 Accelerating Momentum — {row['category']}",
            "body": (
                f"The Gradient Boosting model classified {row['category']} in "
                f"{row['country']} as Accelerating this month. "
                f"Revenue velocity is +{row['velocity']:.1f}% with sustained positive acceleration "
                f"({row['accel']:.1f}% change-of-change). "
                f"Consider increasing stock levels and launching a targeted campaign."
            ),
            "metric_value": round(float(row["velocity"]), 1),
            "metric_label": "% Velocity",
            "generated_at": now,
        })

    # ── INSIGHT TYPE 3: Trend Cards (Cooling) ────────────────────────────────
    cooling = latest[latest.get("trend_pred", latest["trend_label"]) == 0].nsmallest(5, "velocity")
    for _, row in cooling.iterrows():
        insights.append({
            "id": str(uuid.uuid4()),
            "insight_type": "trend_cooling",
            "category": row["category"],
            "product_name": None,
            "country": row["country"],
            "state": row["state"],
            "impact_level": IMPACT_MEDIUM,
            "title": f"📉 Demand Cooling — {row['category']}",
            "body": (
                f"The model detected deceleration in {row['category']} ({row['country']}). "
                f"Revenue velocity is {row['velocity']:.1f}% this month. "
                f"Monitor closely for 2 consecutive cooling months before triggering markdown strategy. "
                f"Rolling 3-month average: ${row['roll_mean_3']:,.0f}."
            ),
            "metric_value": round(float(row["velocity"]), 1),
            "metric_label": "% Velocity",
            "generated_at": now,
        })

    # ── INSIGHT TYPE 4: Seasonality Peak Alerts ──────────────────────────────
    current_month = datetime.now().month
    upcoming_peaks = peak_df[
        (peak_df["peak_month"] == current_month) |
        (peak_df["peak_month"] == (current_month % 12) + 1)
    ]
    for _, row in upcoming_peaks.iterrows():
        month_name = MONTH_NAMES[int(row["peak_month"]) - 1]
        is_now = int(row["peak_month"]) == current_month
        timing = "is NOW" if is_now else f"is NEXT MONTH ({month_name})"
        insights.append({
            "id": str(uuid.uuid4()),
            "insight_type": "seasonality",
            "category": row["category"],
            "product_name": None,
            "country": row["country"],
            "state": None,
            "impact_level": IMPACT_HIGH if is_now else IMPACT_MEDIUM,
            "title": f"📅 Seasonal Peak Window — {row['category']}",
            "body": (
                f"Historical analysis shows {row['category']} in {row['country']} "
                f"consistently peaks in {month_name}. Peak window {timing}. "
                f"Avg peak revenue: ${row['peak_rev']:,.0f}. "
                f"Optimize ad spend and ensure adequate inventory at least 2 weeks before peak."
            ),
            "metric_value": round(float(row["peak_rev"]), 2),
            "metric_label": "Avg Peak Rev",
            "generated_at": now,
        })

    # ── INSIGHT TYPE 5: Revenue Concentration Risk ───────────────────────────
    high_risk = risk_df[risk_df["gini_score"] > 0.55].nlargest(6, "gini_score")
    for _, row in high_risk.iterrows():
        insights.append({
            "id": str(uuid.uuid4()),
            "insight_type": "risk",
            "category": row["category"],
            "product_name": row["top_product"],
            "country": row["country"],
            "state": None,
            "impact_level": IMPACT_HIGH if row["gini_score"] > 0.7 else IMPACT_MEDIUM,
            "title": f"⚠️ Revenue Concentration Risk — {row['category']}",
            "body": (
                f"{row['category']} in {row['country']} has a high Gini concentration score "
                f"of {row['gini_score']:.2f} (1.0 = maximum dependence). "
                f"'{row['top_product']}' alone accounts for {row['top_share_pct']}% of segment revenue. "
                f"Diversify the product mix to reduce single-product dependency risk."
            ),
            "metric_value": round(float(row["gini_score"]), 3),
            "metric_label": "Gini Score",
            "generated_at": now,
        })

    # ── INSIGHT TYPE 6: Country Performance Delta ────────────────────────────
    country_perf = (
        df.groupby(["country", "category"])["revenue"].sum()
        .reset_index()
        .sort_values("revenue", ascending=False)
    )
    top_countries = country_perf.groupby("category").head(1).copy()
    btm_countries = country_perf.groupby("category").tail(1).copy()

    # Merge to find gaps
    merged = top_countries.merge(
        btm_countries, on="category", suffixes=("_top", "_btm")
    )
    merged["gap"] = merged["revenue_top"] - merged["revenue_btm"]
    merged = merged[merged["country_top"] != merged["country_btm"]].nlargest(5, "gap")

    for _, row in merged.iterrows():
        insights.append({
            "id": str(uuid.uuid4()),
            "insight_type": "regional_delta",
            "category": row["category"],
            "product_name": None,
            "country": row["country_top"],
            "state": None,
            "impact_level": IMPACT_MEDIUM,
            "title": f"🌍 Market Gap Opportunity — {row['category']}",
            "body": (
                f"{row['country_top']} leads {row['category']} with "
                f"${row['revenue_top']:,.0f} in total revenue while "
                f"{row['country_btm']} trails significantly at ${row['revenue_btm']:,.0f}. "
                f"A ${row['gap']:,.0f} gap exists. "
                f"Consider localizing campaigns or adjusting pricing in {row['country_btm']} to unlock this market."
            ),
            "metric_value": round(float(row["gap"]), 2),
            "metric_label": "Revenue Gap ($)",
            "generated_at": now,
        })

    print(f"\n   ✅ Generated {len(insights)} ML-powered insights.")
    return insights


# ══════════════════════════════════════════════════════════════════════════════
# 7. UPSERT TO SUPABASE
# ══════════════════════════════════════════════════════════════════════════════
def upsert_insights(insights: list[dict]):
    print(f"\n📤 Pushing {len(insights)} insights to Supabase...")
    # Clear old
    sb.table("ai_insights").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    # Insert new in batches
    batch_size = 100
    for i in range(0, len(insights), batch_size):
        sb.table("ai_insights").insert(insights[i:i + batch_size]).execute()
    print("   ✅ Upsert complete.")


# ══════════════════════════════════════════════════════════════════════════════
# 8. MAIN PIPELINE
# ══════════════════════════════════════════════════════════════════════════════
def main():
    print("=" * 60)
    print("  OmniSales AI Insights Engine — Self-Trained ML")
    print("=" * 60)

    df = fetch_sales()
    if df.empty:
        print("❌ No sales data found. Run the seeding script first.")
        return

    # Feature engineering
    print("\n⚙️  Engineering features...")
    monthly = engineer_features(df)
    print(f"   ✅ Built {len(monthly):,} monthly feature rows.")

    # Train models
    _, _, monthly = train_anomaly_detector(monthly)
    _, _, monthly = train_trend_classifier(monthly)

    # Statistical layers
    print("\n📊 Computing statistical layers...")
    peak_df = compute_seasonality_index(df)
    risk_df = compute_revenue_concentration(df)
    print(f"   ✅ Seasonality: {len(peak_df)} category/country peaks detected.")
    print(f"   ✅ Risk: {len(risk_df)} concentration scores computed.")

    # Generate insight cards
    print("\n💡 Generating insight cards...")
    insights = generate_insights(df, monthly, peak_df, risk_df)

    # Push to Supabase
    upsert_insights(insights)

    print("\n" + "=" * 60)
    print(f"  ✅ Done! {len(insights)} ML insights are now live in the UI.")
    print("=" * 60)


if __name__ == "__main__":
    main()
