"""
NetShield AI - Model Registry & Orchestration Manager
Manages detector lifecycles, active model routing, and multi-model ensemble/comparison.
"""

from typing import Dict, Any, List, Optional
from app.models.base import BaseModel
from app.models.isolation_forest import IsolationForestDetector
from app.models.random_forest import RandomForestDetector
from app.models.xgboost_model import XGBoostDetector
from app.models.autoencoder import AutoencoderDetector
from app.preprocessing.pipeline import PreprocessingPipeline


class ModelRegistry:
    def __init__(self, pipeline: PreprocessingPipeline):
        self.pipeline = pipeline
        self.models: Dict[str, BaseModel] = {
            "Isolation Forest": IsolationForestDetector(),
            "Random Forest": RandomForestDetector(),
            "XGBoost": XGBoostDetector(),
            "Autoencoder": AutoencoderDetector()
        }
        self.active_model_name: str = "Random Forest"

    def get_model(self, name: Optional[str] = None) -> BaseModel:
        selected = name or self.active_model_name
        if selected in self.models:
            return self.models[selected]
        # Fallback to Random Forest or first available
        return self.models.get(self.active_model_name, list(self.models.values())[0])

    def set_active_model(self, name: str) -> bool:
        if name in self.models:
            self.active_model_name = name
            return True
        return False

    def list_models(self) -> List[Dict[str, Any]]:
        return [
            {
                **m.get_info(),
                "is_active": (m.name == self.active_model_name)
            }
            for m in self.models.values()
        ]

    def predict_flow(self, flow: Dict[str, Any], model_name: Optional[str] = None) -> Dict[str, Any]:
        """Preprocesses single flow and executes inference on the selected model."""
        model = self.get_model(model_name)
        if not self.pipeline.is_fitted:
            # Handle cold-start gracefully
            return {
                "model": model.name,
                "prediction": "NORMAL",
                "anomaly_score": 0.0,
                "attack_type": None,
                "confidence": None,
                "explanation": ["System initialization in progress; preprocessing pipeline not yet fitted."],
                "inference_latency_ms": 0.0
            }

        X_scaled, feature_names = self.pipeline.transform_single(flow)
        result = model.predict_single(X_scaled, raw_flow=flow, feature_names=feature_names)
        return result

    def predict_all_models(self, flow: Dict[str, Any]) -> Dict[str, Any]:
        """Runs the given flow through all 4 models for comparative lab analysis."""
        if not self.pipeline.is_fitted:
            return {m_name: self.predict_flow(flow, m_name) for m_name in self.models}

        X_scaled, feature_names = self.pipeline.transform_single(flow)
        comparison = {}
        for name, model in self.models.items():
            comparison[name] = model.predict_single(X_scaled, raw_flow=flow, feature_names=feature_names)
        return comparison

