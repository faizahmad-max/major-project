"""
NetShield AI - Live Packet Capture & Aggregation Module
Interfaces with network adapters using Scapy and psutil.
Aggregates packet streams into directional connection flows with graceful driver permission handling.
"""

from typing import Dict, Any, List, Optional
import time
import threading
from collections import defaultdict
import psutil
from app.features.extractor import FeatureExtractor

try:
    from scapy.all import sniff, IP, IPv6, TCP, UDP, ICMP, get_if_list
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False


class FlowAccumulator:
    """Aggregates individual packets into connection flows over a time window."""

    def __init__(self, key: tuple, first_pkt_time: float):
        self.key = key  # (src_ip, dst_ip, src_port, dst_port, protocol)
        self.start_time = first_pkt_time
        self.last_time = first_pkt_time
        self.packet_count = 0
        self.byte_count = 0
        self.packet_sizes = []
        self.syn_count = 0
        self.ack_count = 0
        self.fin_count = 0
        self.rst_count = 0
        self.psh_count = 0
        self.urg_count = 0

    def add_packet(self, size: int, pkt_time: float, tcp_flags=None):
        self.last_time = max(self.last_time, pkt_time)
        self.packet_count += 1
        self.byte_count += size
        self.packet_sizes.append(size)

        if tcp_flags:
            flags_str = str(tcp_flags)
            if 'S' in flags_str: self.syn_count += 1
            if 'A' in flags_str: self.ack_count += 1
            if 'F' in flags_str: self.fin_count += 1
            if 'R' in flags_str: self.rst_count += 1
            if 'P' in flags_str: self.psh_count += 1
            if 'U' in flags_str: self.urg_count += 1

    def to_flow_dict(self) -> Dict[str, Any]:
        src_ip, dst_ip, src_port, dst_port, protocol = self.key
        duration = max(self.last_time - self.start_time, 0.0001)

        raw = {
            "timestamp": self.start_time,
            "src_ip": src_ip,
            "dst_ip": dst_ip,
            "src_port": src_port,
            "dst_port": dst_port,
            "protocol": protocol,
            "duration": duration,
            "packet_count": self.packet_count,
            "byte_count": self.byte_count,
            "packet_sizes": self.packet_sizes,
            "syn_count": self.syn_count,
            "ack_count": self.ack_count,
            "fin_count": self.fin_count,
            "rst_count": self.rst_count,
            "psh_count": self.psh_count,
            "urg_count": self.urg_count,
            "data_mode": "LIVE"
        }
        return FeatureExtractor.extract_from_flow(raw)


class LiveCaptureEngine:
    """Manages Scapy packet sniffer thread and flow window aggregation."""

    def __init__(self, on_flow_callback=None):
        self.on_flow_callback = on_flow_callback
        self.is_capturing: bool = False
        self.selected_interface: Optional[str] = None
        self.packets_captured: int = 0
        self.flows_emitted: int = 0
        self.last_error: Optional[str] = None
        self._thread: Optional[threading.Thread] = None
        self._flush_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._flows: Dict[tuple, FlowAccumulator] = {}
        self._lock = threading.Lock()

    @staticmethod
    def get_interfaces() -> List[Dict[str, Any]]:
        """Queries network adapters using psutil and cross-references with Scapy."""
        interfaces = []
        stats = psutil.net_if_stats()
        addrs = psutil.net_if_addrs()

        for name, stat in stats.items():
            ip_addr = "N/A"
            mac_addr = "N/A"
            if name in addrs:
                for addr in addrs[name]:
                    if addr.family.name == "AF_INET":
                        ip_addr = addr.address
                    elif addr.family.name == "AF_LINK":
                        mac_addr = addr.address

            interfaces.append({
                "name": name,
                "is_up": stat.isup,
                "speed_mbps": stat.speed,
                "mtu": stat.mtu,
                "ip_address": ip_addr,
                "mac_address": mac_addr
            })

        return interfaces

    def get_status(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "is_capturing": self.is_capturing,
                "selected_interface": self.selected_interface,
                "packets_captured": self.packets_captured,
                "flows_emitted": self.flows_emitted,
                "last_error": self.last_error,
                "scapy_available": SCAPY_AVAILABLE,
                "mode": "LIVE"
            }

    def start(self, interface_name: Optional[str] = None) -> Dict[str, Any]:
        if not SCAPY_AVAILABLE:
            self.last_error = "Scapy is not installed in the ML service runtime."
            return self.get_status()

        with self._lock:
            if self.is_capturing:
                return self.get_status()

            self.is_capturing = True
            self.selected_interface = interface_name
            self.last_error = None
            self._stop_event.clear()
            self._flows.clear()

            self._thread = threading.Thread(target=self._capture_worker, daemon=True)
            self._thread.start()

            self._flush_thread = threading.Thread(target=self._flow_flusher_worker, daemon=True)
            self._flush_thread.start()

        return self.get_status()

    def stop(self) -> Dict[str, Any]:
        with self._lock:
            self.is_capturing = False
            self._stop_event.set()

        # Flush remaining flows
        self._flush_all_flows()

        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1.0)
        return self.get_status()

    def _packet_handler(self, pkt):
        try:
            with self._lock:
                self.packets_captured += 1

            if not pkt.haslayer(IP) and not pkt.haslayer(IPv6):
                return

            pkt_time = float(pkt.time)
            size = len(pkt)

            if pkt.haslayer(IP):
                src_ip = pkt[IP].src
                dst_ip = pkt[IP].dst
            else:
                src_ip = pkt[IPv6].src
                dst_ip = pkt[IPv6].dst

            protocol = "OTHER"
            src_port = 0
            dst_port = 0
            tcp_flags = None

            if pkt.haslayer(TCP):
                protocol = "TCP"
                src_port = int(pkt[TCP].sport)
                dst_port = int(pkt[TCP].dport)
                tcp_flags = pkt[TCP].flags
            elif pkt.haslayer(UDP):
                protocol = "UDP"
                src_port = int(pkt[UDP].sport)
                dst_port = int(pkt[UDP].dport)
            elif pkt.haslayer(ICMP):
                protocol = "ICMP"

            key = (src_ip, dst_ip, src_port, dst_port, protocol)

            with self._lock:
                if key not in self._flows:
                    self._flows[key] = FlowAccumulator(key, pkt_time)
                self._flows[key].add_packet(size, pkt_time, tcp_flags)

        except Exception as e:
            self.last_error = f"Packet parsing error: {e}"

    def _capture_worker(self):
        try:
            kwargs = {
                "prn": self._packet_handler,
                "store": False,
                "stop_filter": lambda p: self._stop_event.is_set()
            }
            if self.selected_interface:
                kwargs["iface"] = self.selected_interface

            # Sniff loop
            sniff(**kwargs)

        except PermissionError:
            self.last_error = "Permission denied: Administrator privileges and Npcap/WinPcap required for live capture."
            with self._lock:
                self.is_capturing = False
        except Exception as e:
            err_msg = str(e)
            if "winpcap" in err_msg.lower() or "npcap" in err_msg.lower() or "device" in err_msg.lower():
                self.last_error = "Npcap driver not detected. Install Npcap in WinPcap API-compatible mode to enable live packet capture."
            else:
                self.last_error = f"Live capture halted: {err_msg}"
            with self._lock:
                self.is_capturing = False

    def _flow_flusher_worker(self):
        """Periodically flushes completed flows older than 2 seconds."""
        while not self._stop_event.is_set():
            time.sleep(1.0)
            now = time.time()
            to_emit = []

            with self._lock:
                expired_keys = [k for k, flow in self._flows.items() if (now - flow.last_time) >= 2.0]
                for k in expired_keys:
                    flow = self._flows.pop(k)
                    to_emit.append(flow.to_flow_dict())
                    self.flows_emitted += 1

            for flow_dict in to_emit:
                flow_dict["data_mode"] = "LIVE"
                if self.on_flow_callback:
                    try:
                        self.on_flow_callback(flow_dict)
                    except Exception as e:
                        print(f"[LiveCaptureEngine] Callback error: {e}")

    def _flush_all_flows(self):
        to_emit = []
        with self._lock:
            for flow in self._flows.values():
                to_emit.append(flow.to_flow_dict())
                self.flows_emitted += 1
            self._flows.clear()

        for flow_dict in to_emit:
            flow_dict["data_mode"] = "LIVE"
            if self.on_flow_callback:
                try:
                    self.on_flow_callback(flow_dict)
                except Exception:
                    pass

