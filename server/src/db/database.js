/**
 * NetShield AI - SQLite Database Manager
 * Uses Node.js 22+ native DatabaseSync module for zero-dependency, ultra-fast persistence.
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DATA_DIR = path.resolve(__dirname, '../../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'netshield.db');
const db = new DatabaseSync(DB_PATH);

// Initialize tables
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS traffic_flows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp REAL NOT NULL,
      src_ip TEXT,
      dst_ip TEXT,
      src_port INTEGER,
      dst_port INTEGER,
      protocol TEXT,
      duration REAL,
      packet_count INTEGER,
      byte_count INTEGER,
      packet_rate REAL,
      byte_rate REAL,
      data_mode TEXT DEFAULT 'SIMULATED',
      prediction TEXT DEFAULT 'NORMAL',
      anomaly_score REAL DEFAULT 0.0,
      attack_type TEXT,
      confidence REAL,
      model TEXT,
      raw_json TEXT
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp REAL NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      src_ip TEXT,
      dst_ip TEXT,
      dst_port INTEGER,
      protocol TEXT,
      attack_type TEXT,
      model TEXT,
      anomaly_score REAL,
      status TEXT DEFAULT 'UNREVIEWED',
      remediation TEXT,
      contributing_factors TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp REAL NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      source TEXT DEFAULT 'SYSTEM'
    );

    CREATE TABLE IF NOT EXISTS training_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp REAL NOT NULL,
      dataset_name TEXT,
      status TEXT,
      metrics_json TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_flows_timestamp ON traffic_flows(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
  `);

  console.log(`[Database] SQLite connected and initialized at ${DB_PATH}`);
}

initSchema();

module.exports = {
  db,
  DB_PATH
};

