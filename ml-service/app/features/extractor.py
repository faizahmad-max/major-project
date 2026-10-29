"""
NetShield AI - Traffic Feature Extraction Pipeline
Transforms raw packet streams and connection events into standardized flow feature vectors.
Adheres to IDS benchmarks (CIC-IDS2017 / UNSW-NB15 flow representations).
"""

from typing import Dict, Any, List, Optional
import math
import time

# Canonical feature list used for ML model training and inference
NUMERIC_FEATURES = [
    "duration",
    "src_port",
    "dst_port",
    "packet_count",
    "byte_count",
    "mean_packet_size",
    "std_packet_size",
    "min_packet_size",
    "max_packet_size",
    "packet_rate",
    "byte_rate",
    "syn_count",
    "ack_count",
    "fin_count",
    "rst_count",
    "psh_count",
    "urg_count",
    "is_well_known_port",
    "conn_frequency"
]

CATEGORICAL_FEATURES = [
    "protocol"
]

ALL_MODEL_FEATURES = NUMERIC_FEATURES + [f"protocol_{p}" for p in ["TCP", "UDP", "ICMP", "OTHER"]]


class FeatureExtractor:
    """Extracts consistent tabular features from packet summaries or raw flow dictionaries."""

    WELL_KNOWN_PORTS = {20, 21, 22, 23, 25, 53, 80, 110, 123, 143, 443, 445, 993, 995, 3306, 3389, 8080, 8443}

    @staticmethod
    def extract_from_flow(flow: Dict[str, Any]) -> Dict[str, Any]:
        """
        Takes raw flow dictionary or packet aggregation and returns sanitized,
        fully calculated feature dictionary suitable for preprocessing.
        """
        # Duration in seconds (floor at 0.0001 to prevent division by zero)
        duration = float(flow.get("duration", 0.0) or 0.0)
        duration = max(duration, 0.0001)

        packet_count = int(flow.get("packet_count", 1) or 1)
        byte_count = int(flow.get("byte_count", flow.get("bytes_transferred", 0)) or 0)

        # Packet size statistics
        packet_sizes = flow.get("packet_sizes", [])
        if packet_sizes and len(packet_sizes) > 0:
            min_size = float(min(packet_sizes))
            max_size = float(max(packet_sizes))
            mean_size = float(sum(packet_sizes) / len(packet_sizes))
            variance = sum((x - mean_size) ** 2 for x in packet_sizes) / len(packet_sizes)
            std_size = math.sqrt(variance)
        else:
            mean_size = float(flow.get("mean_packet_size", byte_count / packet_count if packet_count > 0 else 0))
            std_size = float(flow.get("std_packet_size", 0.0))
            min_size = float(flow.get("min_packet_size", mean_size))
            max_size = float(flow.get("max_packet_size", mean_size))

        # Rates
        packet_rate = float(flow.get("packet_rate", packet_count / duration))
        byte_rate = float(flow.get("byte_rate", byte_count / duration))

        # Ports
        src_port = int(flow.get("src_port", 0) or 0)
        dst_port = int(flow.get("dst_port", 0) or 0)
        is_well_known = 1.0 if dst_port in FeatureExtractor.WELL_KNOWN_PORTS or src_port in FeatureExtractor.WELL_KNOWN_PORTS else 0.0

        # Protocol normalization
        proto_raw = str(flow.get("protocol", "TCP")).upper().strip()
        if "TCP" in proto_raw or proto_raw == "6":
            protocol = "TCP"
        elif "UDP" in proto_raw or proto_raw == "17":
            protocol = "UDP"
        elif "ICMP" in proto_raw or proto_raw == "1":
            protocol = "ICMP"
        else:
            protocol = "OTHER"

        # TCP Flag counts
        syn_count = float(flow.get("syn_count", flow.get("tcp_flags_syn", 0)) or 0)
        ack_count = float(flow.get("ack_count", flow.get("tcp_flags_ack", 0)) or 0)
        fin_count = float(flow.get("fin_count", flow.get("tcp_flags_fin", 0)) or 0)
        rst_count = float(flow.get("rst_count", flow.get("tcp_flags_rst", 0)) or 0)
        psh_count = float(flow.get("psh_count", flow.get("tcp_flags_psh", 0)) or 0)
        urg_count = float(flow.get("urg_count", flow.get("tcp_flags_urg", 0)) or 0)

        # Connection frequency indicator
        conn_frequency = float(flow.get("conn_frequency", 1.0) or 1.0)

        extracted = {
            "duration": duration,
            "protocol": protocol,
            "src_port": src_port,
            "dst_port": dst_port,
            "packet_count": packet_count,
            "byte_count": byte_count,
            "mean_packet_size": mean_size,
            "std_packet_size": std_size,
            "min_packet_size": min_size,
            "max_packet_size": max_size,
            "packet_rate": packet_rate,
            "byte_rate": byte_rate,
            "syn_count": syn_count,
            "ack_count": ack_count,
            "fin_count": fin_count,
            "rst_count": rst_count,
            "psh_count": psh_count,
            "urg_count": urg_count,
            "is_well_known_port": is_well_known,
            "conn_frequency": conn_frequency,
            # Identifiers retained for auditing/UI, NOT fed directly to numerical models
            "src_ip": str(flow.get("src_ip", "0.0.0.0")),
            "dst_ip": str(flow.get("dst_ip", "0.0.0.0")),
            "timestamp": flow.get("timestamp", time.time())
        }

        return extracted

