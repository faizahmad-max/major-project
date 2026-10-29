"""
NetShield AI - XGBoost Intrusion Classifier
Gradient-boosted decision tree classifier with native multiclass optimization.
"""

from typing import Dict, Any, List, Optional
import os
import time
import numpy as np
import joblib
from app.models.base import BaseModel
from app.config import ARTIFACTS_DIR

try:
    import xgboost as xgb
    from sklearn.metrics import precision_recall_fscore_support, confusion_matrix, accuracy_score
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False


class XGBoostDetector(BaseModel):
    """XGBoost Classifier with label encoding and multiclass probabilities."""

    DEFAULT_CLASSES = ["BENIGN", "DoS", "PortScan", "BruteForce", "DataExfiltration"]

    def __init__(self, artifacts_dir=ARTIFACTS_DIR):
        super().__init__(name="XGBoost", model_type="supervised")
        self.artifacts_dir = artifacts_dir
        self.model_path = os.path.join(self.artifacts_dir, "xgboost_model.joblib")
        self.classes_ = list(self.DEFAULT_CLASSES)
        self.model = None
        self.is_available = XGBOOST_AVAILABLE

        if self.is_available:
            self.model = xgb.XGBClassifier(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                eval_metric="mlogloss",
                random_state=42,
                n_jobs=-1
            )
            self.load()

    def train(self, X, y, **kwargs) -> Dict[str, Any]:
        """Trains XGBoost classifier with label index mapping."""
        if not self.is_available:
            return {
                "error": "XGBoost library is not installed or available on this system.",
                "is_available": False
            }

        t0 = time.time()
        unique_labels = sorted(list(set(y)))
        self.classes_ = unique_labels
        label_to_idx = {lbl: i for i, lbl in enumerate(self.classes_)}
        y_encoded = np.array([label_to_idx[lbl] for lbl in y])

        self.model.fit(X, y_encoded)
        train_duration = round(time.time() - t0, 3)

        y_pred_idx = self.model.predict(X)
        y_pred = [self.classes_[i] for i in y_pred_idx]

        acc = float(accuracy_score(y, y_pred))
        precision, recall, f1, _ = precision_recall_fscore_support(y, y_pred, average="weighted", zero_division=0)
        cm = confusion_matrix(y, y_pred, labels=self.classes_).tolist()

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
        """Predicts multiclass probabilities using XGBoost."""
        if not self.is_available:
            return [{
                "model": self.name,
                "prediction": "NORMAL",
                "anomaly_score": 0.0,
                "attack_type": None,
                "confidence": None,
                "explanation": ["XGBoost is not installed on this server."]
            } for _ in range(len(X))]

        if not self.is_trained:
            return [{
                "model": self.name,
                "prediction": "NORMAL",
                "anomaly_score": 0.0,
                "attack_type": None,
                "confidence": None,
                "explanation": ["Model not yet trained."]
            } for _ in range(len(X))]

        probas = self.model.predict_proba(X)
        preds_idx = np.argmax(probas, axis=1)

        results = []
        benign_idx = self.classes_.index("BENIGN") if "BENIGN" in self.classes_ else -1

        for pred_i, proba in zip(preds_idx, probas):
            pred_class = self.classes_[pred_i] if pred_i < len(self.classes_) else "BENIGN"
            is_anomaly = pred_class != "BENIGN"
            conf = float(proba[pred_i])

            if benign_idx >= 0 and benign_idx < len(proba):
                anomaly_score = float(1.0 - proba[benign_idx])
            else:
                anomaly_score = float(conf if is_anomaly else 0.0)

            explanation = []
            if is_anomaly:
                explanation.append(f"XGBoost boosted tree prediction: '{pred_class}' (confidence {conf * 100:.1f}%)")
                explanation.append(f"Calculated anomaly score: {anomaly_score:.2f}")

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
        if not self.is_available or not self.is_trained:
            return
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
        if not self.is_available:
            return False
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
                print(f"[XGBoostDetector] Failed loading: {e}")
        return False

