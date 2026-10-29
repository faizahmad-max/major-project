# NetShield AI — Architectural Blueprint

```mermaid
flowchart TD
    subgraph DataCollection["Data Collection Layer"]
        A1["Authorized Network Interface (Scapy + Npcap)"] -->|Mode A: Live Capture| PcapEngine["Packet Aggregator Engine"]
        A2["Synthetic Flow Engine (Scenario Generator)"] -->|Mode B: Synthetic Flows| PcapEngine
    end

    subgraph FeaturePipeline["Feature Extraction & Preprocessing"]
        PcapEngine --> FE["Feature Extractor (19 Numeric Features + Protocols)"]
        FE --> PP["Preprocessing Pipeline (Fitted Scaler & Label Encoding)"]
    end

    subgraph MLEngine["Python FastAPI ML Detection Service (:5001)"]
        PP --> MR["Model Registry & Orchestrator"]
        MR --> M1["Model 1: Isolation Forest (Unsupervised)"]
        MR --> M2["Model 2: Random Forest (Multiclass Supervised)"]
        MR --> M3["Model 3: XGBoost (Gradient Boosted Trees)"]
        MR --> M4["Model 4: Autoencoder (PyTorch Deep Reconstruction)"]
    end

    subgraph BackendLayer["Node.js Express & Real-Time Hub (:5000)"]
        M1 & M2 & M3 & M4 --> Webhook["POST /api/internal/flow"]
        Webhook --> AS["Alert Evaluation Engine (Severity & Remediation)"]
        Webhook --> TB["Traffic Flow Ring Buffer & Batch Flusher"]
        AS --> SQLite[("SQLite Persistent Storage (netshield.db)")]
        TB --> SQLite
        AS --> SIO["Socket.IO Server"]
        TB --> SIO
    end

    subgraph PresentationLayer["React Vite Cyber Dashboard (:5173 / :5000)"]
        SIO -->|Real-Time Telemetry| Page1["1. Live Operations Dashboard"]
        SIO -->|New Incidents| Page4["4. Alerts & Triage Center"]
        REST["REST API Client"] --> Page2["2. Deep Packet Inspection"]
        REST --> Page3["3. Anomaly Detection & Comparison Lab"]
        REST --> Page5["5. Threat Intelligence (Unconfigured State)"]
        REST --> Page6["6. Model Management & Benchmarks"]
        REST --> Page7["7. Security Reports & Audit Ledger"]
    end
```

## System Responsibilities & Boundaries

1. **Python ML Engine (`ml-service/`, port 5001)**:
   - Manages packet sniffing via Scapy and psutil adapter enumeration.
   - Houses the multi-scenario traffic generator (`traffic_simulator.py`).
   - Extracts 19 standardized network flow features (conforming to CIC-IDS2017 & UNSW-NB15 schemas).
   - Preprocessing pipeline ensures identical numeric scaling and one-hot protocol alignment across training and live inference.
   - Houses all 4 detection engines: Isolation Forest, Random Forest, XGBoost, and PyTorch Autoencoder.

2. **Node.js Express Coordinator (`server/`, port 5000)**:
   - Coordinates REST APIs, security headers, rate limiting, and client sessions.
   - Evaluates alerts based on anomaly scores, attack categories, and investigation playbooks.
   - Emits bounded, batched WebSocket updates via Socket.IO to avoid UI thread saturation.
   - Native SQLite synchronization using Node.js standard `node:sqlite DatabaseSync`.
   - Serves the compiled React production bundle for single-port deployments.

3. **React Dashboard (`client/`, port 5173 or port 5000)**:
   - Modern, high-contrast dark navy UI (`#060a12`) with cyan (`#06b6d4`) and amber accents.
   - 7 responsive security pages for real-time operations, forensic inspection, comparative lab analysis, alert triage, threat intelligence, model management, and exportable audit reports.

