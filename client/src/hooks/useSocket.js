/**
 * NetShield AI - Socket.IO Client Hook
 * Subscribes to real-time events and provides live telemetry state.
 */

import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [summary, setSummary] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [latestFlow, setLatestFlow] = useState(null);
  const [flowHistory, setFlowHistory] = useState([]);
  const [latestAlert, setLatestAlert] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to backend via Vite proxy or direct
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('dashboard:summary', (data) => {
      setSummary(data);
    });

    socket.on('system:status', (status) => {
      setSystemStatus(status);
    });

    socket.on('traffic:update', (flow) => {
      setLatestFlow(flow);
      setFlowHistory((prev) => [flow, ...prev.slice(0, 49)]);
    });

    socket.on('alert:new', (alert) => {
      setLatestAlert(alert);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return {
    isConnected,
    summary,
    systemStatus,
    latestFlow,
    flowHistory,
    latestAlert,
    socket: socketRef.current
  };
}

