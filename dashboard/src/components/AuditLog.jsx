// ============================================================
// AuditLog — Immutable timestamped log viewer
// ============================================================

import { format } from 'date-fns';
import './AuditLog.css';

const actionIcons = {
  incident_created: '📝',
  ai_triage_completed: '🤖',
  emergency_call_initiated: '📞',
  staff_assigned: '👤',
  incident_updated: '✏️',
  incident_escalated: '🚨',
  incident_resolved: '✅',
};

const actorColors = {
  'system:gemini': 'var(--accent-blue)',
  'system:twilio': 'var(--accent-cyan)',
  'system': 'var(--accent-purple)',
  'guest': 'var(--text-muted)',
};

function getActorColor(actorId) {
  if (actorColors[actorId]) return actorColors[actorId];
  if (actorId?.startsWith('manager-')) return '#3b82f6';
  if (actorId?.startsWith('staff-')) return '#8b5cf6';
  return 'var(--text-muted)';
}

export default function AuditLog({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="card audit-log-card">
        <h3 className="card-section-title">🔒 Audit Log (Immutable)</h3>
        <div className="audit-empty">No audit entries yet.</div>
      </div>
    );
  }

  return (
    <div className="card audit-log-card">
      <h3 className="card-section-title">🔒 Audit Log (Immutable)</h3>
      <div className="audit-timeline">
        {logs.map((log, index) => (
          <div key={log.logId || index} className="audit-entry">
            <div className="audit-line">
              <div className="audit-dot" />
              {index < logs.length - 1 && <div className="audit-connector" />}
            </div>
            <div className="audit-content">
              <div className="audit-header-row">
                <span className="audit-action-icon">{actionIcons[log.action] || '📌'}</span>
                <span className="audit-action">{log.action.replace(/_/g, ' ')}</span>
                <span className="audit-time">
                  {log.ts ? format(new Date(log.ts), 'HH:mm:ss · MMM d') : '—'}
                </span>
              </div>
              <div className="audit-actor" style={{ color: getActorColor(log.actorId) }}>
                {log.actorId}
              </div>
              {log.details && Object.keys(log.details).length > 0 && (
                <div className="audit-details">
                  {Object.entries(log.details).map(([k, v]) => (
                    <span key={k} className="audit-detail-pill">
                      <strong>{k}:</strong> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
