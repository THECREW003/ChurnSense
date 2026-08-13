import os
import pandas as pd
import numpy as np

def generate_customer_features(
    input_path="data/activity_logs.csv",
    output_path="data/customer_features.csv",
    observation_days=90,
    inactivity_churn_threshold=30
):
    """
    Transforms raw user activity logs into a user-level feature dataset for ChurnSense.
    
    Features engineered per user:
    - total_logins: Count of login events
    - total_sessions: Count of session events
    - total_page_views: Count of page view events
    - total_purchases: Count of purchase events
    - total_events: Total activity events count
    - active_days: Number of unique days with activity
    - inactive_days: Number of days with no activity during observation window
    - average_events_per_active_day: Total events / active days
    - days_since_last_activity: Days elapsed between latest activity timestamp and dataset max date
    - churn: Target binary label (1 = churned due to inactivity > 30 days, 0 = active/retained)
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    # 1. Load activity logs
    print(f"Loading activity logs from {input_path}...")
    df = pd.read_csv(input_path)

    # Convert timestamp column to datetime
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["date"] = df["timestamp"].dt.date

    # Reference max date in dataset (cutoff observation date)
    dataset_max_date = df["timestamp"].max()

    # 2. Pivot / Aggregate by user_id
    user_groups = df.groupby("user_id")

    # Aggregate counts of specific event types
    event_counts = df.pivot_table(
        index="user_id",
        columns="event",
        aggfunc="size",
        fill_value=0
    )

    # Ensure all required event columns exist even if 0
    for evt in ["login", "session", "page_view", "purchase"]:
        if evt not in event_counts.columns:
            event_counts[evt] = 0

    features = pd.DataFrame(index=user_groups.groups.keys())

    features["total_logins"] = event_counts["login"]
    features["total_sessions"] = event_counts["session"]
    features["total_page_views"] = event_counts["page_view"]
    features["total_purchases"] = event_counts["purchase"]
    features["total_events"] = user_groups.size()

    # Days active & inactive
    features["active_days"] = user_groups["date"].nunique()
    features["inactive_days"] = observation_days - features["active_days"]

    # Average events per active day
    features["average_events_per_active_day"] = (
        features["total_events"] / features["active_days"]
    ).round(2)

    # Last activity timestamp and recency (days_since_last_activity)
    last_activity = user_groups["timestamp"].max()
    features["days_since_last_activity"] = (
        (dataset_max_date - last_activity).dt.total_seconds() / 86400.0
    ).round(2)

    # 3. Create churn label based on inactivity (> 30 days since last activity)
    # Customers with high inactivity in the cutoff period are marked as churned (1)
    features["churn"] = (
        features["days_since_last_activity"] > inactivity_churn_threshold
    ).astype(int)

    # Reset index so user_id becomes a column
    features = features.reset_index().rename(columns={"index": "user_id"})

    # Ensure column ordering
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
        "churn"
    ]
    features = features[columns_order]

    # Ensure target output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Save to CSV
    features.to_csv(output_path, index=False)
    print(f"Customer features dataset saved to {output_path}.\n")

    # 4. Print summary metrics
    num_users = len(features)
    # Features exclude user_id (identifier) and churn (target label)
    feature_cols = [c for c in features.columns if c not in ["user_id", "churn"]]
    num_features = len(feature_cols)
    churn_counts = features["churn"].value_counts().to_dict()

    print("=== Feature Engineering Summary ===")
    print(f"Number of users: {num_users}")
    print(f"Number of input features: {num_features} ({', '.join(feature_cols)})")
    print(f"Churned vs Non-churned counts:")
    print(f"  - Non-Churned (0): {churn_counts.get(0, 0)}")
    print(f"  - Churned (1):     {churn_counts.get(1, 0)}")
    print("\n=== First 10 Rows ===")
    print(features.head(10).to_string(index=False))

    return features

if __name__ == "__main__":
    generate_customer_features()
