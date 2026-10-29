"""
NetShield AI - PyTorch Deep Reconstruction Autoencoder
Unsupervised neural network trained exclusively on normal traffic patterns.
Detects zero-day anomalies and stealthy network diversions via high reconstruction error (MSE).
"""

from typing import Dict, Any, List, Optional
import os
import time
import json
import numpy as np
from app.models.base import BaseModel
from app.config import ARTIFACTS_DIR

try:
    import torch
    import torch.nn as nn
    from torch.utils.data import TensorDataset, DataLoader
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


if TORCH_AVAILABLE:
    class AutoencoderNet(nn.Module):
        def __init__(self, input_dim: int, latent_dim: int = 8):
            super().__init__()
            # Encoder
            self.encoder = nn.Sequential(
                nn.Linear(input_dim, 32),
                nn.BatchNorm1d(32),
                nn.LeakyReLU(0.1),
                nn.Linear(32, 16),
                nn.BatchNorm1d(16),
                nn.LeakyReLU(0.1),
                nn.Linear(16, latent_dim),
                nn.LeakyReLU(0.1)
            )
            # Decoder
            self.decoder = nn.Sequential(
                nn.Linear(latent_dim, 16),
                nn.BatchNorm1d(16),
                nn.LeakyReLU(0.1),
                nn.Linear(16, 32),
                nn.BatchNorm1d(32),
                nn.LeakyReLU(0.1),
                nn.Linear(32, input_dim)
            )

        def forward(self, x):
            z = self.encoder(x)
            recon = self.decoder(z)
            return recon


class AutoencoderDetector(BaseModel):
    """Deep Learning Autoencoder for reconstruction-based anomaly detection."""

    def __init__(self, artifacts_dir=ARTIFACTS_DIR):
        super().__init__(name="Autoencoder", model_type="reconstruction")
        self.artifacts_dir = artifacts_dir
        self.weights_path = os.path.join(self.artifacts_dir, "autoencoder_weights.pt")
        self.meta_path = os.path.join(self.artifacts_dir, "autoencoder_meta.json")
        self.is_available = TORCH_AVAILABLE
        self.device = torch.device("cpu") if TORCH_AVAILABLE else None
        self.model: Optional[nn.Module] = None
        self.threshold: float = 0.50
        self.input_dim: int = 23
        self.latent_dim: int = 8

        if self.is_available:
            self.load()

    def train(self, X, y=None, epochs: int = 25, batch_size: int = 64, lr: float = 0.003, **kwargs) -> Dict[str, Any]:
        """Trains Autoencoder on normal traffic representations."""
        if not self.is_available:
            return {"error": "PyTorch is not available", "is_available": False}

        t0 = time.time()
        self.input_dim = X.shape[1]
        self.model = AutoencoderNet(input_dim=self.input_dim, latent_dim=self.latent_dim).to(self.device)

        X_tensor = torch.tensor(X, dtype=torch.float32)
        dataset = TensorDataset(X_tensor)
        loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(self.model.parameters(), lr=lr, weight_decay=1e-5)

        self.model.train()
        losses = []
        for epoch in range(epochs):
            epoch_loss = 0.0
            for (batch_x,) in loader:
                batch_x = batch_x.to(self.device)
                optimizer.zero_grad()
                recon = self.model(batch_x)
                loss = criterion(recon, batch_x)
                loss.backward()
                optimizer.step()
                epoch_loss += loss.item() * len(batch_x)
            losses.append(epoch_loss / len(dataset))

        # Determine threshold on training data: mean + 2.5 * std of reconstruction error
        self.model.eval()
        with torch.no_grad():
            recons = self.model(X_tensor).numpy()
            sample_errors = np.mean((X - recons) ** 2, axis=1)
            mean_err = float(np.mean(sample_errors))
            std_err = float(np.std(sample_errors))
            self.threshold = float(mean_err + (2.5 * std_err))

        train_duration = round(time.time() - t0, 3)
        self.is_trained = True
        self.training_time = time.strftime("%Y-%m-%d %H:%M:%S")
        self.dataset_name = kwargs.get("dataset_name", "Normal IDS Traffic Baseline")
        self.metrics = {
            "training_duration_sec": train_duration,
            "samples_trained": int(len(X)),
            "epochs": epochs,
            "final_reconstruction_loss": round(float(losses[-1]), 5),
            "reconstruction_error_mean": round(mean_err, 5),
            "reconstruction_error_std": round(std_err, 5),
            "anomaly_threshold_mse": round(self.threshold, 5)
        }

        self.save()
        return self.metrics

    def predict(self, X) -> List[Dict[str, Any]]:
        """Calculates MSE reconstruction error per flow and flags anomalies exceeding threshold."""
        if not self.is_available:
            return [{
                "model": self.name,
                "prediction": "NORMAL",
                "anomaly_score": 0.0,
                "attack_type": None,
                "confidence": None,
                "explanation": ["PyTorch is not installed on this server."]
            } for _ in range(len(X))]

        if not self.is_trained or self.model is None:
            return [{
                "model": self.name,
                "prediction": "NORMAL",
                "anomaly_score": 0.0,
                "attack_type": None,
                "confidence": None,
                "explanation": ["Autoencoder model is not yet trained."]
            } for _ in range(len(X))]

        self.model.eval()
        with torch.no_grad():
            X_tensor = torch.tensor(X, dtype=torch.float32).to(self.device)
            recon = self.model(X_tensor).cpu().numpy()

        # Mean Squared Error per flow
        sample_errors = np.mean((X - recon) ** 2, axis=1)

        results = []
        for err in sample_errors:
            err_val = float(err)
            # Normalized score against threshold (sigmoid scaled)
            ratio = err_val / max(self.threshold, 1e-6)
            norm_score = float(1.0 / (1.0 + np.exp(-3.0 * (ratio - 1.0))))
            is_anomaly = err_val >= self.threshold

            explanation = []
            if is_anomaly:
                explanation.append(f"High neural reconstruction error: MSE {err_val:.4f} > baseline threshold {self.threshold:.4f}")
                explanation.append("Autoencoder latent representation failed to compress packet flow parameters")

            results.append({
                "model": self.name,
                "prediction": "ANOMALOUS" if is_anomaly else "NORMAL",
                "anomaly_score": round(norm_score, 3),
                "attack_type": "Reconstruction Anomaly" if is_anomaly else None,
                "confidence": round(norm_score if is_anomaly else (1.0 - norm_score), 3),
                "reconstruction_mse": round(err_val, 5),
                "threshold_mse": round(self.threshold, 5),
                "explanation": explanation
            })

        return results

    def save(self):
        if not self.is_available or not self.is_trained or self.model is None:
            return
        os.makedirs(self.artifacts_dir, exist_ok=True)
        torch.save(self.model.state_dict(), self.weights_path)
        with open(self.meta_path, "w") as f:
            json.dump({
                "input_dim": self.input_dim,
                "latent_dim": self.latent_dim,
                "threshold": self.threshold,
                "metrics": self.metrics,
                "is_trained": self.is_trained,
                "training_time": self.training_time,
                "dataset_name": self.dataset_name
            }, f, indent=2)

    def load(self) -> bool:
        if not self.is_available:
            return False
        if os.path.exists(self.weights_path) and os.path.exists(self.meta_path):
            try:
                with open(self.meta_path, "r") as f:
                    meta = json.load(f)
                self.input_dim = meta.get("input_dim", 23)
                self.latent_dim = meta.get("latent_dim", 8)
                self.threshold = meta.get("threshold", 0.50)
                self.metrics = meta.get("metrics", {})
                self.is_trained = meta.get("is_trained", False)
                self.training_time = meta.get("training_time")
                self.dataset_name = meta.get("dataset_name")

                self.model = AutoencoderNet(input_dim=self.input_dim, latent_dim=self.latent_dim).to(self.device)
                self.model.load_state_dict(torch.load(self.weights_path, map_location=self.device, weights_only=True))
                self.model.eval()
                return True
            except Exception as e:
                print(f"[AutoencoderDetector] Failed loading: {e}")
        return False
