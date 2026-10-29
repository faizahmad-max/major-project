"""
NetShield AI - FastAPI Machine Learning & Traffic Orchestration Service
Exposes REST endpoints for model inference, real-time live capture, and simulation controls.
"""

from typing import Dict, Any, List, Optional
import os
import json
import time
from collections import deque
import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.config import (
    ARTIFACTS_DIR, HOST, PORT, NODE_BACKEND_URL,
    DEFAULT_MODEL, CORS_ORIGINS
)
from app.preprocessing.pipeline import PreprocessingPipeline
from app.models.registry import ModelRegistry
from app.capture.traffic_simulator import TrafficSimulator
from app.capture.live_capture import LiveCaptureEngine
from app.training.train import run_training_pipeline

app = FastAPI(
    title="NetShield AI - ML Detection Service",
    description="Real-Time Network Traffic Anomaly & Intrusion Detection Service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
pipeline = PreprocessingPipeline(artifacts_dir=ARTIFACTS_DIR)
model_registry = ModelRegistry(pipeline=pipeline)
model_registry.set_active_model(DEFAULT_MODEL)

# Recent in-memory buffer of analyzed flows (max 500)
recent_flows = deque(maxlen=500)
http_client = httpx.AsyncClient(timeout=3.0)


async def handle_new_flow(flow: Dict[str, Any]):
    """Processes newly arrived flow through ML detection and delivers to Node.js backend."""
    try:
        # Run ML inference
        pred = model_registry.predict_flow(flow)

        enriched_flow = {
            **flow,
            "prediction": pred.get("prediction", "NORMAL"),
            "anomaly_score": pred.get("anomaly_score", 0.0),
            "attack_type": pred.get("attack_type"),
            "confidence": pred.get("confidence"),
            "explanation": pred.get("explanation", []),
            "model": pred.get("model", model_registry.active_model_name),
            "latency_ms": pred.get("inference_latency_ms", 0.0)
        }

        recent_flows.appendleft(enriched_flow)

        # Notify Node.js backend
        try:
            await http_client.post(f"{NODE_BACKEND_URL}/api/internal/flow", json=enriched_flow)
        except Exception:
            # Backend might not be running or polling instead
            pass

    except Exception as e:
        print(f"[handle_new_flow] Inference error: {e}")


# Initialize simulator & capture with callback
def sync_flow_callback(flow: Dict[str, Any]):
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(handle_new_flow(flow))
        else:
            loop.run_until_complete(handle_new_flow(flow))
    except RuntimeError:
        # Create a new loop in the worker thread
        asyncio.run(handle_new_flow(flow))


simulator = TrafficSimulator(on_flow_callback=sync_flow_callback)
live_capture = LiveCaptureEngine(on_flow_callback=sync_flow_callback)


# ----------------- Pydantic Models -----------------
class FlowInput(BaseModel):
    src_ip: Optional[str] = "192.168.1.100"
    dst_ip: Optional[str] = "10.0.0.1"
    src_port: Optional[int] = 49152
    dst_port: Optional[int] = 80
    protocol: Optional[str] = "TCP"
    duration: Optional[float] = 1.0
    packet_count: Optional[int] = 10
    byte_count: Optional[int] = 1024
    syn_count: Optional[int] = 1
    ack_count: Optional[int] = 9
    fin_count: Optional[int] = 1
    rst_count: Optional[int] = 0
    psh_count: Optional[int] = 2
    urg_count: Optional[int] = 0
    mean_packet_size: Optional[float] = 102.4
    std_packet_size: Optional[float] = 15.0
    min_packet_size: Optional[float] = 40.0
    max_packet_size: Optional[float] = 500.0
    packet_rate: Optional[float] = 10.0
    byte_rate: Optional[float] = 1024.0
    conn_frequency: Optional[float] = 1.0
    model_name: Optional[str] = None


class ModelSelectInput(BaseModel):
    name: str


class SimulationStartInput(BaseModel):
    scenario: Optional[str] = "normal"
    speed: Optional[float] = 2.0


class CaptureStartInput(BaseModel):
    interface_name: Optional[str] = None


# ----------------- API Endpoints -----------------
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "NetShield AI ML Service",
        "active_model": model_registry.active_model_name,
        "is_preprocessing_fitted": pipeline.is_fitted,
        "simulator_status": simulator.get_status(),
        "capture_status": live_capture.get_status(),
        "timestamp": time.time()
    }


@app.get("/models")
def list_models():
    return {
        "active_model": model_registry.active_model_name,
        "models": model_registry.list_models()
    }


@app.post("/models/select")
def select_model(body: ModelSelectInput):
    success = model_registry.set_active_model(body.name)
    if not success:
        raise HTTPException(status_code=400, detail=f"Model '{body.name}' not found.")
    return {"message": f"Active model set to {body.name}", "active_model": body.name}


@app.get("/models/performance")
def get_performance():
    history_file = os.path.join(ARTIFACTS_DIR, "training_history.json")
    latest_file = os.path.join(ARTIFACTS_DIR, "latest_evaluation.json")

    latest = {}
    history = []
    if os.path.exists(latest_file):
        try:
            with open(latest_file, "r") as f:
                latest = json.load(f)
        except Exception:
            pass

    if os.path.exists(history_path := history_file):
        try:
            with open(history_path, "r") as f:
                history = json.load(f)
        except Exception:
            pass

    return {
        "latest": latest,
        "history": history,
        "active_model": model_registry.active_model_name,
        "available_models": model_registry.list_models()
    }


@app.post("/models/train")
def train_models(background_tasks: BackgroundTasks):
    """Triggers ML training across all models."""
    def task():
        try:
            run_training_pipeline()
            # Reload pipeline and models
            pipeline._load_artifacts_if_exist()
            for m in model_registry.models.values():
                m.load()
        except Exception as e:
            print(f"[train_models] Background error: {e}")

    background_tasks.add_task(task)
    return {"message": "Model training initiated in background."}


@app.post("/predict")
def predict_flow(flow_in: FlowInput):
    """Evaluates flow with active or requested model."""
    flow_dict = flow_in.dict()
    model_name = flow_dict.pop("model_name", None)
    res = model_registry.predict_flow(flow_dict, model_name=model_name)
    return res


@app.post("/predict/compare")
def compare_all_models(flow_in: FlowInput):
    """Evaluates flow across all 4 detection models for comparison."""
    flow_dict = flow_in.dict()
    flow_dict.pop("model_name", None)
    res = model_registry.predict_all_models(flow_dict)
    return res


# ----------------- Capture & Simulation Endpoints -----------------
@app.get("/capture/interfaces")
def get_interfaces():
    return {"interfaces": LiveCaptureEngine.get_interfaces()}


@app.post("/capture/start")
def start_capture(body: CaptureStartInput):
    if simulator.is_running:
        simulator.stop()
    status = live_capture.start(body.interface_name)
    return status


@app.post("/capture/stop")
def stop_capture():
    status = live_capture.stop()
    return status


@app.get("/capture/status")
def get_capture_status():
    return live_capture.get_status()


@app.post("/simulation/start")
def start_simulation(body: SimulationStartInput):
    if live_capture.is_capturing:
        live_capture.stop()
    status = simulator.start(scenario=body.scenario or "normal", speed=body.speed or 2.0)
    return status


@app.post("/simulation/stop")
def stop_simulation():
    status = simulator.stop()
    return status


@app.get("/simulation/status")
def get_simulation_status():
    return simulator.get_status()


@app.get("/traffic/stream")
def get_traffic_stream(limit: int = 50):
    """Returns recent analyzed flows from memory buffer."""
    flows = list(recent_flows)[:limit]
    return {
        "flows": flows,
        "count": len(flows),
        "active_mode": "LIVE" if live_capture.is_capturing else ("SIMULATED" if simulator.is_running else "IDLE")
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=False)

