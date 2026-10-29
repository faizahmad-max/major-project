/**
 * NetShield AI - Traffic Flow Buffer & Real-Time Aggregator
 * Batches incoming packet flows to SQLite and broadcasts smooth real-time telemetry.
 */

const { db } = require('../db/database');

class TrafficBuffer {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.recentFlows = [];
    this.totalObserved = 0;
    this.normalCount = 0;
    this.anomalousCount = 0;
    this.protocolStats = { TCP: 0, UDP: 0, ICMP: 0, OTHER: 0 };
    this.pendingDbInserts = [];
    this.flushInterval = null;

    // Load initial lifetime stats from SQLite
    this._loadInitialStats();
    this._startBatchFlusher();
  }

  _loadInitialStats() {
    try {
      const counts = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN prediction = 'NORMAL' THEN 1 ELSE 0 END) as normal_cnt,
          SUM(CASE WHEN prediction = 'ANOMALOUS' THEN 1 ELSE 0 END) as anom_cnt
        FROM traffic_flows
      `).get();

      if (counts) {
        this.totalObserved = Number(counts.total) || 0;
        this.normalCount = Number(counts.normal_cnt) || 0;
        this.anomalousCount = Number(counts.anom_cnt) || 0;
      }
    } catch (e) {
      console.warn('[TrafficBuffer] Could not fetch initial counts:', e.message);
    }
  }

  _startBatchFlusher() {
    this.flushInterval = setInterval(() => {
      this.flushToDb();
    }, 1500);
  }

  addFlow(flow) {
    this.totalObserved++;
    const isAnom = flow.prediction === 'ANOMALOUS';
    if (isAnom) {
      this.anomalousCount++;
    } else {
      this.normalCount++;
    }

    const proto = (flow.protocol || 'OTHER').toUpperCase();
    this.protocolStats[proto] = (this.protocolStats[proto] || 0) + 1;

    // Memory ring buffer
    this.recentFlows.unshift(flow);
    if (this.recentFlows.length > this.maxSize) {
      this.recentFlows.pop();
    }

    // Queue for DB insert
    this.pendingDbInserts.push(flow);
    if (this.pendingDbInserts.length >= 50) {
      this.flushToDb();
    }
  }

  flushToDb() {
    if (this.pendingDbInserts.length === 0) return;

    const toInsert = [...this.pendingDbInserts];
    this.pendingDbInserts = [];

    try {
      const stmt = db.prepare(`
        INSERT INTO traffic_flows (
          timestamp, src_ip, dst_ip, src_port, dst_port, protocol,
          duration, packet_count, byte_count, packet_rate, byte_rate,
          data_mode, prediction, anomaly_score, attack_type, confidence,
          model, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const flow of toInsert) {
        stmt.run(
          flow.timestamp || (Date.now() / 1000),
          flow.src_ip || '0.0.0.0',
          flow.dst_ip || '0.0.0.0',
          Number(flow.src_port) || 0,
          Number(flow.dst_port) || 0,
          flow.protocol || 'TCP',
          Number(flow.duration) || 0.0,
          Number(flow.packet_count) || 1,
          Number(flow.byte_count) || 0,
          Number(flow.packet_rate) || 0.0,
          Number(flow.byte_rate) || 0.0,
          flow.data_mode || 'SIMULATED',
          flow.prediction || 'NORMAL',
          Number(flow.anomaly_score) || 0.0,
          flow.attack_type || null,
          Number(flow.confidence) || null,
          flow.model || null,
          JSON.stringify(flow)
        );
      }
    } catch (err) {
      console.error('[TrafficBuffer] Batch insert error:', err.message);
    }
  }

  getSummary() {
    const total = this.totalObserved;
    const anomRate = total > 0 ? (this.anomalousCount / total) * 100 : 0;

    return {
      total_flows: total,
      normal_count: this.normalCount,
      anomalous_count: this.anomalousCount,
      anomaly_percentage: Number(anomRate.toFixed(2)),
      protocol_breakdown: { ...this.protocolStats },
      recent_flows: this.recentFlows.slice(0, 20)
    };
  }

  getFlows({ limit = 50, offset = 0, protocol, prediction, search } = {}) {
    let query = 'SELECT * FROM traffic_flows WHERE 1=1';
    const params = [];

    if (protocol) {
      query += ' AND protocol = ?';
      params.push(protocol.toUpperCase());
    }
    if (prediction) {
      query += ' AND prediction = ?';
      params.push(prediction.toUpperCase());
    }
    if (search) {
      query += ' AND (src_ip LIKE ? OR dst_ip LIKE ? OR attack_type LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(Number(limit) || 50, Number(offset) || 0);

    return db.prepare(query).all(...params);
  }
}

module.exports = new TrafficBuffer();

