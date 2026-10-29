"""
NetShield AI - Base Anomaly Detector Model
Provides the unified inference contract and common response schema.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import time


class BaseModel(ABC):
    """Abstract base class for all NetShield AI anomaly and classification models."""

    def __init__(self, name: str, model_type: str):
        self.name = name
        self.model_type = model_type  # 'unsupervised', 'supervised', 'reconstruction'
        self.is_trained: bool = False
        self.training_time: Optional[str] = None
        self.dataset_name: Optional[str] = None
        self.metrics: Dict[str, Any] = {}

    @abstractmethod
    def train(self, X, y=None, **kwargs) -> Dict[str, Any]:
        """Train model and return evaluation summary dictionary."""
        pass

    @abstractmethod
    def predict(self, X) -> List[Dict[str, Any]]:
        """Run batch inference on preprocessed feature matrix X."""
        pass

    def predict_single(self, X_row, raw_flow: Optional[Dict[str, Any]] = None, feature_names: Optional[List[str]] = None) -> Dict[str, Any]:
        """Convenience method for single-flow inference."""
        t0 = time.perf_counter()
        results = self.predict(X_row)
        res = results[0] if results else {
            "model": self.name,
            "prediction": "NORMAL",
            "anomaly_score": 0.0,
            "attack_type": None,
            "confidence": None,
            "explanation": []
        }
        latency_ms = (time.perf_counter() - t0) * 1000
        res["inference_latency_ms"] = round(latency_ms, 2)
        return res

    def get_info(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "model_type": self.model_type,
            "is_trained": self.is_trained,
            "training_time": self.training_time,
            "dataset_name": self.dataset_name,
            "metrics": self.metrics
        }

