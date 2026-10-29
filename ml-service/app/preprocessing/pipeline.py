"""
NetShield AI - Preprocessing Pipeline
Ensures identical feature engineering, scaling, and categorical encoding
across both training and real-time inference.
"""

from typing import List, Dict, Any, Tuple
import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler
from app.config import ARTIFACTS_DIR
from app.features.extractor import NUMERIC_FEATURES, FeatureExtractor


class PreprocessingPipeline:
    """Standardizes numeric attributes and performs one-hot encoding on protocols."""

    def __init__(self, artifacts_dir=ARTIFACTS_DIR):
        self.artifacts_dir = artifacts_dir
        self.scaler_path = os.path.join(self.artifacts_dir, "scaler.joblib")
        self.metadata_path = os.path.join(self.artifacts_dir, "feature_metadata.json")
        self.scaler: StandardScaler = StandardScaler()
        self.feature_columns: List[str] = []
        self.is_fitted: bool = False
        self._load_artifacts_if_exist()

    def _load_artifacts_if_exist(self) -> bool:
        if os.path.exists(self.scaler_path) and os.path.exists(self.metadata_path):
            try:
                self.scaler = joblib.load(self.scaler_path)
                with open(self.metadata_path, "r") as f:
                    meta = json.load(f)
                    self.feature_columns = meta.get("feature_columns", [])
                self.is_fitted = True
                return True
            except Exception as e:
                print(f"[PreprocessingPipeline] Failed loading artifacts: {e}")
                self.is_fitted = False
        return False

    def _encode_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Applies protocol one-hot encoding and aligns numeric features."""
        df_out = pd.DataFrame(index=df.index)

        # Ensure all numeric features exist
        for col in NUMERIC_FEATURES:
            if col in df.columns:
                df_out[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)
            else:
                df_out[col] = 0.0

        # One-hot encode protocols
        proto_series = df["protocol"].astype(str).str.upper() if "protocol" in df.columns else pd.Series(["OTHER"] * len(df))
        for p in ["TCP", "UDP", "ICMP", "OTHER"]:
            col_name = f"protocol_{p}"
            df_out[col_name] = (proto_series == p).astype(float)

        return df_out

    def fit(self, df_raw: pd.DataFrame) -> "PreprocessingPipeline":
        """Fit scaler on representative raw features."""
        encoded_df = self._encode_dataframe(df_raw)
        self.feature_columns = list(encoded_df.columns)
        self.scaler.fit(encoded_df.values)
        self.is_fitted = True

        # Persist artifacts
        os.makedirs(self.artifacts_dir, exist_ok=True)
        joblib.dump(self.scaler, self.scaler_path)
        with open(self.metadata_path, "w") as f:
            json.dump({
                "feature_columns": self.feature_columns,
                "numeric_features": NUMERIC_FEATURES,
                "protocol_classes": ["TCP", "UDP", "ICMP", "OTHER"]
            }, f, indent=2)

        return self

    def transform(self, df_raw: pd.DataFrame) -> np.ndarray:
        """Transforms raw dataframe to scaled numeric array."""
        if not self.is_fitted:
            raise RuntimeError("PreprocessingPipeline must be fitted or loaded before calling transform().")

        encoded_df = self._encode_dataframe(df_raw)

        # Enforce exact column order
        for col in self.feature_columns:
            if col not in encoded_df.columns:
                encoded_df[col] = 0.0

        aligned_df = encoded_df[self.feature_columns]
        scaled = self.scaler.transform(aligned_df.values)
        return scaled

    def transform_single(self, flow: Dict[str, Any]) -> Tuple[np.ndarray, List[str]]:
        """Extracts and scales a single flow dictionary."""
        extracted = FeatureExtractor.extract_from_flow(flow)
        df_single = pd.DataFrame([extracted])
        scaled_array = self.transform(df_single)
        return scaled_array, self.feature_columns

    def get_feature_names(self) -> List[str]:
        return self.feature_columns

