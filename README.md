# NetShield AI — Real-Time Network Traffic Anomaly & Intrusion Detection System

**NetShield AI** is an enterprise-grade defensive network security monitoring application. It captures or simulates 5-tuple network flows, extracts standardized intrusion detection features, and evaluates traffic in real time using 4 distinct machine learning paradigms (Isolation Forest, Random Forest, XGBoost, and PyTorch Deep Autoencoders). Real-time telemetry, anomaly scoring, and defensive mitigation steps are delivered instantly via Socket.IO to a high-contrast dark navy cyber operations dashboard.

---

## Live Access Links

When the services are running on your machine:

- **Dashboard (Vite Dev Server)**: [http://localhost:5173](http://localhost:5173)
- **Dashboard (Production Single-Port Host)**: [http://localhost:5000](http://localhost:5000)
- **Node.js Express REST & Socket.IO API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Python FastAPI ML Detection Engine**: [http://localhost:5001/health](http://localhost:5001/health)
- **FastAPI Interactive Swagger Docs**: [http://localhost:5001/docs](http://localhost:5001/docs)

---

## Key Features

1. **Dual Traffic Collection Modes**:
   - **Mode A (Live Capture)**: Scapy sniffer listening on authorized network adapters via `psutil`. Aggregates packets into 5-tuple connection flows with TCP flags, durations, and byte rates.
   - **Mode B (Synthetic Simulation)**: Real-time high-fidelity traffic generator producing safe, labeled traffic for demonstrations:
     * *Normal Baseline* (Legitimate Web & DNS)
     * *DoS (Volumetric SYN Flood)*
     * *Port Scan (Sequential Probing)*
     * *Brute Force (SSH/RDP Probing)*
     * *Data Exfiltration (Heavy Asymmetric Outbound)*
     * *Mixed Organic Traffic*
2. **Standardized Feature Extraction Pipeline**:
   - Computes 19 numeric attributes matching the **CIC-IDS2017** and **UNSW-NB15** schemas (durations, packet rates, byte rates, packet size stats, TCP flags, and connection frequency).
   - Identical preprocessing pipeline (`StandardScaler` + protocol one-hot encoding) applied during training and live inference.
3. **Four Native Machine Learning Models**:
   - **Model 1: Isolation Forest** (Unsupervised partition depth anomaly scoring).
   - **Model 2: Random Forest** (Supervised multiclass classification with softmax probabilities).
   - **Model 3: XGBoost** (Gradient-boosted decision trees with multiclass logloss).
   - **Model 4: Autoencoder** (Deep neural network with PyTorch reconstruction loss thresholding).
4. **Real-Time Backend & Persistence**:
   - Node.js Express server with Socket.IO broadcasting telemetry every 1 second.
   - Native SQLite storage (`data/netshield.db`) using Node.js built-in `node:sqlite DatabaseSync` (zero C++ compilation prerequisites).
   - Rule-based defensive triage classifying alerts into **HIGH**, **MEDIUM**, and **LOW** severity with contextual mitigation steps.
5. **Seven Responsive Dashboard Pages**:
   - **Page 1: Live Dashboard** (Overview KPI cards, traffic volume charts, protocol breakdown, live feed).
   - **Page 2: Packet Inspection** (Searchable 5-tuple connection log with JSON detail modal).
   - **Page 3: Anomaly Detection Lab** (Interactive flow editor, preset loader, side-by-side comparison of all 4 models).
   - **Page 4: Alerts Center** (Incident inbox with severity filters and triage status updating).
   - **Page 5: Threat Intelligence** (Reputation query console with explicit unconfigured/offline status indicators).
   - **Page 6: Model Management** (Real validation metrics, F1 scores, latencies, and active model switching).
   - **Page 7: Reports & Audit** (Downloadable CSV/JSON reports and immutable operation audit logs).

---

## Project Structure

```
major project/
├── client/                     # React + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar, StatCard, StatusBadge, Modal
│   │   ├── pages/              # 7 Cyber Dashboard pages
│   │   ├── hooks/              # useSocket client hook
│   │   ├── services/           # REST API client
│   │   ├── App.jsx             # React Router routing
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                     # Node.js + Express + Socket.IO Backend
│   ├── src/
│   │   ├── db/                 # Native SQLite database initialization
│   │   ├── routes/             # REST API routes (health, dashboard, alerts, etc.)
│   │   ├── services/           # Alert policy, traffic buffer, audit logger, ML client
│   │   ├── sockets/            # Socket.IO dispatcher
│   │   ├── middleware/         # Error handler and rate limiter
│   │   └── index.js            # Express server entry point
│   └── package.json
├── ml-service/                 # Python FastAPI ML Detection Service
│   ├── app/
│   │   ├── capture/            # live_capture.py & traffic_simulator.py
│   │   ├── features/           # extractor.py (19 features + protocols)
│   │   ├── preprocessing/      # pipeline.py (scaler & encoder)
│   │   ├── models/             # Isolation Forest, Random Forest, XGBoost, Autoencoder
│   │   ├── training/           # dataset_loader.py & train.py
│   │   ├── config.py
│   │   └── main.py             # FastAPI REST endpoints
│   ├── artifacts/              # Serialized models (.joblib, .pt, .json)
│   ├── tests/                  # Pytest test suite
│   └── requirements.txt
├── data/
│   └── netshield.db            # SQLite persistent database
├── docs/
│   └── architecture.md
├── start-netshield.ps1         # PowerShell one-click launcher
├── package.json
└── README.md
```

---

## Installation & Setup

### Prerequisites
- **Node.js**: v20+ or v24+ (v24.22.1 LTS installed)
- **Python**: 3.11 or 3.12 (Python 3.12.15 installed in `ml-service/.venv`)
- **Npcap** *(Optional, for Mode A Live Capture)*: Installed in "WinPcap API-compatible mode" if sniffing physical Windows network adapters.

### 1. Python ML Service Setup
```powershell
# Create venv and install dependencies
cd ml-service
uv venv .venv --python 3.12
.venv\Scripts\activate
uv pip install -r requirements.txt

# Run initial training pipeline to fit scaler and train all 4 models
$env:PYTHONPATH = "ml-service"
.venv\Scripts\python -m app.training.train
```

### 2. Node.js Backend Setup
```powershell
cd server
npm install
```

### 3. Frontend Client Setup
```powershell
cd client
npm install
npm run build
```

---

## How to Run NetShield AI

### Option A: One-Click PowerShell Script
From the project root directory, run:
```powershell
.\start-netshield.ps1
```

### Option B: Running Individual Services

**Terminal 1 — Python ML Engine:**
```powershell
cd ml-service
$env:PYTHONPATH = "ml-service"
.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 5001
```

**Terminal 2 — Node.js Express Coordinator:**
```powershell
cd server
node src/index.js
```

**Terminal 3 — React Dashboard (Dev Mode):**
```powershell
cd client
npm run dev
```

Open **`http://localhost:5173`** or **`http://localhost:5000`** in your browser.

---

## How to Demonstrate a Simulated Anomaly

1. Open the dashboard at **`http://localhost:5173`**.
2. Look at the top bar or Live Operations Command deck:
   - Select **Scenario: DoS (SYN Flood)** or **Port Scan Probe**.
   - Click **Start Sim**.
3. Watch the real-time indicators:
   - **Mode Badge** switches to `SIMULATED` with an active pulsing indicator.
   - **Telemetry Chart** spikes in real time with high packet rates (`Pkts/sec`).
   - The **Live Packet Stream** displays incoming 5-tuple records labeled as `ANOMALOUS`.
   - The **Recent Security Alerts** card generates immediate incidents with defensive remediation instructions.
4. Navigate to **Alerts Center** (`/alerts`):
   - Click on the new alert to inspect contributing features and recommended defensive mitigations.
   - Click **Mark Reviewed** to update the incident triage status.
5. Navigate to **Anomaly Lab** (`/lab`):
   - Select the **DoS Volumetric SYN Flood** preset.
   - Click **Compare All 4 Models** to see how Isolation Forest, Random Forest, XGBoost, and the PyTorch Autoencoder simultaneously evaluate the exact same network flow.

---

## Testing

Run the automated test suite across all feature extraction routines and model inference contracts:

```powershell
$env:PYTHONPATH = "ml-service"
ml-service\.venv\Scripts\python.exe -m pytest ml-service/tests/test_features.py ml-service/tests/test_models.py -v
```

---

## Defensive Security Principles

- **No Active Countermeasures**: NetShield AI is strictly an observation, detection, and alerting system. It will never modify host firewall rules, block IP subnets, or sever network connections automatically.
- **Privacy Preservation**: Packet payload bodies are never retained in persistent database tables. Only 5-tuple connection summaries, protocol identifiers, and volumetric statistics are stored.
- **Data Integrity Guarantee**: Threat intelligence reputation scores and external datasets are never fabricated or simulated as genuine. Unconfigured services explicitly state `UNCONFIGURED`.

