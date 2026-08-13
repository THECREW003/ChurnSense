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
    Generates synthetic activity log dataset for ChurnSense.
    
    User Behavior Patterns:
    - Highly active users (~25%): Consistent high frequency over all 90 days.
    - Moderately active users (~35%): Regular moderate frequency over all 90 days.
    - Gradually decreasing activity users (~20%): High initially, fading over 90 days.
    - Inactive / churned users (~20%): Active early on, then completely drop off.
    """
    random.seed(seed)
    start_datetime = datetime.strptime(start_date_str, "%Y-%m-%d %H:%M:%S")

    # Define user groups
    # Group 1: Highly active (125 users)
    # Group 2: Moderately active (175 users)
    # Group 3: Gradually decreasing (100 users)
    # Group 4: Inactive / churned (100 users)
    
    users = []
    for i in range(1, num_users + 1):
        user_id = f"USR_{i:04d}"
        if i <= 125:
            pattern = "highly_active"
        elif i <= 300:
            pattern = "moderately_active"
        elif i <= 400:
            pattern = "decreasing"
        else:
            pattern = "inactive"
        users.append((user_id, pattern))

    logs = []

    for user_id, pattern in users:
        # Determine specific user attributes based on pattern
        if pattern == "inactive":
            # Churn day between day 15 and day 35
            dropoff_day = random.randint(15, 35)
        elif pattern == "decreasing":
            dropoff_day = num_days

        for day in range(num_days):
            current_day_date = start_datetime + timedelta(days=day)

            # Determine whether the user is active on this day based on pattern
            if pattern == "highly_active":
                is_active = random.random() < 0.85
            elif pattern == "moderately_active":
                is_active = random.random() < 0.50
            elif pattern == "decreasing":
                # Probability drops over time from 0.75 down to 0.10
                decay_factor = 1.0 - (day / num_days)
                prob = 0.10 + (0.65 * decay_factor)
                is_active = random.random() < prob
            elif pattern == "inactive":
                if day > dropoff_day:
                    is_active = False
                else:
                    # Moderate activity before dropoff
                    is_active = random.random() < 0.55

            if not is_active:
                continue

            # Number of sessions on active day
            if pattern == "highly_active":
                num_sessions = random.randint(1, 4)
            elif pattern == "moderately_active":
                num_sessions = random.randint(1, 2)
            else:
                num_sessions = 1

            for _ in range(num_sessions):
                # Pick session start time between 07:00 and 23:00
                session_hour = random.randint(7, 22)
                session_minute = random.randint(0, 59)
                session_second = random.randint(0, 59)
                
                current_time = current_day_date.replace(
                    hour=session_hour,
                    minute=session_minute,
                    second=session_second
                )

                # 1. First event is login
                logs.append({
                    "user_id": user_id,
                    "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "event": "login"
                })

                # Determine session length (number of middle events)
                if pattern == "highly_active":
                    num_mid_events = random.randint(3, 10)
                elif pattern == "moderately_active":
                    num_mid_events = random.randint(2, 6)
                else:
                    num_mid_events = random.randint(1, 4)

                mid_event_types = ["page_view", "session", "purchase"]
                mid_event_weights = [0.65, 0.25, 0.10]

                for _ in range(num_mid_events):
                    gap = random.randint(15, 240) # 15s to 4 min gap between events
                    current_time += timedelta(seconds=gap)
                    event_choice = random.choices(mid_event_types, weights=mid_event_weights)[0]
                    logs.append({
                        "user_id": user_id,
                        "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                        "event": event_choice
                    })

                # Final event in session is logout
                gap = random.randint(10, 60)
                current_time += timedelta(seconds=gap)
                logs.append({
                    "user_id": user_id,
                    "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "event": "logout"
                })

    # Sort logs chronologically by timestamp
    logs.sort(key=lambda x: x["timestamp"])

    # Ensure target output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Write to CSV
    fieldnames = ["user_id", "timestamp", "event"]
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(logs)

    print(f"Dataset successfully generated with fixed seed {seed}.")
    print(f"Output saved to: {output_path}")
    print(f"Total records generated: {len(logs)}")

if __name__ == "__main__":
    generate_activity_logs()
