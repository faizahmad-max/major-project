"""
Unit tests for NetShield AI Feature Extractor
"""

import pytest
from app.features.extractor import FeatureExtractor, NUMERIC_FEATURES


def test_feature_extractor_standard_flow():
    flow = {
        "src_ip": "192.168.1.50",
        "dst_ip": "10.0.0.1",
        "src_port": 54321,
        "dst_port": 80,
        "protocol": "TCP",
        "duration": 2.5,
        "packet_count": 25,
        "byte_count": 5000,
        "syn_count": 1,
        "ack_count": 24,
        "fin_count": 1,
        "rst_count": 0,
        "psh_count": 5,
        "urg_count": 0
    }
    extracted = FeatureExtractor.extract_from_flow(flow)

    assert extracted["protocol"] == "TCP"
    assert extracted["src_port"] == 54321
    assert extracted["dst_port"] == 80
    assert extracted["packet_count"] == 25
    assert extracted["byte_count"] == 5000
    assert extracted["packet_rate"] == 10.0
    assert extracted["byte_rate"] == 2000.0
    assert extracted["is_well_known_port"] == 1.0
    assert extracted["mean_packet_size"] == 200.0


def test_feature_extractor_zero_duration_guard():
    flow = {
        "duration": 0.0,
        "packet_count": 10,
        "byte_count": 1000
    }
    extracted = FeatureExtractor.extract_from_flow(flow)
    assert extracted["duration"] > 0
    assert extracted["packet_rate"] > 0
    assert extracted["byte_rate"] > 0


def test_feature_extractor_protocol_mapping():
    tcp_flow = FeatureExtractor.extract_from_flow({"protocol": "tcp"})
    udp_flow = FeatureExtractor.extract_from_flow({"protocol": 17})
    icmp_flow = FeatureExtractor.extract_from_flow({"protocol": "icmp"})
    other_flow = FeatureExtractor.extract_from_flow({"protocol": "unknown"})

    assert tcp_flow["protocol"] == "TCP"
    assert udp_flow["protocol"] == "UDP"
    assert icmp_flow["protocol"] == "ICMP"
    assert other_flow["protocol"] == "OTHER"

