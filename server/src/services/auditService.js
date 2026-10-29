/**
 * NetShield AI - Audit Logging Service
 * Records security monitoring actions, mode transitions, and user actions.
 */

const { db } = require('../db/database');

class AuditService {
  static log(action, details = '', source = 'SYSTEM') {
    try {
      const stmt = db.prepare(`
        INSERT INTO audit_logs (timestamp, action, details, source)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(Date.now() / 1000, action, details, source);
    } catch (err) {
      console.error('[AuditService] Failed logging audit entry:', err.message);
    }
  }

  static getLogs(limit = 100) {
    return db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?').all(Number(limit) || 100);
  }
}

module.exports = AuditService;

