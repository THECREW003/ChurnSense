import csv
import os
import random
from datetime import datetime, timedelta

def generate_activity_logs(
    num_users=500,
    num_days=90,
    start_date_str="2026-01-01 00:00:00",
    seed=42,
    output_path="data/activity_logs.csv"
):
    """
    Generates realistic, continuous synthetic activity logs for ChurnSense.
    
    User Behavior Cohorts:
    - Highly Active (~25%): Consistent high engagement across all 90 days.
    - Moderately Active (~30%): Regular moderate usage across all 90 days.
    - Gradually Decreasing (~20%): Engagement steadily decays over 90 days.
    - Resurrected / Intermittent (~10%): Inactive for weeks, then logs back in near day 75-88.
    - Churned at Varied Times (~15%): Drop-off day distributed uniformly from Day 15 to Day 82.
    """
    random.seed(seed)
    start_datetime = datetime.strptime(start_date_str, "%Y-%m-%d %H:%M:%S")

    users = []
    for i in range(1, num_users + 1):
        user_id = f"USR_{i:04d}"
        if i <= 125:
            cohort = "highly_active"
            base_prob = random.uniform(0.75, 0.95)
        elif i <= 275:
            cohort = "moderately_active"
            base_prob = random.uniform(0.35, 0.65)
        elif i <= 375:
            cohort = "gradually_decreasing"
            base_prob = random.uniform(0.60, 0.85)
        elif i <= 425:
            cohort = "resurrected"
            base_prob = random.uniform(0.40, 0.70)
        else:
            cohort = "churned_varied"
            base_prob = random.uniform(0.40, 0.70)
            
        users.append({
            "user_id": user_id,
            "cohort": cohort,
            "base_prob": base_prob,
            # For churned_varied cohort: drop-off day spread smoothly between day 15 and 82
            "dropoff_day": random.randint(15, 82) if cohort == "churned_varied" else num_days,
            # For resurrected cohort: inactive period between day 30 and day 75
            "resurrect_start": random.randint(25, 45),
            "resurrect_end": random.randint(70, 85)
        })

    logs = []

    for u in users:
        user_id = u["user_id"]
        cohort = u["cohort"]
        base_prob = u["base_prob"]
        dropoff_day = u["dropoff_day"]
        r_start = u["resurrect_start"]
        r_end = u["resurrect_end"]

        for day in range(num_days):
            current_day_date = start_datetime + timedelta(days=day)

            # Determine daily activity probability based on cohort
            if cohort == "highly_active":
                is_active = random.random() < base_prob
            elif cohort == "moderately_active":
                is_active = random.random() < base_prob
            elif cohort == "gradually_decreasing":
                # Linear decay over 90 days from base_prob to 0.05
                decay_factor = 1.0 - (day / num_days)
                day_prob = 0.05 + ((base_prob - 0.05) * decay_factor)
                is_active = random.random() < day_prob
            elif cohort == "resurrected":
                # Inactive during gap window [r_start, r_end], active otherwise
                if r_start <= day <= r_end:
                    is_active = random.random() < 0.05 # Very low chance during hiatus
                else:
                    is_active = random.random() < base_prob
            elif cohort == "churned_varied":
                if day > dropoff_day:
                    is_active = False
                else:
                    is_active = random.random() < base_prob

            if not is_active:
                continue

            # Number of sessions per active day
            if cohort == "highly_active":
                num_sessions = random.randint(1, 4)
            elif cohort == "moderately_active":
                num_sessions = random.randint(1, 3)
            else:
                num_sessions = random.randint(1, 2)

            for _ in range(num_sessions):
                session_hour = random.randint(7, 22)
                session_minute = random.randint(0, 59)
                session_second = random.randint(0, 59)

                current_time = current_day_date.replace(
                    hour=session_hour,
                    minute=session_minute,
                    second=session_second
                )

                # 1. Login event
                logs.append({
                    "user_id": user_id,
                    "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "event": "login"
                })

                # Session middle events
                num_mid_events = random.randint(2, 8)
                mid_event_types = ["page_view", "session", "purchase"]
                mid_event_weights = [0.65, 0.25, 0.10]

                for _ in range(num_mid_events):
                    gap = random.randint(10, 180)
                    current_time += timedelta(seconds=gap)
                    evt = random.choices(mid_event_types, weights=mid_event_weights)[0]
                    logs.append({
                        "user_id": user_id,
                        "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                        "event": evt
                    })

                # Logout event
                gap = random.randint(10, 60)
                current_time += timedelta(seconds=gap)
                logs.append({
                    "user_id": user_id,
                    "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "event": "logout"
                })

    # Sort logs chronologically
    logs.sort(key=lambda x: x["timestamp"])

    # Write to CSV
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    fieldnames = ["user_id", "timestamp", "event"]
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(logs)

    print(f"Generated realistic activity logs dataset with seed {seed}.")
    print(f"Saved to: {output_path}")
    print(f"Total events generated: {len(logs)}")

if __name__ == "__main__":
    generate_activity_logs()
