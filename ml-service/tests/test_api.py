"""
Integration tests for NetShield AI FastAPI Endpoints
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "active_model" in data
    assert data["is_preprocessing_fitted"] is True


def test_list_models(client):
    response = client.get("/models")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert len(data["models"]) >= 4


def test_model_selection(client):
    response = client.post("/models/select", json={"name": "Isolation Forest"})
    assert response.status_code == 200
    assert response.json()["active_model"] == "Isolation Forest"


def test_predict_endpoint(client):
    payload = {
        "src_ip": "10.0.0.100",
        "dst_ip": "10.0.0.1",
        "src_port": 12345,
        "dst_port": 80,
        "protocol": "TCP",
        "duration": 0.5,
        "packet_count": 50,
        "byte_count": 2500,
        "model_name": "Random Forest"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["model"] == "Random Forest"
    assert "prediction" in data
    assert "anomaly_score" in data


def test_predict_compare_endpoint(client):
    payload = {
        "src_ip": "10.0.0.100",
        "dst_ip": "10.0.0.1",
        "src_port": 12345,
        "dst_port": 80,
        "protocol": "TCP",
        "duration": 0.5,
        "packet_count": 50,
        "byte_count": 2500
    }
    response = client.post("/predict/compare", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "Isolation Forest" in data
    assert "Random Forest" in data
    assert "XGBoost" in data
    assert "Autoencoder" in data


def test_simulation_controls(client):
    start_res = client.post("/simulation/start", json={"scenario": "port_scan", "speed": 5.0})
    assert start_res.status_code == 200
    assert start_res.json()["is_running"] is True
    assert start_res.json()["current_scenario"] == "port_scan"

    status_res = client.get("/simulation/status")
    assert status_res.status_code == 200
    assert status_res.json()["is_running"] is True

    stop_res = client.post("/simulation/stop")
    assert stop_res.status_code == 200
    assert stop_res.json()["is_running"] is False

