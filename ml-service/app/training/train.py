"""
NetShield AI - Automated Model Training & Evaluation Engine
Executes complete training across all 4 detection paradigms, evaluates performance
with strict zero-leakage splits, measures inference latency, and saves all artifacts.
"""

from typing import Dict, Any
import os
import json
import time
import numpy as np
from app.config import ARTIFACTS_DIR
from app.preprocessing.pipeline import PreprocessingPipeline
from app.training.dataset_loader import DatasetLoader
from app.models.isolation_forest import IsolationForestDetector
from app.models.random_forest import RandomForestDetector
from app.models.xgboost_model import XGBoostDetector
from app.models.autoencoder import AutoencoderDetector


def run_training_pipeline() -> Dict[str, Any]:
    print("=" * 60)
    print("NetShield AI - Starting Machine Learning Training Pipeline")
    print("=" * 60)

    # 1. Load data
    X_train_df, X_test_df, y_train, y_test, dataset_desc = DatasetLoader.get_splits(test_size=0.20)
    print(f"Dataset: {dataset_desc}")
    print(f"Training samples: {len(X_train_df)}, Testing samples: {len(X_test_df)}")

    # 2. Fit Preprocessing Pipeline
    pipeline = PreprocessingPipeline(artifacts_dir=ARTIFACTS_DIR)
    pipeline.fit(X_train_df)
    print(f"Preprocessing fitted with {len(pipeline.get_feature_names())} features.")

    X_train_scaled = pipeline.transform(X_train_df)
    X_test_scaled = pipeline.transform(X_test_df)

    evaluation_report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "dataset_name": dataset_desc,
        "train_samples": len(X_train_df),
        "test_samples": len(X_test_df),
        "models": {}
    }

    # 3. Model 1: Isolation Forest
    print("\n--- Training Model 1: Isolation Forest ---")
    iso_detector = IsolationForestDetector(artifacts_dir=ARTIFACTS_DIR)
    iso_metrics = iso_detector.train(X_train_scaled, dataset_name=dataset_desc)

    # Evaluate on test set
    t0 = time.perf_counter()
    iso_preds = iso_detector.predict(X_test_scaled)
    iso_latency = ((time.perf_counter() - t0) / len(X_test_scaled)) * 1000
    y_test_anom = np.array([1 if y != "BENIGN" else 0 for y in y_test])
    pred_anom = np.array([1 if p["prediction"] == "ANOMALOUS" else 0 for p in iso_preds])

    iso_tp = int(np.sum((pred_anom == 1) & (y_test_anom == 1)))
    iso_fp = int(np.sum((pred_anom == 1) & (y_test_anom == 0)))
    iso_fn = int(np.sum((pred_anom == 0) & (y_test_anom == 1)))
    iso_tn = int(np.sum((pred_anom == 0) & (y_test_anom == 0)))
    iso_prec = iso_tp / max(iso_tp + iso_fp, 1)
    iso_rec = iso_tp / max(iso_tp + iso_fn, 1)
    iso_f1 = (2 * iso_prec * iso_rec) / max(iso_prec + iso_rec, 1e-6)
    iso_fpr = iso_fp / max(iso_fp + iso_tn, 1)

    iso_eval = {
        **iso_metrics,
        "test_precision": round(iso_prec, 4),
        "test_recall": round(iso_rec, 4),
        "test_f1": round(iso_f1, 4),
        "test_fpr": round(iso_fpr, 4),
        "avg_latency_ms": round(iso_latency, 3)
    }
    iso_detector.metrics.update(iso_eval)
    iso_detector.save()
    evaluation_report["models"]["Isolation Forest"] = iso_eval
    print(f"Isolation Forest Test F1: {iso_f1:.4f}, Latency: {iso_latency:.3f} ms/sample")

    # 4. Model 2: Random Forest
    print("\n--- Training Model 2: Random Forest ---")
    rf_detector = RandomForestDetector(artifacts_dir=ARTIFACTS_DIR)
    rf_metrics = rf_detector.train(X_train_scaled, y_train, dataset_name=dataset_desc)

    t0 = time.perf_counter()
    rf_preds = rf_detector.predict(X_test_scaled)
    rf_latency = ((time.perf_counter() - t0) / len(X_test_scaled)) * 1000
    evaluation_report["models"]["Random Forest"] = {
        **rf_metrics,
        "avg_latency_ms": round(rf_latency, 3)
    }
    rf_detector.metrics["avg_latency_ms"] = round(rf_latency, 3)
    rf_detector.save()
    print(f"Random Forest Test Accuracy: {rf_metrics.get('accuracy')}, Latency: {rf_latency:.3f} ms/sample")

    # 5. Model 3: XGBoost
    print("\n--- Training Model 3: XGBoost ---")
    xgb_detector = XGBoostDetector(artifacts_dir=ARTIFACTS_DIR)
    if xgb_detector.is_available:
        xgb_metrics = xgb_detector.train(X_train_scaled, y_train, dataset_name=dataset_desc)
        t0 = time.perf_counter()
        xgb_preds = xgb_detector.predict(X_test_scaled)
        xgb_latency = ((time.perf_counter() - t0) / len(X_test_scaled)) * 1000
        evaluation_report["models"]["XGBoost"] = {
            **xgb_metrics,
            "avg_latency_ms": round(xgb_latency, 3)
        }
        xgb_detector.metrics["avg_latency_ms"] = round(xgb_latency, 3)
        xgb_detector.save()
        print(f"XGBoost Test Accuracy: {xgb_metrics.get('accuracy')}, Latency: {xgb_latency:.3f} ms/sample")
    else:
        evaluation_report["models"]["XGBoost"] = {"is_available": False, "status": "Not installed"}

    # 6. Model 4: Autoencoder
    print("\n--- Training Model 4: PyTorch Autoencoder ---")
    ae_detector = AutoencoderDetector(artifacts_dir=ARTIFACTS_DIR)
    if ae_detector.is_available:
        # Autoencoder trains on normal/benign traffic
        benign_indices = (y_train == "BENIGN")
        X_train_benign = X_train_scaled[benign_indices]
        ae_metrics = ae_detector.train(X_train_benign, epochs=25, dataset_name=dataset_desc)

        t0 = time.perf_counter()
        ae_preds = ae_detector.predict(X_test_scaled)
        ae_latency = ((time.perf_counter() - t0) / len(X_test_scaled)) * 1000

        pred_ae_anom = np.array([1 if p["prediction"] == "ANOMALOUS" else 0 for p in ae_preds])
        ae_tp = int(np.sum((pred_ae_anom == 1) & (y_test_anom == 1)))
        ae_fp = int(np.sum((pred_ae_anom == 1) & (y_test_anom == 0)))
        ae_fn = int(np.sum((pred_ae_anom == 0) & (y_test_anom == 1)))
        ae_tn = int(np.sum((pred_ae_anom == 0) & (y_test_anom == 0)))
        ae_prec = ae_tp / max(ae_tp + ae_fp, 1)
        ae_rec = ae_tp / max(ae_tp + ae_fn, 1)
        ae_f1 = (2 * ae_prec * ae_rec) / max(ae_prec + ae_rec, 1e-6)
        ae_fpr = ae_fp / max(ae_fp + ae_tn, 1)

        ae_eval = {
            **ae_metrics,
            "test_precision": round(ae_prec, 4),
            "test_recall": round(ae_rec, 4),
            "test_f1": round(ae_f1, 4),
            "test_fpr": round(ae_fpr, 4),
            "avg_latency_ms": round(ae_latency, 3)
        }
        ae_detector.metrics.update(ae_eval)
        ae_detector.save()
        evaluation_report["models"]["Autoencoder"] = ae_eval
        print(f"Autoencoder Test F1: {ae_f1:.4f}, Latency: {ae_latency:.3f} ms/sample")
    else:
        evaluation_report["models"]["Autoencoder"] = {"is_available": False, "status": "Not installed"}

    # Save evaluation report history
    history_path = os.path.join(ARTIFACTS_DIR, "training_history.json")
    history = []
    if os.path.exists(history_path):
        try:
            with open(history_path, "r") as f:
                history = json.load(f)
        except Exception:
            history = []
    history.append(evaluation_report)
    with open(history_path, "w") as f:
        json.dump(history, f, indent=2)

    with open(os.path.join(ARTIFACTS_DIR, "latest_evaluation.json"), "w") as f:
        json.dump(evaluation_report, f, indent=2)

    print("\nTraining completed successfully! Artifacts stored in:", ARTIFACTS_DIR)
    return evaluation_report


if __name__ == "__main__":
    run_training_pipeline()

