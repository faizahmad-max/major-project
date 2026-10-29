"""
Unit tests for NetShield AI ML Model Inference & Contract Adherence
"""

import pytest
import numpy as np
from app.preprocessing.pipeline import PreprocessingPipeline
from app.models.registry import ModelRegistry


@pytest.fixture(scope="module")
def pipeline():
    p = PreprocessingPipeline()
    assert p.is_fitted
    return p


@pytest.fixture(scope="module")
def registry(pipeline):
    return ModelRegistry(pipeline=pipeline)


def test_isolation_forest_prediction(registry):
    flow = {
        "src_ip": "192.168.1.10",
        "dst_ip": "8.8.8.8",
        "src_port": 50000,
        "dst_port": 53,
        "protocol": "UDP",
        "duration": 0.05,
        "packet_count": 2,
        "byte_count": 150
    }
    res = registry.predict_flow(flow, model_name="Isolation Forest")

    assert res["model"] == "Isolation Forest"
    assert res["prediction"] in ["NORMAL", "ANOMALOUS"]
    assert 0.0 <= res["anomaly_score"] <= 1.0
    assert "inference_latency_ms" in res


def test_random_forest_prediction(registry):
    # Simulated SYN flood DoS flow
    dos_flow = {
        "src_ip": "10.0.0.99",
        "dst_ip": "10.0.0.5",
        "src_port": 45000,
        "dst_port": 80,
        "protocol": "TCP",
        "duration": 0.02,
        "packet_count": 500,
        "byte_count": 30000,
        "syn_count": 500,
        "ack_count": 0,
        "packet_rate": 25000.0,
        "conn_frequency": 300.0
    }
    res = registry.predict_flow(dos_flow, model_name="Random Forest")

    assert res["model"] == "Random Forest"
    assert res["prediction"] == "ANOMALOUS"
    assert res["attack_type"] == "DoS"
    assert res["confidence"] > 0.5


def test_xgboost_prediction(registry):
    flow = {
        "src_ip": "192.168.1.20",
        "dst_ip": "1.1.1.1",
        "src_port": 51000,
        "dst_port": 443,
        "protocol": "TCP",
        "duration": 1.2,
        "packet_count": 20,
        "byte_count": 4000
    }
    res = registry.predict_flow(flow, model_name="XGBoost")

    assert res["model"] == "XGBoost"
    assert res["prediction"] in ["NORMAL", "ANOMALOUS"]
    assert 0.0 <= res["anomaly_score"] <= 1.0


def test_autoencoder_prediction(registry):
    flow = {
        "src_ip": "192.168.1.20",
        "dst_ip": "1.1.1.1",
        "src_port": 51000,
        "dst_port": 443,
        "protocol": "TCP",
        "duration": 1.2,
        "packet_count": 20,
        "byte_count": 4000
    }
    res = registry.predict_flow(flow, model_name="Autoencoder")

    assert res["model"] == "Autoencoder"
    assert res["prediction"] in ["NORMAL", "ANOMALOUS"]
    assert "reconstruction_mse" in res


def test_predict_all_models_comparison(registry):
    flow = {
        "src_ip": "192.168.1.20",
        "dst_ip": "1.1.1.1",
        "src_port": 51000,
        "dst_port": 443,
        "protocol": "TCP",
        "duration": 1.0,
        "packet_count": 10,
        "byte_count": 1000
    }
    comp = registry.predict_all_models(flow)

    assert "Isolation Forest" in comp
    assert "Random Forest" in comp
    assert "XGBoost" in comp
    assert "Autoencoder" in comp

