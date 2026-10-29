const express = require('express');
const router = express.Router();
const path = require('node:path');
const { db } = require('../db/database');
const AuditService = require('../services/auditService');

router.get('/project-report-pdf', (req, res) => {
  const pdfPath = path.resolve(__dirname, '../../../NetShield_AI_Complete_Project_Report.pdf');
  res.download(pdfPath, 'NetShield_AI_Complete_Project_Report.pdf');
});

router.get('/summary', (req, res) => {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_flows,
      SUM(CASE WHEN prediction = 'ANOMALOUS' THEN 1 ELSE 0 END) as total_anomalies,
      (SELECT COUNT(*) FROM alerts) as total_alerts,
      (SELECT COUNT(*) FROM alerts WHERE severity = 'HIGH') as high_severity_alerts,
      (SELECT COUNT(*) FROM alerts WHERE status = 'UNREVIEWED') as unreviewed_alerts
    FROM traffic_flows
  `).get();

  res.json({ stats });
});

router.get('/export', (req, res) => {
  const { type = 'alerts', format = 'csv' } = req.query;

  if (type === 'alerts') {
    const alerts = db.prepare('SELECT id, timestamp, severity, title, src_ip, dst_ip, dst_port, protocol, attack_type, model, status FROM alerts ORDER BY timestamp DESC LIMIT 1000').all();

    if (format === 'json') {
      return res.json(alerts);
    }

    // CSV format
    const headers = 'ID,Timestamp,Severity,Title,Source IP,Dest IP,Dest Port,Protocol,Attack Type,Model,Status\n';
    const rows = alerts.map(a =>
      `"${a.id}","${new Date(a.timestamp * 1000).toISOString()}","${a.severity}","${a.title.replace(/"/g, '""')}","${a.src_ip}","${a.dst_ip}","${a.dst_port}","${a.protocol}","${a.attack_type || 'N/A'}","${a.model}","${a.status}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="netshield_alerts_report.csv"');
    return res.send(headers + rows);
  }

  if (type === 'traffic') {
    const flows = db.prepare('SELECT id, timestamp, src_ip, dst_ip, src_port, dst_port, protocol, packet_count, byte_count, prediction, anomaly_score, attack_type, model, data_mode FROM traffic_flows ORDER BY timestamp DESC LIMIT 1000').all();

    if (format === 'json') {
      return res.json(flows);
    }

    const headers = 'ID,Timestamp,Source IP,Dest IP,Source Port,Dest Port,Protocol,Packets,Bytes,Prediction,Anomaly Score,Attack Type,Model,Data Mode\n';
    const rows = flows.map(f =>
      `"${f.id}","${new Date(f.timestamp * 1000).toISOString()}","${f.src_ip}","${f.dst_ip}","${f.src_port}","${f.dst_port}","${f.protocol}","${f.packet_count}","${f.byte_count}","${f.prediction}","${f.anomaly_score}","${f.attack_type || 'N/A'}","${f.model}","${f.data_mode}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="netshield_traffic_flows.csv"');
    return res.send(headers + rows);
  }

  res.status(400).json({ error: "Unsupported export type. Use 'alerts' or 'traffic'." });
});

router.get('/audit', (req, res) => {
  const limit = req.query.limit || 100;
  res.json({ logs: AuditService.getLogs(limit) });
});

module.exports = router;

