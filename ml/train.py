import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)

def train_and_evaluate():
    data_path = "data/customer_features.csv"
    model_dir = "backend/model"

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Feature dataset not found at {data_path}. Please run feature engineering first.")

    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)

    # 1. Feature matrix X (excluding user_id and churn) and target vector y
    feature_cols = [col for col in df.columns if col not in ["user_id", "churn"]]
    X = df[feature_cols]
    y = df["churn"]

    # 2. Stratified train/test split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"Dataset split into {len(X_train)} training samples and {len(X_test)} test samples.")

    # 3. Fit scaler on training set
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 4. Train Logistic Regression and Random Forest models
    lr = LogisticRegression(random_state=42, max_iter=1000)
    rf = RandomForestClassifier(n_estimators=100, random_state=42)

    print("Training Logistic Regression...")
    lr.fit(X_train_scaled, y_train)

    print("Training Random Forest Classifier...")
    rf.fit(X_train, y_train)

    # 5. Evaluate models
    def evaluate(model, X_eval, y_eval):
        y_pred = model.predict(X_eval)
        y_proba = model.predict_proba(X_eval)[:, 1]
        return {
            "Accuracy": accuracy_score(y_eval, y_pred),
            "Precision": precision_score(y_eval, y_pred, zero_division=0),
            "Recall": recall_score(y_eval, y_pred, zero_division=0),
            "F1-Score": f1_score(y_eval, y_pred, zero_division=0),
            "ROC-AUC": roc_auc_score(y_eval, y_proba)
        }

    lr_results = evaluate(lr, X_test_scaled, y_test)
    rf_results = evaluate(rf, X_test, y_test)

    # 6. Print comparison table
    comparison_df = pd.DataFrame([lr_results, rf_results], index=["Logistic Regression", "Random Forest"])
    print("\n" + "=" * 70)
    print(" MODEL PERFORMANCE COMPARISON ".center(70, "="))
    print("=" * 70)
    print(comparison_df.round(4).to_string())
    print("=" * 70 + "\n")

    # 7. Model selection based primarily on F1-Score and ROC-AUC
    # We rank by (F1-Score, ROC-AUC) tuple
    lr_rank_key = (lr_results["F1-Score"], lr_results["ROC-AUC"])
    rf_rank_key = (rf_results["F1-Score"], rf_results["ROC-AUC"])

    if rf_rank_key >= lr_rank_key:
        best_model_name = "Random Forest Classifier"
        best_model = rf
        best_results = rf_results
        requires_scaling = False
    else:
        best_model_name = "Logistic Regression"
        best_model = lr
        best_results = lr_results
        requires_scaling = True

    print(f"Selected Best Model: {best_model_name}")

    # 8. Ensure output directory exists and save artifacts
    os.makedirs(model_dir, exist_ok=True)

    model_file = os.path.join(model_dir, "model.pkl")
    scaler_file = os.path.join(model_dir, "scaler.pkl")
    meta_file = os.path.join(model_dir, "metadata.pkl")

    joblib.dump(best_model, model_file)
    joblib.dump(scaler, scaler_file)
    joblib.dump({
        "model_name": best_model_name,
        "feature_names": feature_cols,
        "metrics": best_results,
        "requires_scaling": requires_scaling
    }, meta_file)

    print(f"Successfully saved model to: {model_file}")
    print(f"Successfully saved scaler to: {scaler_file}")
    print(f"Successfully saved metadata to: {meta_file}")

    print("\nFinal Selected Model Metrics:")
    for k, v in best_results.items():
        print(f"  {k:10s}: {v:.4f}")

if __name__ == "__main__":
    train_and_evaluate()
