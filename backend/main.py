import os
from typing import List, Optional
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, status
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
    description="Customer Churn Prediction API powered by Machine Learning",
    version="1.0.0"
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


class PredictResponse(BaseModel):
    user_id: str
    churn_probability: float
    risk_level: str


class CustomerRiskScore(BaseModel):
    user_id: str
    churn_probability: float
    risk_level: str
    total_events: int
    active_days: int
    inactive_days: int
    days_since_last_activity: float


class RiskScoresResponse(BaseModel):
    total_customers: int
    customers: List[CustomerRiskScore]


# API Endpoints
@app.get("/health", response_model=HealthResponse, tags=["Health"])
def get_health():
    """Health check endpoint to verify backend status."""
    return {"status": "healthy"}


@app.post("/predict", response_model=PredictResponse, tags=["Predictions"])
def predict_churn(request: PredictRequest):
    """
    Predict churn probability and risk level for a single customer.
    """
    if model is None:
        load_artifacts()

    try:
        # Prepare feature vector in exact column order
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

        # Apply scaling if required by model metadata or scaler present
        if metadata and metadata.get("requires_scaling", False) and scaler is not None:
            features_input = scaler.transform(input_data)
        else:
            features_input = input_data

        # Predict probability of churn (class 1)
        prob = float(model.predict_proba(features_input)[0][1])
        risk_level = calculate_risk_level(prob)

        return PredictResponse(
            user_id=request.user_id,
            churn_probability=round(prob, 4),
            risk_level=risk_level
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(e)}"
        )


@app.get("/risk-scores", response_model=RiskScoresResponse, tags=["Predictions"])
def get_risk_scores():
    """
    Load customer features and return predictions for all users,
    ranked from highest churn probability to lowest.
    """
    if model is None:
        load_artifacts()

    if not os.path.exists(DATA_PATH):
        raise HTTPException(
            status_code=status.HTTP_444_NOT_FOUND if hasattr(status, 'HTTP_444_NOT_FOUND') else 404,
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

        # Sort descending by churn_probability
        df_sorted = df.sort_values(by="churn_probability", ascending=False)

        customers = []
        for _, row in df_sorted.iterrows():
            customers.append(CustomerRiskScore(
                user_id=str(row["user_id"]),
                churn_probability=float(row["churn_probability"]),
                risk_level=str(row["risk_level"]),
                total_events=int(row["total_events"]),
                active_days=int(row["active_days"]),
                inactive_days=int(row["inactive_days"]),
                days_since_last_activity=float(row["days_since_last_activity"])
            ))

        return RiskScoresResponse(
            total_customers=len(customers),
            customers=customers
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating risk scores: {str(e)}"
        )
