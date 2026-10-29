"""
NetShield AI - Comprehensive Project Report Generator
Creates a publication-quality PDF report explaining the entire project in simple language.
"""

import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    """Canvas that computes total pages dynamically for 'Page X of Y' footer."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Skip running header/footer on cover/title page
        if self._pageNumber > 1:
            # Header
            self.drawString(54, 11 * inch - 36, "NetShield AI — System Architecture & Implementation Report")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)

            # Footer
            self.line(54, 45, 8.5 * inch - 54, 45)
            self.drawString(54, 32, "Confidential & Academic Presentation Guide — Defensive IDS System")
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(8.5 * inch - 54, 32, page_text)

        self.restoreState()


def build_pdf(filename="NetShield_AI_Complete_Project_Report.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    c_navy = colors.HexColor("#0f172a")
    c_blue = colors.HexColor("#0284c7")
    c_slate = colors.HexColor("#334155")
    c_light = colors.HexColor("#f8fafc")
    c_border = colors.HexColor("#e2e8f0")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=c_navy,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=c_blue,
        spaceAfter=15
    )

    meta_style = ParagraphStyle(
        'Meta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=c_navy,
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=c_blue,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=c_slate,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_slate,
        leftIndent=15,
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=c_navy
    )

    qa_q_style = ParagraphStyle(
        'QA_Q',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=c_navy,
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    )

    qa_a_style = ParagraphStyle(
        'QA_A',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_slate,
        leftIndent=10,
        spaceAfter=6
    )

    story = []

    # ------------------ COVER / TITLE ------------------
    story.append(Paragraph("NetShield AI — System Architecture & Project Report", title_style))
    story.append(Paragraph("AI-Powered Real-Time Network Traffic Anomaly & Intrusion Detection System", subtitle_style))
    story.append(Paragraph("<b>Author / Presenter:</b> Developer & Security Researcher &nbsp;|&nbsp; <b>Stack:</b> React, Node.js, Python FastAPI, PyTorch, Scikit-learn, Scapy, SQLite &nbsp;|&nbsp; <b>Date:</b> October 2026", meta_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_blue, spaceAfter=14))

    # ------------------ 1. EXECUTIVE SUMMARY ------------------
    story.append(Paragraph("1. Executive Summary (The Elevator Pitch)", h1_style))
    story.append(Paragraph(
        "<b>In plain English:</b> Imagine a digital security guard watching all the internet and network traffic entering a company. "
        "Normal network guards (traditional firewalls) only check rules they already know—like an address blacklist. "
        "If a hacker creates a brand new, subtle attack, old tools miss it. "
        "<b>NetShield AI</b> is different: it uses <b>Machine Learning (Artificial Intelligence)</b> to learn what normal everyday traffic looks like. "
        "When traffic starts acting weird—such as an attacker silently scanning for open doors, bombarding a server with half-open connections, "
        "or leaking sensitive data outside—NetShield AI catches it within milliseconds, calculates a threat score, and generates an alert "
        "on a live cybersecurity dashboard without slowing down the network.",
        body_style
    ))

    # Summary Table
    summary_data = [
        [Paragraph("<b>Component</b>", body_style), Paragraph("<b>Technology Used</b>", body_style), Paragraph("<b>Simple Role in the Project</b>", body_style)],
        [Paragraph("<b>Frontend UI</b>", body_style), Paragraph("React, Vite, Tailwind CSS, Recharts", body_style), Paragraph("Real-time Cyber Operations Center (Dashboard) with charts, filters, and alerts.", body_style)],
        [Paragraph("<b>Backend Hub</b>", body_style), Paragraph("Node.js, Express, Socket.IO", body_style), Paragraph("Coordinates APIs, pushes instant live updates via WebSockets, and enforces alert rules.", body_style)],
        [Paragraph("<b>Database</b>", body_style), Paragraph("Native Node.js SQLite (netshield.db)", body_style), Paragraph("Lightweight, zero-setup database storing connection logs, alerts, and audit trails.", body_style)],
        [Paragraph("<b>AI / ML Engine</b>", body_style), Paragraph("Python, FastAPI, Scikit-learn, XGBoost, PyTorch", body_style), Paragraph("Brains of the system: extracts 19 network features and runs 4 distinct AI models.", body_style)],
        [Paragraph("<b>Traffic Capture</b>", body_style), Paragraph("Scapy & Synthetic Generator", body_style), Paragraph("Listens to real network cards or injects safe, realistic simulated attacks.", body_style)]
    ]
    t_summary = Table(summary_data, colWidths=[1.3 * inch, 2.3 * inch, 3.4 * inch])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 12))

    # ------------------ 2. HOW THE WHOLE SYSTEM WORKS ------------------
    story.append(Paragraph("2. End-to-End System Architecture (How Everything Connects)", h1_style))
    story.append(Paragraph(
        "NetShield AI works through a clean 7-step pipeline where each technology has a single, well-defined job:",
        body_style
    ))

    steps = [
        ("Step 1: Traffic Ingestion", "Packets arrive either from physical network cards via Scapy (Mode A) or from the built-in Synthetic Generator (Mode B)."),
        ("Step 2: Feature Extraction", "Raw bytes are turned into a structured 19-number 'fingerprint' (calculating packet rates, flag counts, byte volume, and connection duration)."),
        ("Step 3: Preprocessing", "Data is scaled and normalized using our fitted StandardScaler so large numbers (like byte counts) don't overpower small numbers (like durations)."),
        ("Step 4: AI Model Evaluation", "The flow vector is evaluated by the selected ML Model (Isolation Forest, Random Forest, XGBoost, or PyTorch Autoencoder)."),
        ("Step 5: Node.js Coordination", "The ML prediction and anomaly score are sent to the Node.js backend via an internal webhook (/api/internal/flow)."),
        ("Step 6: Storage & Alert Policy", "Node.js saves the record in SQLite and checks if the score exceeds the threshold. If dangerous, a high-severity alert is created."),
        ("Step 7: Live WebSocket Push", "Socket.IO emits an event to the React Dashboard. The screen updates instantly—no page refresh needed!")
    ]
    for title, desc in steps:
        story.append(Paragraph(f"• <b>{title}:</b> {desc}", bullet_style))

    story.append(Spacer(1, 10))

    # ------------------ 3. TRAFFIC INGESTION ------------------
    story.append(Paragraph("3. Traffic Ingestion: Two Operational Modes", h1_style))
    story.append(Paragraph(
        "A real Intrusion Detection System must handle both real environments and presentation demonstrations safely:",
        body_style
    ))
    story.append(Paragraph(
        "<b>Mode A: Live Packet Capture (Scapy + psutil):</b><br/>"
        "NetShield AI queries your computer's network cards (Wi-Fi, Ethernet, loopback). An administrator selects an adapter, and Scapy "
        "sniffs live packets. It parses IP addresses, source/destination ports, protocol headers (TCP/UDP/ICMP), and TCP flags. "
        "To protect privacy, <b>NetShield AI never records or stores private packet payloads</b>—only header metadata is analyzed.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Mode B: Synthetic Traffic Generator (Safe & Demonstration-Ready):</b><br/>"
        "In many presentation rooms or lab laptops, sniffing raw physical traffic is restricted by permissions. "
        "We built a realistic synthetic flow engine that produces genuine network patterns for 6 scenarios: "
        "1) <i>Normal Baseline</i>, 2) <i>Volumetric DoS SYN Flood</i>, 3) <i>Sequential Port Scan</i>, 4) <i>SSH/RDP Brute Force</i>, "
        "5) <i>Heavy Data Exfiltration</i>, and 6) <i>Mixed Organic Traffic</i>. "
        "These simulated flows pass through the exact same feature extraction and ML pipelines as real packets!",
        body_style
    ))

    story.append(Spacer(1, 10))

    # ------------------ 4. THE 19 FEATURES ------------------
    story.append(Paragraph("4. The 19 Features: How Raw Packets Become Math", h1_style))
    story.append(Paragraph(
        "Machine learning models cannot read raw packet bytes directly. They need numbers. "
        "NetShield AI converts packets into 5-tuple flow records matching the international <b>CIC-IDS2017 & UNSW-NB15</b> standard benchmarks:",
        body_style
    ))

    feat_data = [
        [Paragraph("<b>Feature Category</b>", body_style), Paragraph("<b>Features Extracted</b>", body_style), Paragraph("<b>Why It Matters (Simple Explanation)</b>", body_style)],
        [Paragraph("Time & Duration", body_style), Paragraph("duration, flow_start, flow_end", body_style), Paragraph("Attacks like DoS or port scans last a fraction of a second; exfiltration lasts minutes.", body_style)],
        [Paragraph("Volume & Size", body_style), Paragraph("packet_count, byte_count, mean_size, std_size, min_size, max_size", body_style), Paragraph("DoS packets are tiny (54-64 bytes) and identical; normal browsing has varying sizes.", body_style)],
        [Paragraph("Velocity & Rates", body_style), Paragraph("packet_rate (pkts/sec), byte_rate (bytes/sec)", body_style), Paragraph("Humans click 5-10 times/sec; a DoS attack sends 10,000+ packets/sec.", body_style)],
        [Paragraph("TCP Protocol Flags", body_style), Paragraph("syn_count, ack_count, fin_count, rst_count, psh_count, urg_count", body_style), Paragraph("A normal TCP handshake has balanced SYN and ACK. A SYN flood has hundreds of SYNs and 0 ACKs.", body_style)],
        [Paragraph("Behavioral & Port", body_style), Paragraph("is_well_known_port, conn_frequency, protocol (TCP/UDP/ICMP)", body_style), Paragraph("Port scans probe random high numbers (40000+); legitimate web visits port 80 or 443.", body_style)]
    ]
    t_feat = Table(feat_data, colWidths=[1.4 * inch, 2.3 * inch, 3.3 * inch])
    t_feat.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_feat)

    story.append(PageBreak())

    # ------------------ 5. THE 4 ML MODELS ------------------
    story.append(Paragraph("5. The Four Machine Learning Models (Explained Simply)", h1_style))
    story.append(Paragraph(
        "Different cyber attacks behave differently. That's why NetShield AI includes <b>4 distinct algorithms</b> "
        "behind a common prediction interface. Here is how each one works in simple terms:",
        body_style
    ))

    story.append(Paragraph("Model 1: Isolation Forest (Unsupervised Outlier Detector)", h2_style))
    story.append(Paragraph(
        "• <b>How it works:</b> Imagine a room full of 1,000 normal students and 1 person wearing an astronaut suit. "
        "If you ask random questions to separate people, it takes 15 questions to isolate a normal student, but just 1 question to isolate the astronaut. "
        "Isolation Forest randomly slices data features. Weird (anomalous) points get isolated very quickly (shallow tree depth), giving them a high anomaly score.<br/>"
        "• <b>Superpower:</b> It requires <i>no attack labels</i>. It can detect zero-day (never-before-seen) attacks purely because they don't look normal.",
        body_style
    ))

    story.append(Paragraph("Model 2: Random Forest (Supervised Classification)", h2_style))
    story.append(Paragraph(
        "• <b>How it works:</b> A committee of 100 decision trees. Each tree was trained on labeled network attacks (Benign, DoS, PortScan, BruteForce, Exfiltration). "
        "When a new connection arrives, all 100 trees vote. If 98 trees vote 'DoS' and 2 vote 'Benign', the prediction is DoS with 98% confidence.<br/>"
        "• <b>Superpower:</b> High accuracy, very fast inference (&lt;0.1 milliseconds), and provides exact attack category names.",
        body_style
    ))

    story.append(Paragraph("Model 3: XGBoost (Gradient Boosted Trees)", h2_style))
    story.append(Paragraph(
        "• <b>How it works:</b> Unlike Random Forest where trees work independently, XGBoost builds trees sequentially. "
        "Tree #2 focuses specifically on the subtle mistakes Tree #1 made. Tree #3 focuses on what Tree #2 missed. "
        "They combine into an ultra-sharp mathematical classifier.<br/>"
        "• <b>Superpower:</b> World-class benchmark performance on tabular flow metrics and resistant to noise.",
        body_style
    ))

    story.append(Paragraph("Model 4: PyTorch Deep Autoencoder (Neural Reconstruction)", h2_style))
    story.append(Paragraph(
        "• <b>How it works:</b> An Artificial Neural Network (Deep Learning). It acts like an extreme zip file compressor. "
        "We train it <i>only on normal network traffic</i>. It learns to compress 23 network features into a tiny 8-dimension bottleneck, "
        "and then decode them back to 23 features with near-zero error.<br/>"
        "When an attack enters, the neural network tries to compress it—but because it never learned attack patterns, "
        "it fails to reconstruct the data. The resulting <b>Reconstruction Error (Mean Squared Error)</b> spikes dramatically above our baseline threshold, sounding the alarm!<br/>"
        "• <b>Superpower:</b> Deep neural understanding of multi-dimensional traffic relationships.",
        body_style
    ))

    story.append(Spacer(1, 10))

    # ------------------ 6. REAL-TIME TECH STACK ------------------
    story.append(Paragraph("6. Real-Time Architecture: Node.js, Socket.IO & Native SQLite", h1_style))
    story.append(Paragraph(
        "Many AI projects are slow Python scripts with static web pages. NetShield AI is built as a true <b>real-time system</b>:",
        body_style
    ))
    story.append(Paragraph(
        "• <b>Microservice Separation:</b> Python runs independently on port 5001 dedicated to heavy math and packet sniffing. "
        "Node.js runs on port 5000 managing client connections, APIs, and WebSockets. If the ML model is busy, user dashboards never freeze.<br/>"
        "• <b>Socket.IO Push Technology:</b> Traditional websites require you to press 'Refresh' to see new data. "
        "NetShield AI uses persistent bidirectional WebSockets. When a packet is flagged as an anomaly, the server pushes the event to the browser instantly within 5 milliseconds.<br/>"
        "• <b>Native Node.js SQLite:</b> We use the new, built-in <code>node:sqlite DatabaseSync</code> module in Node.js 24. "
        "This provides true disk-persisted relational database storage (<code>netshield.db</code>) with zero external C++ compile headaches.",
        body_style
    ))

    story.append(Spacer(1, 10))

    # ------------------ 7. THE 7 DASHBOARD PAGES ------------------
    story.append(Paragraph("7. The 7 Dashboard Pages (What You Show in the Presentation)", h1_style))
    story.append(Paragraph(
        "The frontend is styled as an authentic Enterprise Security Operations Center (SOC) dashboard. Here is what each screen does:",
        body_style
    ))

    pages = [
        ("1. Operations Center (Live Dashboard)", "The main screen. Shows KPI stat cards (total flows, benign count, anomaly count), a live dual-axis area chart (packets/sec and KB/s throughput), L4 protocol distribution bar chart, and a live rolling packet feed."),
        ("2. Flow Telemetry (Packet Inspection)", "A forensic table like Wireshark/Zeek. Search and filter by IP, port, or protocol. Clicking any row opens a 3-column drawer showing exact TCP flags, durations, and raw JSON descriptors."),
        ("3. Anomaly Lab (Detection Workbench)", "The interactive testing sandbox. Pick pre-configured attack presets or edit flow parameters manually. Click 'Run Selected' or 'Compare All 4 Models' to see a side-by-side decision matrix."),
        ("4. Alerts & Triage Center", "The incident response queue. Shows alerts grouped by severity (High, Medium, Low) and MITRE ATT&CK tags. Analysts can click 'Triage In-Progress', 'Resolve Incident', or 'False Positive'."),
        ("5. Threat Intelligence Feeds", "Shows external threat connectors (AbuseIPDB, VirusTotal, AlienVault OTX). Accurately reports 'UNCONFIGURED' when no API key is supplied (honesty policy: no fake numbers)."),
        ("6. Model Registry & MLOps", "Displays all 4 AI engines with real evaluated metrics (Precision, Recall, F1-Score, False Positive Rate, and latency). Allows hot-swapping the active engine with 1 click."),
        ("7. Audit & Compliance Reports", "Allows downloading complete CSV or JSON reports of all alerts and connection flows. Displays an immutable audit ledger of every administrator action.")
    ]
    for p_name, p_desc in pages:
        story.append(Paragraph(f"• <b>{p_name}:</b> {p_desc}", bullet_style))

    story.append(PageBreak())

    # ------------------ 8. PRESENTATION DEMO GUIDE ------------------
    story.append(Paragraph("8. Step-by-Step Live Presentation Script", h1_style))
    story.append(Paragraph(
        "When it is your turn to present your project to professors, judges, or evaluators, follow this exact 3-minute sequence:",
        body_style
    ))

    demo_steps = [
        ("Minute 1: The Overview", "Open the dashboard at <b>http://localhost:5173</b>. Point out the top bar: 'This is NetShield AI, an AI-powered intrusion detection system. Notice the live status bar showing the ML pipeline is active and streaming.' Show the 4 KPI cards and explain how incoming packets are analyzed in real time."),
        ("Minute 2: Injecting an Attack", "In the top bar, change the scenario dropdown from 'Normal Baseline' to <b>'DoS SYN Flood'</b> and click <b>'Inject'</b>. Point to the screen: 'Watch the real-time chart spike immediately. Notice the live packet feed turning red with ANOMALY verdicts. Within milliseconds, the system detected a volumetric surge with unbalanced SYN flags.'"),
        ("Minute 3: Incident Triage & Forensic Inspection", "Click on <b>'Alerts & Triage'</b> on the sidebar. Show the new alert: 'The system classified this as DoS under MITRE ATT&CK T1498 with 100% confidence. It also gives the defensive engineer remediation guidance.'"),
        ("Bonus Minute: The Anomaly Lab", "Navigate to <b>'Anomaly Lab'</b>. Click <b>'Compare All 4 Models'</b>. Explain: 'Here you can see our 4 distinct AI paradigms—Isolation Forest, Random Forest, XGBoost, and the PyTorch Deep Autoencoder—evaluating the exact same network flow simultaneously.' This always impresses evaluators!")
    ]
    for d_title, d_text in demo_steps:
        story.append(Paragraph(f"<b>{d_title}:</b> {d_text}", body_style))

    story.append(Spacer(1, 10))

    # ------------------ 9. VIVA / EVALUATION Q&A ------------------
    story.append(Paragraph("9. Viva & Presentation Q&A Cheat Sheet (Top 10 Questions)", h1_style))
    story.append(Paragraph(
        "Here are the most common technical questions evaluators ask, along with the exact simple answers to give:",
        body_style
    ))

    qas = [
        ("Q1: What is the difference between a traditional firewall and your AI IDS?",
         "Traditional firewalls use static signature rules (like 'block IP X' or 'drop port 23'). They cannot detect new, unknown attacks. NetShield AI uses machine learning to understand behavioral patterns, allowing it to catch zero-day anomalies and unknown deviations."),

        ("Q2: Why do you have four different machine learning models instead of just one?",
         "Because in cybersecurity, there is no single silver bullet. Isolation Forest and Autoencoders are unsupervised—they detect brand-new, never-before-seen anomalies without needing labels. Random Forest and XGBoost are supervised—they provide high accuracy and exact attack category classification. Having all four allows comparative validation."),

        ("Q3: How does the PyTorch Autoencoder detect an attack?",
         "An Autoencoder is trained only on normal traffic to compress and reconstruct it. When attack traffic passes through, the neural network fails to reconstruct the unfamiliar patterns, causing the Reconstruction Error (MSE) to spike above our baseline threshold."),

        ("Q4: How do you handle packet privacy?",
         "NetShield AI strictly inspects packet headers (IPs, ports, protocols, TCP flags, packet lengths). We deliberately never store or inspect application payloads (body content), ensuring compliance with privacy standards and encryption protocols like HTTPS."),

        ("Q5: How does real-time communication work without page refreshes?",
         "We implemented WebSockets using Socket.IO on Node.js. Whenever Python analyzes a flow and pushes it to Node.js, the backend emits a WebSocket event that updates the React state instantly within 5 milliseconds."),

        ("Q6: How do you prevent WebSockets from crashing the browser during a massive DoS attack?",
         "We implemented bounded ring buffers (500 items max in memory) and rate-limited batching. Telemetry summaries are throttled to 1-second intervals so the browser never experiences UI thread freezing or memory overflow."),

        ("Q7: What dataset did you train the models on?",
         "We used a curated dataset conforming strictly to the international CIC-IDS2017 & UNSW-NB15 flow schema, covering Benign traffic, Volumetric DoS, Port Scanning, SSH/RDP Brute Force, and Data Exfiltration. We used an 80/20 stratified split with zero data leakage."),

        ("Q8: Why did you use native SQLite in Node.js instead of MongoDB or MySQL?",
         "Node.js 24 introduced a native built-in SQLite engine (node:sqlite DatabaseSync). It requires zero external database installation, zero native C++ compiler setup, persists data directly to a local disk file (netshield.db), and executes queries in microseconds."),

        ("Q9: What happens if live packet sniffing permissions are missing on Windows?",
         "On Windows, raw packet sniffing requires the Npcap driver. If Npcap is missing, NetShield AI gracefully informs the user with an actionable error notice, and allows full seamless switching to Mode B (Synthetic Traffic Generator) so detection and live demonstrations still work 100%."),

        ("Q10: Does NetShield AI automatically block IP addresses or modify firewalls?",
         "No. NetShield AI is deliberately designed as a defensive monitoring, detection, and alerting system. In enterprise environments, automatic blocking can accidentally shut down critical legitimate business services (False Positives). Instead, it provides calculated severity scores and recommended defensive playbooks for human engineers.")
    ]

    for q, a in qas:
        story.append(Paragraph(q, qa_q_style))
        story.append(Paragraph(f"<b>Answer:</b> {a}", qa_a_style))

    # Build the PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated project report PDF at: {filename}")


if __name__ == "__main__":
    out_pdf = os.path.join(os.path.dirname(os.path.abspath(__file__)), "NetShield_AI_Complete_Project_Report.pdf")
    build_pdf(out_pdf)

