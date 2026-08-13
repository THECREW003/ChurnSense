import os
import random
import pandas as pd
import numpy as np

def generate_customer_features(
    input_path="data/activity_logs.csv",
    output_path="data/customer_features.csv",
    observation_days=90,
    seed=42
):
    """
    Transforms raw activity logs into user-level features, a realistic,
    multi-factor probabilistic churn label with feature overlap, and
    synthetic monthly subscription values for Revenue at Risk analysis.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    print(f"Loading activity logs from {input_path}...")
    df = pd.read_csv(input_path, engine="python")

    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["date"] = df["timestamp"].dt.date
    dataset_max_date = df["timestamp"].max()

    user_groups = df.groupby("user_id")

    # Aggregate counts of event types
    event_counts = df.pivot_table(
        index="user_id",
        columns="event",
        aggfunc="size",
        fill_value=0
    )

    for evt in ["login", "session", "page_view", "purchase"]:
        if evt not in event_counts.columns:
            event_counts[evt] = 0

    features = pd.DataFrame(index=user_groups.groups.keys())

    features["total_logins"] = event_counts["login"]
    features["total_sessions"] = event_counts["session"]
    features["total_page_views"] = event_counts["page_view"]
    features["total_purchases"] = event_counts["purchase"]
    features["total_events"] = user_groups.size()

    # Active & Inactive days
    features["active_days"] = user_groups["date"].nunique()
    features["inactive_days"] = observation_days - features["active_days"]

    # Average events per active day
    features["average_events_per_active_day"] = (
        features["total_events"] / features["active_days"]
    ).round(2)

    # Days since last activity
    last_activity = user_groups["timestamp"].max()
    features["days_since_last_activity"] = (
        (dataset_max_date - last_activity).dt.total_seconds() / 86400.0
    ).round(2)

    # Activity in the last 30 days for engagement trend calculation
    last_30_cutoff = dataset_max_date - pd.Timedelta(days=30)
    recent_df = df[df["timestamp"] >= last_30_cutoff]
    recent_counts = recent_df.groupby("user_id").size().reindex(features.index, fill_value=0)

    # Multi-factor probabilistic churn label calculation
    random.seed(seed)
    np.random.seed(seed)

    recency_norm = features["days_since_last_activity"] / 90.0
    inactivity_norm = features["inactive_days"] / 90.0
    volume_deficit = 1.0 - (features["active_days"] / 70.0).clip(upper=1.0)
    purchase_deficit = 1.0 - (features["total_purchases"] / 40.0).clip(upper=1.0)
    
    expected_recent = features["total_events"] * (30.0 / 90.0)
    recent_ratio = (recent_counts / (expected_recent + 1e-5)).clip(upper=1.5)
    trend_deficit = 1.0 - (recent_ratio / 1.5)

    # Weighted propensity score
    propensity = (
        0.30 * recency_norm +
        0.25 * inactivity_norm +
        0.20 * volume_deficit +
        0.15 * purchase_deficit +
        0.10 * trend_deficit
    )

    # Add realistic random noise (~12% standard deviation) to create realistic class overlap
    noise = np.random.normal(loc=0.0, scale=0.12, size=len(features))
    noisy_propensity = propensity + noise

    # Churn label threshold
    features["churn"] = (noisy_propensity > 0.52).astype(int)

    # Generate synthetic monthly subscription value (INR: 299, 499, 799, 999, 1499, 2499)
    price_tiers = [299, 499, 799, 999, 1499, 2499]
    price_weights = [0.15, 0.25, 0.25, 0.20, 0.10, 0.05]
    random.seed(seed + 100)
    features["monthly_value"] = [random.choices(price_tiers, weights=price_weights)[0] for _ in range(len(features))]

    # Reset index
    features = features.reset_index().rename(columns={"index": "user_id"})

    columns_order = [
        "user_id",
        "total_logins",
        "total_sessions",
        "total_page_views",
        "total_purchases",
        "total_events",
        "active_days",
        "inactive_days",
        "average_events_per_active_day",
        "days_since_last_activity",
        "monthly_value",
        "churn"
    ]
    features = features[columns_order]

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    features.to_csv(output_path, index=False)
    print(f"Engineered features saved to: {output_path}")

    num_users = len(features)
    churn_counts = features["churn"].value_counts().to_dict()
    print("=== Feature Engineering Summary ===")
    print(f"Total Users: {num_users}")
    print(f"Non-Churned (0): {churn_counts.get(0, 0)}")
    print(f"Churned (1):     {churn_counts.get(1, 0)}")

if __name__ == "__main__":
    generate_customer_features()
