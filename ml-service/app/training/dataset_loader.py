"""
NetShield AI - Dataset Loader & Preprocessing
Loads either a public intrusion dataset (CIC-IDS2017 / UNSW-NB15 schema)
or generates a statistically faithful, non-leaking synthetic demonstration dataset.
"""

from typing import Tuple, Dict, Any
import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from app.config import DATA_DIR
from app.features.extractor import NUMERIC_FEATURES


class DatasetLoader:
    """Handles dataset generation, loading, label cleaning, and train/test splitting."""

    DATASET_PATH = os.path.join(DATA_DIR, "network_traffic_benchmark.csv")

    @classmethod
    def generate_or_load_dataset(cls, n_samples: int = 4000) -> Tuple[pd.DataFrame, str]:
        """
        Loads CSV dataset if present; otherwise generates a structured IDS flow benchmark
        with realistic statistical distributions per attack class.
        """
        if os.path.exists(cls.DATASET_PATH):
            try:
                df = pd.read_csv(cls.DATASET_PATH)
                if "label" in df.columns:
                    return df, "Loaded from network_traffic_benchmark.csv"
            except Exception as e:
                print(f"[DatasetLoader] Could not read existing dataset: {e}")

        # Generate representative dataset
        df = cls._generate_curated_samples(n_samples)
        os.makedirs(DATA_DIR, exist_ok=True)
        df.to_csv(cls.DATASET_PATH, index=False)
        return df, "Curated Demonstration IDS Dataset (CIC-IDS2017/UNSW-NB15 Schema)"

    @classmethod
    def _generate_curated_samples(cls, n_samples: int = 4000) -> pd.DataFrame:
        """
        Synthesizes realistic flows across 5 standard IDS classes:
        1. BENIGN: Standard browsing, DNS queries, streaming, legitimate API calls.
        2. DoS: Volumetric or high-frequency SYN floods, short duration, identical packet sizes.
        3. PortScan: Rapid probes across sequential destination ports, minimal packets per port.
        4. BruteForce: Repeated authentication attempts to SSH/RDP/FTP, medium packet sizes.
        5. DataExfiltration: Asymmetric byte transfers (large outbound bytes, prolonged duration).
        """
        np.random.seed(42)
        records = []

        class_distribution = {
            "BENIGN": int(n_samples * 0.50),
            "DoS": int(n_samples * 0.15),
            "PortScan": int(n_samples * 0.15),
            "BruteForce": int(n_samples * 0.10),
            "DataExfiltration": int(n_samples * 0.10)
        }

        # 1. BENIGN
        for _ in range(class_distribution["BENIGN"]):
            protocol = np.random.choice(["TCP", "UDP"], p=[0.75, 0.25])
            dst_port = np.random.choice([80, 443, 53, 8080, 8443, 123])
            src_port = np.random.randint(1024, 65535)
            duration = np.random.exponential(scale=2.5) + 0.05
            packet_count = np.random.randint(5, 120)
            byte_count = packet_count * np.random.randint(64, 1420)
            mean_size = byte_count / packet_count
            records.append({
                "duration": duration,
                "protocol": protocol,
                "src_port": src_port,
                "dst_port": dst_port,
                "packet_count": packet_count,
                "byte_count": byte_count,
                "mean_packet_size": mean_size,
                "std_packet_size": np.random.uniform(10.0, 150.0),
                "min_packet_size": 40.0,
                "max_packet_size": 1500.0,
                "packet_rate": packet_count / duration,
                "byte_rate": byte_count / duration,
                "syn_count": 1.0 if protocol == "TCP" else 0.0,
                "ack_count": float(packet_count - 1) if protocol == "TCP" else 0.0,
                "fin_count": 1.0 if protocol == "TCP" else 0.0,
                "rst_count": 0.0,
                "psh_count": float(packet_count // 4) if protocol == "TCP" else 0.0,
                "urg_count": 0.0,
                "is_well_known_port": 1.0,
                "conn_frequency": np.random.uniform(0.5, 3.0),
                "label": "BENIGN"
            })

        # 2. DoS (SYN Flood / High Volumetric)
        for _ in range(class_distribution["DoS"]):
            dst_port = np.random.choice([80, 443, 8080])
            src_port = np.random.randint(1024, 65535)
            duration = np.random.uniform(0.01, 0.5)
            packet_count = np.random.randint(200, 1500)
            byte_count = packet_count * 60  # SYN packets typically 54-64 bytes
            records.append({
                "duration": duration,
                "protocol": "TCP",
                "src_port": src_port,
                "dst_port": dst_port,
                "packet_count": packet_count,
                "byte_count": byte_count,
                "mean_packet_size": 60.0,
                "std_packet_size": 1.5,
                "min_packet_size": 54.0,
                "max_packet_size": 64.0,
                "packet_rate": packet_count / duration,
                "byte_rate": byte_count / duration,
                "syn_count": float(packet_count),
                "ack_count": 0.0,
                "fin_count": 0.0,
                "rst_count": np.random.choice([0.0, 1.0]),
                "psh_count": 0.0,
                "urg_count": 0.0,
                "is_well_known_port": 1.0,
                "conn_frequency": np.random.uniform(150.0, 600.0),
                "label": "DoS"
            })

        # 3. PortScan
        for _ in range(class_distribution["PortScan"]):
            dst_port = np.random.randint(1, 65535)
            src_port = np.random.randint(1024, 65535)
            duration = np.random.uniform(0.001, 0.05)
            packet_count = np.random.randint(1, 3)
            byte_count = packet_count * 48
            records.append({
                "duration": duration,
                "protocol": "TCP",
                "src_port": src_port,
                "dst_port": dst_port,
                "packet_count": packet_count,
                "byte_count": byte_count,
                "mean_packet_size": 48.0,
                "std_packet_size": 0.5,
                "min_packet_size": 44.0,
                "max_packet_size": 52.0,
                "packet_rate": packet_count / duration,
                "byte_rate": byte_count / duration,
                "syn_count": float(packet_count),
                "ack_count": 0.0,
                "fin_count": 0.0,
                "rst_count": np.random.choice([0.0, 1.0]),
                "psh_count": 0.0,
                "urg_count": 0.0,
                "is_well_known_port": 0.0,
                "conn_frequency": np.random.uniform(50.0, 200.0),
                "label": "PortScan"
            })

        # 4. BruteForce (SSH/RDP/FTP repeated logins)
        for _ in range(class_distribution["BruteForce"]):
            dst_port = np.random.choice([22, 3389, 21])
            src_port = np.random.randint(1024, 65535)
            duration = np.random.uniform(1.0, 4.0)
            packet_count = np.random.randint(30, 80)
            byte_count = packet_count * np.random.randint(120, 300)
            records.append({
                "duration": duration,
                "protocol": "TCP",
                "src_port": src_port,
                "dst_port": dst_port,
                "packet_count": packet_count,
                "byte_count": byte_count,
                "mean_packet_size": byte_count / packet_count,
                "std_packet_size": np.random.uniform(20.0, 60.0),
                "min_packet_size": 54.0,
                "max_packet_size": 450.0,
                "packet_rate": packet_count / duration,
                "byte_rate": byte_count / duration,
                "syn_count": 1.0,
                "ack_count": float(packet_count - 3),
                "fin_count": 1.0,
                "rst_count": 1.0,
                "psh_count": float(packet_count // 3),
                "urg_count": 0.0,
                "is_well_known_port": 1.0,
                "conn_frequency": np.random.uniform(10.0, 40.0),
                "label": "BruteForce"
            })

        # 5. DataExfiltration (Outbound heavy volume)
        for _ in range(class_distribution["DataExfiltration"]):
            dst_port = np.random.choice([443, 8080, 9001, 4444])
            src_port = np.random.randint(1024, 65535)
            duration = np.random.uniform(5.0, 30.0)
            packet_count = np.random.randint(1000, 5000)
            byte_count = packet_count * 1440  # Max MTU payload size
            records.append({
                "duration": duration,
                "protocol": "TCP",
                "src_port": src_port,
                "dst_port": dst_port,
                "packet_count": packet_count,
                "byte_count": byte_count,
                "mean_packet_size": 1440.0,
                "std_packet_size": 15.0,
                "min_packet_size": 64.0,
                "max_packet_size": 1500.0,
                "packet_rate": packet_count / duration,
                "byte_rate": byte_count / duration,
                "syn_count": 1.0,
                "ack_count": float(packet_count - 1),
                "fin_count": 1.0,
                "rst_count": 0.0,
                "psh_count": float(packet_count * 0.7),
                "urg_count": 0.0,
                "is_well_known_port": 1.0 if dst_port in [443, 8080] else 0.0,
                "conn_frequency": np.random.uniform(1.0, 5.0),
                "label": "DataExfiltration"
            })

        df = pd.DataFrame(records)
        return df.sample(frac=1.0, random_state=42).reset_index(drop=True)

    @classmethod
    def get_splits(cls, test_size: float = 0.20):
        """Splits data cleanly without data leakage."""
        df, dataset_name = cls.generate_or_load_dataset()
        y = df["label"].values
        X_df = df.drop(columns=["label"])
        X_train, X_test, y_train, y_test = train_test_split(
            X_df, y, test_size=test_size, random_state=42, stratify=y
        )
        return X_train, X_test, y_train, y_test, dataset_name

