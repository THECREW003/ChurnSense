import os
import io
import random
import hashlib
from typing import List, Optional, Tuple
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Determine base directory paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

MODEL_PATH = os.path.join(BASE_DIR, "model", "model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "model", "scaler.pkl")
META_PATH = os.path.join(BASE_DIR, "model", "metadata.pkl")
DATA_PATH = os.path.join(PROJECT_ROOT, "data", "customer_features.csv")

# Initialize FastAPI app
app = FastAPI(
    title="ChurnSense Backend API",
    description="Customer Churn Prediction, Risk Explanation & Revenue at Risk Analytics API powered by Machine Learning",
    version="1.3.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model, scaler, and metadata
model = None
scaler = None
metadata = None
feature_cols = [
    "total_logins",
    "total_sessions",
    "total_page_views",
    "total_purchases",
    "total_events",
    "active_days",
    "inactive_days",
    "average_events_per_active_day",
    "days_since_last_activity"
]


def load_artifacts():
    global model, scaler, metadata, feature_cols
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Please train the model first.")
    
    model = joblib.load(MODEL_PATH)
    
    if os.path.exists(SCALER_PATH):
        scaler = joblib.load(SCALER_PATH)
        
    if os.path.exists(META_PATH):
        metadata = joblib.load(META_PATH)
        if "feature_names" in metadata:
            feature_cols = metadata["feature_names"]


@app.on_event("startup")
def startup_event():
    load_artifacts()


def calculate_risk_level(prob: float) -> str:
    """
    Computes risk level based on churn probability thresholds:
    0-30%  (<= 0.30) -> Low
    31-70% (> 0.30 and <= 0.70) -> Medium
    71-100% (> 0.70) -> High
    """
    if prob <= 0.30:
        return "Low"
    elif prob <= 0.70:
        return "Medium"
    else:
        return "High"


def assign_monthly_value(user_id: str, seed: int = 42) -> float:
    """
    Deterministically assigns a realistic synthetic monthly subscription value (in INR)
    to a customer based on user_id and seed.
    Subscription tiers: ₹299, ₹499, ₹799, ₹999, ₹1499, ₹2499.
    """
    price_tiers = [299.0, 499.0, 799.0, 999.0, 1499.0, 2499.0]
    price_weights = [0.15, 0.25, 0.25, 0.20, 0.10, 0.05]
    h = int(hashlib.md5(f"{seed}_{user_id}".encode("utf-8")).hexdigest(), 16)
    rng = random.Random(h)
    return float(rng.choices(price_tiers, weights=price_weights)[0])


def generate_risk_explanation(
    risk_level: str,
    days_since_last_activity: float,
    inactive_days: int,
    active_days: int,
    total_events: int,
    total_purchases: int,
    average_events_per_active_day: float
) -> Tuple[List[str], str]:
    """
    Generates rule-based feature-driven risk factors and recommended actions.
    Selects the 2-4 most significant indicators based on actual customer features.
    """
    factors = []

    if risk_level == "High":
        if days_since_last_activity >= 30:
            factors.append(f"{int(days_since_last_activity)} days elapsed since last activity")
        if inactive_days >= 50:
            factors.append(f"Extended inactivity period ({inactive_days} days inactive out of 90)")
        if active_days <= 25:
            factors.append(f"Low account active days ({active_days} active days)")
        if total_events <= 300:
            factors.append(f"Severely reduced overall engagement ({total_events} total events)")
        if total_purchases == 0:
            factors.append("Zero purchases completed")

        if len(factors) < 2:
            factors.append(f"Below average session activity ({average_events_per_active_day:.1f} events/active day)")

        if days_since_last_activity > 45:
            action = "Send urgent win-back campaign with a 25% discount offer"
        else:
            action = "Schedule immediate re-engagement push notification and support call"

    elif risk_level == "Medium":
        if 10 <= days_since_last_activity < 30:
            factors.append(f"Moderate inactivity gap ({int(days_since_last_activity)} days since last activity)")
        if 20 <= active_days <= 50:
            factors.append(f"Moderate usage frequency ({active_days} active days)")
        if average_events_per_active_day < 18:
            factors.append(f"Below average session engagement ({average_events_per_active_day:.1f} events/day)")
        if total_purchases < 20:
            factors.append(f"Low purchase count ({total_purchases} total purchases)")

        if len(factors) < 2:
            factors.append("Declining interaction trends in recent weeks")

        if total_purchases < 10:
            action = "Send targeted product recommendations and loyalty points bonus"
        else:
            action = "Send feature highlight newsletter and interactive usage tips"

    else:  # Low risk
        if days_since_last_activity < 5:
            factors.append(f"Recent active usage ({days_since_last_activity:.1f} days ago)")
        if active_days >= 65:
            factors.append(f"High account consistency ({active_days} active days)")
        if total_purchases >= 50:
            factors.append(f"Strong purchase history ({total_purchases} purchases)")
        if total_events >= 1000:
            factors.append(f"High total engagement ({total_events} total events)")

        if len(factors) < 2:
            factors.append("Consistently active daily log patterns")

        action = "Enroll in VIP customer loyalty rewards program"

    return factors[:4], action


def process_raw_logs_to_features(df_logs: pd.DataFrame, observation_days: int = 90) -> pd.DataFrame:
    """
    Transforms raw activity logs DataFrame (user_id, timestamp, event)
    into user-level features matching ChurnSense feature engineering specs.
    """
    df = df_logs.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["date"] = df["timestamp"].dt.date
    dataset_max_date = df["timestamp"].max()

    user_groups = df.groupby("user_id")

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

    features["active_days"] = user_groups["date"].nunique()
    features["inactive_days"] = observation_days - features["active_days"]

    features["average_events_per_active_day"] = (
        features["total_events"] / features["active_days"]
    ).round(2)

    last_activity = user_groups["timestamp"].max()
    features["days_since_last_activity"] = (
        (dataset_max_date - last_activity).dt.total_seconds() / 86400.0
    ).round(2)

    features = features.reset_index().rename(columns={"index": "user_id"})
    
    # Assign synthetic monthly value if not present in the raw data
    if "monthly_value" not in features.columns:
        features["monthly_value"] = [assign_monthly_value(str(uid)) for uid in features["user_id"]]

    return features


# Pydantic Schemas
class HealthResponse(BaseModel):
    status: str


class PredictRequest(BaseModel):
    user_id: str = Field(..., description="Unique user identifier", example="USR_0001")
    total_logins: int = Field(..., ge=0, example=180)
    total_sessions: int = Field(..., ge=0, example=290)
    total_page_views: int = Field(..., ge=0, example=750)
    total_purchases: int = Field(..., ge=0, example=120)
    total_events: int = Field(..., ge=0, example=1500)
    active_days: int = Field(..., ge=0, example=75)
    inactive_days: int = Field(..., ge=0, example=15)
    average_events_per_active_day: float = Field(..., ge=0.0, example=20.0)
    days_since_last_activity: float = Field(..., ge=0.0, example=1.5)
    monthly_value: Optional[float] = Field(None, description="Monthly customer subscription value in INR", example=999.0)


class PredictResponse(BaseModel):
    user_id: str
    churn_probability: float
    risk_level: str
    monthly_value: float
    revenue_at_risk: float
    risk_factors: List[str]
    recommended_action: str


class CustomerRiskScore(BaseModel):
    user_id: str
    churn_probability: float
    risk_level: str
    monthly_value: float
    revenue_at_risk: float
    risk_factors: List[str]
    recommended_action: str
    total_logins: int
    total_sessions: int
    total_page_views: int
    total_purchases: int
    total_events: int
    active_days: int
    inactive_days: int
    average_events_per_active_day: float
    days_since_last_activity: float


class RiskScoresResponse(BaseModel):
    total_customers: int
    total_revenue_at_risk: float
    high_risk_revenue: float
    medium_risk_revenue: float
    low_risk_revenue: float
    total_monthly_value: float
    customers: List[CustomerRiskScore]


class UploadResponse(BaseModel):
    filename: str
    total_customers: int
    total_revenue_at_risk: float
    high_risk_revenue: float
    medium_risk_revenue: float
    low_risk_revenue: float
    total_monthly_value: float
    customers: List[CustomerRiskScore]
    message: str


# API Endpoints
@app.get("/health", response_model=HealthResponse, tags=["Health"])
def get_health():
    """Health check endpoint to verify backend status."""
    return {"status": "healthy"}


@app.post("/predict", response_model=PredictResponse, tags=["Predictions"])
def predict_churn(request: PredictRequest):
    """
    Predict churn probability, risk level, explainable risk factors, and revenue at risk for a single customer.
    """
    if model is None:
        load_artifacts()

    try:
        input_data = pd.DataFrame([{
            "total_logins": request.total_logins,
            "total_sessions": request.total_sessions,
            "total_page_views": request.total_page_views,
            "total_purchases": request.total_purchases,
            "total_events": request.total_events,
            "active_days": request.active_days,
            "inactive_days": request.inactive_days,
            "average_events_per_active_day": request.average_events_per_active_day,
            "days_since_last_activity": request.days_since_last_activity
        }])[feature_cols]

        if metadata and metadata.get("requires_scaling", False) and scaler is not None:
            features_input = scaler.transform(input_data)
        else:
            features_input = input_data

        prob = float(model.predict_proba(features_input)[0][1])
        churn_prob = round(prob, 4)
        risk_level = calculate_risk_level(churn_prob)
        
        monthly_val = float(request.monthly_value if request.monthly_value is not None else assign_monthly_value(request.user_id))
        revenue_at_risk = round(churn_prob * monthly_val, 2)

        factors, action = generate_risk_explanation(
            risk_level=risk_level,
            days_since_last_activity=request.days_since_last_activity,
            inactive_days=request.inactive_days,
            active_days=request.active_days,
            total_events=request.total_events,
            total_purchases=request.total_purchases,
            average_events_per_active_day=request.average_events_per_active_day
        )

        return PredictResponse(
            user_id=request.user_id,
            churn_probability=churn_prob,
            risk_level=risk_level,
            monthly_value=monthly_val,
            revenue_at_risk=revenue_at_risk,
            risk_factors=factors,
            recommended_action=action
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(e)}"
        )


@app.get("/risk-scores", response_model=RiskScoresResponse, tags=["Predictions"])
def get_risk_scores():
    """
    Load customer features and return predictions, explanations, and revenue at risk for all users,
    ranked from highest churn probability to lowest.
    """
    if model is None:
        load_artifacts()

    if not os.path.exists(DATA_PATH):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer features file not found at {DATA_PATH}."
        )

    try:
        df = pd.read_csv(DATA_PATH)
        X = df[feature_cols]

        if metadata and metadata.get("requires_scaling", False) and scaler is not None:
            X_input = scaler.transform(X)
        else:
            X_input = X

        probs = model.predict_proba(X_input)[:, 1]
        df["churn_probability"] = probs.round(4)
        df["risk_level"] = df["churn_probability"].apply(calculate_risk_level)

        if "monthly_value" not in df.columns:
            df["monthly_value"] = [assign_monthly_value(str(uid)) for uid in df["user_id"]]
        else:
            df["monthly_value"] = df["monthly_value"].astype(float)

        df["revenue_at_risk"] = (df["churn_probability"] * df["monthly_value"]).round(2)

        df_sorted = df.sort_values(by="churn_probability", ascending=False)

        customers = []
        for _, row in df_sorted.iterrows():
            r_level = str(row["risk_level"])
            days_inactive_recency = float(row["days_since_last_activity"])
            inact_days = int(row["inactive_days"])
            act_days = int(row["active_days"])
            tot_events = int(row["total_events"])
            tot_purchases = int(row["total_purchases"])
            avg_events = float(row["average_events_per_active_day"])
            m_val = float(row["monthly_value"])
            rev_at_risk = float(row["revenue_at_risk"])

            factors, action = generate_risk_explanation(
                risk_level=r_level,
                days_since_last_activity=days_inactive_recency,
                inactive_days=inact_days,
                active_days=act_days,
                total_events=tot_events,
                total_purchases=tot_purchases,
                average_events_per_active_day=avg_events
            )

            customers.append(CustomerRiskScore(
                user_id=str(row["user_id"]),
                churn_probability=float(row["churn_probability"]),
                risk_level=r_level,
                monthly_value=m_val,
                revenue_at_risk=rev_at_risk,
                risk_factors=factors,
                recommended_action=action,
                total_logins=int(row["total_logins"]),
                total_sessions=int(row["total_sessions"]),
                total_page_views=int(row["total_page_views"]),
                total_purchases=tot_purchases,
                total_events=tot_events,
                active_days=act_days,
                inactive_days=inact_days,
                average_events_per_active_day=avg_events,
                days_since_last_activity=days_inactive_recency
            ))

        total_rev_at_risk = round(sum(c.revenue_at_risk for c in customers), 2)
        high_risk_rev = round(sum(c.revenue_at_risk for c in customers if c.risk_level == "High"), 2)
        medium_risk_rev = round(sum(c.revenue_at_risk for c in customers if c.risk_level == "Medium"), 2)
        low_risk_rev = round(sum(c.revenue_at_risk for c in customers if c.risk_level == "Low"), 2)
        total_monthly_val = round(sum(c.monthly_value for c in customers), 2)

        return RiskScoresResponse(
            total_customers=len(customers),
            total_revenue_at_risk=total_rev_at_risk,
            high_risk_revenue=high_risk_rev,
            medium_risk_revenue=medium_risk_rev,
            low_risk_revenue=low_risk_rev,
            total_monthly_value=total_monthly_val,
            customers=customers
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating risk scores: {str(e)}"
        )


@app.post("/upload", response_model=UploadResponse, tags=["Predictions"])
async def upload_activity_logs(file: UploadFile = File(...)):
    """
    Accepts a user-uploaded CSV file containing activity logs (user_id, event, timestamp),
    validates format/columns, extracts customer features, evaluates ML model predictions,
    and returns ranked churn risk scores and revenue at risk without overwriting original dataset files.
    """
    if model is None:
        load_artifacts()

    # 1. Check file extension
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only .csv files are supported."
        )

    try:
        content = await file.read()
        if not content or len(content.strip()) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded CSV file is empty."
            )

        # 2. Parse CSV
        try:
            df_logs = pd.read_csv(io.BytesIO(content))
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to parse CSV file. Ensure it is a valid comma-separated text file."
            )

        # 3. Validate required columns
        required_cols = {"user_id", "event", "timestamp"}
        missing_cols = required_cols - set(df_logs.columns)
        if missing_cols:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required CSV columns: {', '.join(sorted(missing_cols))}. Uploaded file must contain: user_id, event, timestamp."
            )

        if len(df_logs) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded CSV file contains 0 rows of data."
            )

        # 4. Extract user-level features without overwriting disk datasets
        features_df = process_raw_logs_to_features(df_logs)
        X = features_df[feature_cols]

        if metadata and metadata.get("requires_scaling", False) and scaler is not None:
            X_input = scaler.transform(X)
        else:
            X_input = X

        probs = model.predict_proba(X_input)[:, 1]
        features_df["churn_probability"] = probs.round(4)
        features_df["risk_level"] = features_df["churn_probability"].apply(calculate_risk_level)

        if "monthly_value" not in features_df.columns:
            features_df["monthly_value"] = [assign_monthly_value(str(uid)) for uid in features_df["user_id"]]
        else:
            features_df["monthly_value"] = features_df["monthly_value"].astype(float)

        features_df["revenue_at_risk"] = (features_df["churn_probability"] * features_df["monthly_value"]).round(2)

        df_sorted = features_df.sort_values(by="churn_probability", ascending=False)

        customers = []
        for _, row in df_sorted.iterrows():
            r_level = str(row["risk_level"])
            days_inactive_recency = float(row["days_since_last_activity"])
            inact_days = int(row["inactive_days"])
            act_days = int(row["active_days"])
            tot_events = int(row["total_events"])
            tot_purchases = int(row["total_purchases"])
            avg_events = float(row["average_events_per_active_day"])
            m_val = float(row["monthly_value"])
            rev_at_risk = float(row["revenue_at_risk"])

            factors, action = generate_risk_explanation(
                risk_level=r_level,
                days_since_last_activity=days_inactive_recency,
                inactive_days=inact_days,
                active_days=act_days,
                total_events=tot_events,
                total_purchases=tot_purchases,
                average_events_per_active_day=avg_events
            )

            customers.append(CustomerRiskScore(
                user_id=str(row["user_id"]),
                churn_probability=float(row["churn_probability"]),
                risk_level=r_level,
                monthly_value=m_val,
                revenue_at_risk=rev_at_risk,
                risk_factors=factors,
                recommended_action=action,
                total_logins=int(row["total_logins"]),
                total_sessions=int(row["total_sessions"]),
                total_page_views=int(row["total_page_views"]),
                total_purchases=tot_purchases,
                total_events=tot_events,
                active_days=act_days,
                inactive_days=inact_days,
                average_events_per_active_day=avg_events,
                days_since_last_activity=days_inactive_recency
            ))

        total_rev_at_risk = round(sum(c.revenue_at_risk for c in customers), 2)
        high_risk_rev = round(sum(c.revenue_at_risk for c in customers if c.risk_level == "High"), 2)
        medium_risk_rev = round(sum(c.revenue_at_risk for c in customers if c.risk_level == "Medium"), 2)
        low_risk_rev = round(sum(c.revenue_at_risk for c in customers if c.risk_level == "Low"), 2)
        total_monthly_val = round(sum(c.monthly_value for c in customers), 2)

        return UploadResponse(
            filename=file.filename,
            total_customers=len(customers),
            total_revenue_at_risk=total_rev_at_risk,
            high_risk_revenue=high_risk_rev,
            medium_risk_revenue=medium_risk_rev,
            low_risk_revenue=low_risk_rev,
            total_monthly_value=total_monthly_val,
            customers=customers,
            message=f"Successfully analyzed {len(customers)} customers from {file.filename}."
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing CSV: {str(e)}"
        )

