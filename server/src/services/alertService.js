/**
 * NetShield AI - Alert Policy & Management Service
 * Evaluates flows against severity heuristics and detection outputs.
 * Provides defensive investigation recommendations and database persistence.
 */

const { db } = require('../db/database');

const INVESTIGATION_GUIDANCE = {
  DoS: 'Investigate anomalous packet rate spike and source subnet. Check edge load balancer metrics. Consider applying upstream rate-limiting or SYN cookies.',
  PortScan: 'Audit scanned destination port sequence. Verify firewall stateful inspection drop counters. Ensure non-public ports are closed or restricted.',
  BruteForce: 'Examine authentication failure logs for target service. Implement exponential connection backoff or IP ban rules for repeated failures.',
  DataExfiltration: 'Verify recipient IP identity and reputation. Examine outbound byte ratio and protocol compliance. Check enterprise Data Loss Prevention (DLP) alerts.',
  ReconstructionAnomaly: 'Deep autoencoder detected abnormal multi-dimensional deviation from normal baseline. Inspect raw packet sizes and flags for zero-day signatures.',
  UnknownAnomaly: 'Review connection duration, packet rate, and protocol distribution against baseline operating metrics.'
};

class AlertService {
  /**
   * Evaluates an enriched flow and generates an alert if anomalous.
   */
  static processFlow(flow, io) {
    if (flow.prediction !== 'ANOMALOUS' && (flow.anomaly_score || 0) < 0.65) {
      return null;
    }

    const score = Number(flow.anomaly_score) || 0.70;
    const attackType = flow.attack_type || 'Unknown Anomaly';

    // Determine severity
    let severity = 'LOW';
    if (['DoS', 'DataExfiltration', 'BruteForce'].includes(attackType) || score >= 0.85) {
      severity = 'HIGH';
    } else if (attackType === 'PortScan' || score >= 0.70) {
      severity = 'MEDIUM';
    }

    const title = attackType === 'Unknown Anomaly'
      ? `Suspicious Traffic Anomaly Detected (${(score * 100).toFixed(0)}% score)`
      : `Potential ${attackType} Activity Detected`;

    const description = `Observable traffic flow from ${flow.src_ip}:${flow.src_port || 0} to ${flow.dst_ip}:${flow.dst_port || 0} (${flow.protocol}) exhibited characteristics flagged by model '${flow.model}'.`;

    const remediation = INVESTIGATION_GUIDANCE[attackType] || INVESTIGATION_GUIDANCE.UnknownAnomaly;

    const factors = Array.isArray(flow.explanation) && flow.explanation.length > 0
      ? flow.explanation.join(' | ')
      : `Anomaly score: ${score.toFixed(3)}, Packet Rate: ${Number(flow.packet_rate || 0).toFixed(1)} pkts/s, Duration: ${Number(flow.duration || 0).toFixed(3)}s`;

    try {
      const stmt = db.prepare(`
        INSERT INTO alerts (
          timestamp, severity, title, description, src_ip, dst_ip, dst_port,
          protocol, attack_type, model, anomaly_score, status, remediation, contributing_factors
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'UNREVIEWED', ?, ?)
      `);

      const result = stmt.run(
        flow.timestamp || (Date.now() / 1000),
        severity,
        title,
        description,
        flow.src_ip || '0.0.0.0',
        flow.dst_ip || '0.0.0.0',
        Number(flow.dst_port) || 0,
        flow.protocol || 'TCP',
        attackType,
        flow.model || 'Detector',
        score,
        remediation,
        factors
      );

      const alertRecord = {
        id: Number(result.lastInsertRowid),
        timestamp: flow.timestamp || (Date.now() / 1000),
        severity,
        title,
        description,
        src_ip: flow.src_ip,
        dst_ip: flow.dst_ip,
        dst_port: flow.dst_port,
        protocol: flow.protocol,
        attack_type: attackType,
        model: flow.model,
        anomaly_score: score,
        status: 'UNREVIEWED',
        remediation,
        contributing_factors: factors
      };

      if (io) {
        io.emit('alert:new', alertRecord);
        io.emit('anomaly:detected', {
          flow,
          alert: alertRecord
        });
      }

      return alertRecord;
    } catch (err) {
      console.error('[AlertService] Failed saving alert:', err.message);
      return null;
    }
  }

  static getAlerts({ limit = 100, severity, status } = {}) {
    let query = 'SELECT * FROM alerts WHERE 1=1';
    const params = [];

    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(Number(limit) || 100);

    return db.prepare(query).all(...params);
  }

  static updateAlertStatus(id, newStatus) {
    const valid = ['UNREVIEWED', 'REVIEWED', 'RESOLVED', 'DISMISSED'];
    if (!valid.includes(newStatus)) {
      throw new Error(`Invalid status. Must be one of: ${valid.join(', ')}`);
    }

    const stmt = db.prepare('UPDATE alerts SET status = ? WHERE id = ?');
    stmt.run(newStatus, id);
    return db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
  }
}

module.exports = AlertService;

