"""
NetShield AI - Isolation Forest Anomaly Detector
Unsupervised model isolating anomalies via recursive random feature partitioning.
"""

from typing import Dict, Any, List, Optional
import os
import time
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest
from app.models.base import BaseModel
from app.config import ARTIFACTS_DIR


class IsolationForestDetector(BaseModel):
    """Unsupervised anomaly detection using Scikit-Learn IsolationForest."""

    def __init__(self, artifacts_dir=ARTIFACTS_DIR):
        super().__init__(name="Isolation Forest", model_type="unsupervised")
        self.artifacts_dir = artifacts_dir
        self.model_path = os.path.join(self.artifacts_dir, "isolation_forest.joblib")
        self.threshold = 0.55
        self.contamination = 0.10
        self.model = IsolationForest(
            n_estimators=100,
            contamination=self.contamination,
            random_state=42,
            n_jobs=-1
        )
        self.load()

    def train(self, X, y=None, **kwargs) -> Dict[str, Any]:
        """Fits Isolation Forest on representative normal & background traffic."""
        t0 = time.time()
        self.model.fit(X)
        duration = round(time.time() - t0, 3)

        # Evaluate on training data
        preds = self.model.predict(X)
        scores = self.model.decision_function(X)
        anom_ratio = float(np.mean(preds == -1))

        self.is_trained = True
        self.training_time = time.strftime("%Y-%m-%d %H:%M:%S")
        self.dataset_name = kwargs.get("dataset_name", "Curated IDS Flows")
        self.metrics = {
            "training_duration_sec": duration,
            "samples_trained": int(len(X)),
            "contamination": self.contamination,
            "anomaly_rate_detected": round(anom_ratio, 4),
            "score_mean": round(float(np.mean(scores)), 4),
            "score_min": round(float(np.min(scores)), 4),
            "score_max": round(float(np.max(scores)), 4)
        }

        self.save()
        return self.metrics

    def predict(self, X) -> List[Dict[str, Any]]:
        """Predict whether flows are anomalous and output normalized anomaly score."""
        if not self.is_trained:
            # Fallback for untrained state: provide safe default
            return [{
                "model": self.name,
                "prediction": "NORMAL",
                "anomaly_score": 0.0,
                "attack_type": None,
                "confidence": None,
                "explanation": ["Model not yet trained with dataset."]
            } for _ in range(len(X))]

        raw_scores = self.model.decision_function(X)
        preds = self.model.predict(X)

        results = []
        for raw_s, p in zip(raw_scores, preds):
            # Normalize decision_function (higher score = more normal in scikit-learn)
            # So anomaly_score is inverted: higher score = more anomalous (0.0 to 1.0)
            # decision_function typically ranges between -0.5 and +0.5
            norm_anomaly_score = float(1.0 / (1.0 + np.exp(raw_s * 6.0)))
            is_anomaly = p == -1 or norm_anomaly_score >= self.threshold

            explanation = []
            if is_anomaly:
                explanation.append(f"Isolation partition depth anomaly score: {norm_anomaly_score:.2f} (threshold: {self.threshold})")
                explanation.append("Unusual multi-dimensional feature divergence from normal cluster baseline")

            results.append({
                "model": self.name,
                "prediction": "ANOMALOUS" if is_anomaly else "NORMAL",
                "anomaly_score": round(norm_anomaly_score, 3),
                "attack_type": "Unknown Anomaly" if is_anomaly else None,
                "confidence": round(norm_anomaly_score if is_anomaly else (1.0 - norm_anomaly_score), 3),
                "explanation": explanation
            })

        return results

    def save(self):
        os.makedirs(self.artifacts_dir, exist_ok=True)
        joblib.dump({
            "model": self.model,
            "metrics": self.metrics,
            "is_trained": self.is_trained,
            "training_time": self.training_time,
            "dataset_name": self.dataset_name
        }, self.model_path)

    def load(self) -> bool:
        if os.path.exists(self.model_path):
            try:
                data = joblib.load(self.model_path)
                self.model = data["model"]
                self.metrics = data.get("metrics", {})
                self.is_trained = data.get("is_trained", False)
                self.training_time = data.get("training_time")
                self.dataset_name = data.get("dataset_name")
                return True
            except Exception as e:
                print(f"[IsolationForestDetector] Failed loading: {e}")
        return False

