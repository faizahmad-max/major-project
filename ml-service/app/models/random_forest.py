"""
NetShield AI - Random Forest Intrusion Classifier
Supervised multiclass classifier capable of classifying specific network attack classes
and returning predictive confidence probabilities.
"""

from typing import Dict, Any, List, Optional
import os
import time
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import precision_recall_fscore_support, confusion_matrix, accuracy_score
from app.models.base import BaseModel
from app.config import ARTIFACTS_DIR


class RandomForestDetector(BaseModel):
    """Supervised Random Forest classifier for multi-category intrusion detection."""

    DEFAULT_CLASSES = ["BENIGN", "DoS", "PortScan", "BruteForce", "DataExfiltration"]

    def __init__(self, artifacts_dir=ARTIFACTS_DIR):
        super().__init__(name="Random Forest", model_type="supervised")
        self.artifacts_dir = artifacts_dir
        self.model_path = os.path.join(self.artifacts_dir, "random_forest.joblib")
        self.classes_ = list(self.DEFAULT_CLASSES)
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=15,
            min_samples_split=4,
            random_state=42,
            n_jobs=-1
        )
        self.load()

    def train(self, X, y, **kwargs) -> Dict[str, Any]:
        """Trains Random Forest classifier and computes multiclass validation metrics."""
        t0 = time.time()
        self.model.fit(X, y)
        train_duration = round(time.time() - t0, 3)

        self.classes_ = [str(c) for c in self.model.classes_]
        y_pred = self.model.predict(X)

        acc = float(accuracy_score(y, y_pred))
        precision, recall, f1, _ = precision_recall_fscore_support(y, y_pred, average="weighted", zero_division=0)
        cm = confusion_matrix(y, y_pred, labels=self.classes_).tolist()

        # Compute False Positive Rate on Benign class
        benign_idx = self.classes_.index("BENIGN") if "BENIGN" in self.classes_ else 0
        total_benign = sum(cm[benign_idx]) if len(cm) > benign_idx else 1
        fp_benign = total_benign - cm[benign_idx][benign_idx] if len(cm) > benign_idx else 0
        fpr = float(fp_benign / max(total_benign, 1))

        self.is_trained = True
        self.training_time = time.strftime("%Y-%m-%d %H:%M:%S")
        self.dataset_name = kwargs.get("dataset_name", "Curated IDS Benchmark")
        self.metrics = {
            "training_duration_sec": train_duration,
            "samples_trained": int(len(X)),
            "accuracy": round(acc, 4),
            "precision": round(float(precision), 4),
            "recall": round(float(recall), 4),
            "f1_score": round(float(f1), 4),
            "false_positive_rate": round(fpr, 4),
            "classes": self.classes_,
            "confusion_matrix": cm
        }

        self.save()
        return self.metrics

    def predict(self, X) -> List[Dict[str, Any]]:
        """Predicts class labels and calculates probability distributions."""
        if not self.is_trained:
            return [{
                "model": self.name,
                "prediction": "NORMAL",
                "anomaly_score": 0.0,
                "attack_type": None,
                "confidence": None,
                "explanation": ["Model not yet trained with labeled dataset."]
            } for _ in range(len(X))]

        preds = self.model.predict(X)
        probas = self.model.predict_proba(X)

        results = []
        benign_idx = self.classes_.index("BENIGN") if "BENIGN" in self.classes_ else -1

        for pred, proba in zip(preds, probas):
            pred_class = str(pred)
            is_anomaly = pred_class != "BENIGN"
            pred_idx = self.classes_.index(pred_class) if pred_class in self.classes_ else 0
            conf = float(proba[pred_idx])

            # Anomaly score is 1.0 - benign_probability
            if benign_idx >= 0 and benign_idx < len(proba):
                anomaly_score = float(1.0 - proba[benign_idx])
            else:
                anomaly_score = float(conf if is_anomaly else 0.0)

            explanation = []
            if is_anomaly:
                explanation.append(f"Supervised RF classified as '{pred_class}' with {conf * 100:.1f}% confidence")
                explanation.append(f"Benign traffic probability: {proba[benign_idx] * 100:.1f}%" if benign_idx >= 0 else "High threat profile")

            results.append({
                "model": self.name,
                "prediction": "ANOMALOUS" if is_anomaly else "NORMAL",
                "anomaly_score": round(anomaly_score, 3),
                "attack_type": pred_class if is_anomaly else None,
                "confidence": round(conf, 3),
                "explanation": explanation,
                "class_probabilities": {cls_name: round(float(p), 4) for cls_name, p in zip(self.classes_, proba)}
            })

        return results

    def save(self):
        os.makedirs(self.artifacts_dir, exist_ok=True)
        joblib.dump({
            "model": self.model,
            "classes": self.classes_,
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
                self.classes_ = data.get("classes", self.DEFAULT_CLASSES)
                self.metrics = data.get("metrics", {})
                self.is_trained = data.get("is_trained", False)
                self.training_time = data.get("training_time")
                self.dataset_name = data.get("dataset_name")
                return True
            except Exception as e:
                print(f"[RandomForestDetector] Failed loading: {e}")
        return False

