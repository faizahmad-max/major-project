"""
NetShield AI - Synthetic Traffic Generation Engine
Produces high-fidelity, clearly labeled network traffic flows for safe demonstrations,
security testing, and validation without transmitting hazardous packets across physical networks.
"""

from typing import Dict, Any, List, Optional
import time
import random
import threading
from app.features.extractor import FeatureExtractor


class TrafficSimulator:
    """Thread-safe multi-scenario network traffic simulator."""

    SCENARIOS = ["normal", "syn_flood", "port_scan", "brute_force", "data_exfiltration", "mixed"]

    def __init__(self, on_flow_callback=None):
        self.on_flow_callback = on_flow_callback
        self.is_running: bool = False
        self.current_scenario: str = "normal"
        self.events_per_second: float = 2.0
        self.total_generated: int = 0
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()

        # Simulated state counters
        self._scan_port_cursor = 1000
        self._attacker_ip = "192.168.1.150"
        self._target_ip = "10.0.0.5"

    def get_status(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "is_running": self.is_running,
                "current_scenario": self.current_scenario,
                "events_per_second": self.events_per_second,
                "total_generated": self.total_generated,
                "supported_scenarios": self.SCENARIOS,
                "mode": "SIMULATED"
            }

    def start(self, scenario: str = "normal", speed: float = 2.0) -> Dict[str, Any]:
        with self._lock:
            if scenario not in self.SCENARIOS:
                scenario = "normal"
            self.current_scenario = scenario
            self.events_per_second = max(0.5, min(float(speed), 50.0))

            if self.is_running:
                return self.get_status()

            self.is_running = True
            self._thread = threading.Thread(target=self._run_loop, daemon=True)
            self._thread.start()

        return self.get_status()

    def stop(self) -> Dict[str, Any]:
        with self._lock:
            self.is_running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1.0)
        return self.get_status()

    def set_scenario(self, scenario: str) -> bool:
        with self._lock:
            if scenario in self.SCENARIOS:
                self.current_scenario = scenario
                return True
        return False

    def _run_loop(self):
        while self.is_running:
            flow = self.generate_flow(self.current_scenario)
            with self._lock:
                self.total_generated += 1

            if self.on_flow_callback:
                try:
                    self.on_flow_callback(flow)
                except Exception as e:
                    print(f"[TrafficSimulator] Callback error: {e}")

            delay = 1.0 / max(self.events_per_second, 0.5)
            # Add slight jitter to simulate organic timing
            time.sleep(delay * random.uniform(0.85, 1.15))

    def generate_flow(self, scenario: Optional[str] = None) -> Dict[str, Any]:
        """Generates a single synthetic flow matching the selected scenario."""
        scen = scenario or self.current_scenario
        if scen == "mixed":
            # 70% normal, 30% random attacks
            scen = "normal" if random.random() < 0.70 else random.choice(["syn_flood", "port_scan", "brute_force", "data_exfiltration"])

        timestamp = time.time()

        if scen == "syn_flood":
            # Volumetric DoS
            src_ip = f"172.16.{random.randint(1, 254)}.{random.randint(1, 254)}"
            dst_ip = self._target_ip
            src_port = random.randint(1024, 65535)
            dst_port = random.choice([80, 443, 8080])
            packet_count = random.randint(350, 2000)
            duration = random.uniform(0.01, 0.2)
            byte_count = packet_count * 60

            raw = {
                "timestamp": timestamp,
                "src_ip": src_ip,
                "dst_ip": dst_ip,
                "src_port": src_port,
                "dst_port": dst_port,
                "protocol": "TCP",
                "duration": duration,
                "packet_count": packet_count,
                "byte_count": byte_count,
                "mean_packet_size": 60.0,
                "std_packet_size": 1.2,
                "min_packet_size": 54.0,
                "max_packet_size": 64.0,
                "packet_rate": packet_count / duration,
                "byte_rate": byte_count / duration,
                "syn_count": packet_count,
                "ack_count": 0,
                "fin_count": 0,
                "rst_count": random.choice([0, 1]),
                "psh_count": 0,
                "urg_count": 0,
                "conn_frequency": random.uniform(180.0, 500.0),
                "data_mode": "SIMULATED",
                "simulated_scenario": "syn_flood"
            }

        elif scen == "port_scan":
            # Sequential port probing
            self._scan_port_cursor = (self._scan_port_cursor + 1) % 65535
            if self._scan_port_cursor < 100:
                self._scan_port_cursor = 100

            src_ip = self._attacker_ip
            dst_ip = self._target_ip
            src_port = random.randint(40000, 60000)
            dst_port = self._scan_port_cursor
            duration = random.uniform(0.002, 0.04)
            packet_count = random.randint(1, 2)
            byte_count = packet_count * 48

            raw = {
                "timestamp": timestamp,
                "src_ip": src_ip,
                "dst_ip": dst_ip,
                "src_port": src_port,
                "dst_port": dst_port,
                "protocol": "TCP",
                "duration": duration,
                "packet_count": packet_count,
                "byte_count": byte_count,
                "mean_packet_size": 48.0,
                "std_packet_size": 0.5,
                "min_packet_size": 44.0,
                "max_packet_size": 52.0,
                "packet_rate": packet_count / duration,
                "byte_rate": byte_count / duration,
                "syn_count": packet_count,
                "ack_count": 0,
                "fin_count": 0,
                "rst_count": random.choice([0, 1]),
                "psh_count": 0,
                "urg_count": 0,
                "conn_frequency": random.uniform(80.0, 250.0),
                "data_mode": "SIMULATED",
                "simulated_scenario": "port_scan"
            }

        elif scen == "brute_force":
            # Repeated authentication probes to SSH / RDP / FTP
            src_ip = "198.51.100.42"
            dst_ip = self._target_ip
            src_port = random.randint(1024, 65535)
            dst_port = random.choice([22, 3389, 21])
            duration = random.uniform(1.2, 3.8)
            packet_count = random.randint(45, 90)
            byte_count = packet_count * random.randint(120, 280)

            raw = {
                "timestamp": timestamp,
                "src_ip": src_ip,
                "dst_ip": dst_ip,
                "src_port": src_port,
                "dst_port": dst_port,
                "protocol": "TCP",
                "duration": duration,
                "packet_count": packet_count,
                "byte_count": byte_count,
                "mean_packet_size": byte_count / packet_count,
                "std_packet_size": random.uniform(25.0, 55.0),
                "min_packet_size": 54.0,
                "max_packet_size": 450.0,
                "packet_rate": packet_count / duration,
                "byte_rate": byte_count / duration,
                "syn_count": 1,
                "ack_count": packet_count - 3,
                "fin_count": 1,
                "rst_count": 1,
                "psh_count": packet_count // 3,
                "urg_count": 0,
                "conn_frequency": random.uniform(20.0, 60.0),
                "data_mode": "SIMULATED",
                "simulated_scenario": "brute_force"
            }

        elif scen == "data_exfiltration":
            # Heavy outbound transfer to external server
            src_ip = "10.0.0.12"
            dst_ip = f"203.0.113.{random.randint(1, 250)}"
            src_port = random.randint(1024, 65535)
            dst_port = random.choice([443, 8080, 9001])
            duration = random.uniform(8.0, 25.0)
            packet_count = random.randint(1200, 4500)
            byte_count = packet_count * 1440

            raw = {
                "timestamp": timestamp,
                "src_ip": src_ip,
                "dst_ip": dst_ip,
                "src_port": src_port,
                "dst_port": dst_port,
                "protocol": "TCP",
                "duration": duration,
                "packet_count": packet_count,
                "byte_count": byte_count,
                "mean_packet_size": 1440.0,
                "std_packet_size": 12.0,
                "min_packet_size": 64.0,
                "max_packet_size": 1500.0,
                "packet_rate": packet_count / duration,
                "byte_rate": byte_count / duration,
                "syn_count": 1,
                "ack_count": packet_count - 1,
                "fin_count": 1,
                "rst_count": 0,
                "psh_count": int(packet_count * 0.7),
                "urg_count": 0,
                "conn_frequency": random.uniform(1.0, 4.0),
                "data_mode": "SIMULATED",
                "simulated_scenario": "data_exfiltration"
            }

        else:
            # Normal enterprise & client traffic
            is_web = random.random() < 0.75
            proto = "TCP" if is_web else random.choice(["UDP", "ICMP"])
            src_ip = f"192.168.1.{random.randint(10, 120)}"
            dst_ip = random.choice(["142.250.190.46", "1.1.1.1", "8.8.8.8", "151.101.65.140", "13.107.42.16"])
            src_port = random.randint(1024, 65535)
            dst_port = random.choice([443, 80, 53, 123, 8443]) if proto != "ICMP" else 0
            duration = random.uniform(0.1, 4.0)
            packet_count = random.randint(6, 60)
            byte_count = packet_count * random.randint(64, 1300)

            raw = {
                "timestamp": timestamp,
                "src_ip": src_ip,
                "dst_ip": dst_ip,
                "src_port": src_port,
                "dst_port": dst_port,
                "protocol": proto,
                "duration": duration,
                "packet_count": packet_count,
                "byte_count": byte_count,
                "mean_packet_size": byte_count / packet_count,
                "std_packet_size": random.uniform(15.0, 95.0),
                "min_packet_size": 40.0,
                "max_packet_size": 1460.0,
                "packet_rate": packet_count / duration,
                "byte_rate": byte_count / duration,
                "syn_count": 1 if proto == "TCP" else 0,
                "ack_count": packet_count - 1 if proto == "TCP" else 0,
                "fin_count": 1 if proto == "TCP" else 0,
                "rst_count": 0,
                "psh_count": packet_count // 4 if proto == "TCP" else 0,
                "urg_count": 0,
                "conn_frequency": random.uniform(0.5, 3.5),
                "data_mode": "SIMULATED",
                "simulated_scenario": "normal"
            }

        # Apply standard feature extraction guarantees
        extracted = FeatureExtractor.extract_from_flow(raw)
        extracted["data_mode"] = "SIMULATED"
        extracted["simulated_scenario"] = scen
        return extracted

