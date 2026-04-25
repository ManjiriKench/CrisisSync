// ============================================================
// SOSAlert — Full-screen blinking overlay for critical incidents
// ============================================================

import './SOSAlert.css';

const typeIcons = {
  medical: '🏥', fire: '🔥', security: '🛡️', infrastructure: '⚡', other: '⚠️',
};

export default function SOSAlert({ incident, onDismiss }) {
  const { aiClassification, location, description, incidentId, severity } = incident;
  const type = aiClassification?.type || incident.type || 'other';

  return (
    <div className="sos-overlay" role="alertdialog" aria-modal="true">
      <div className="sos-modal">
        <div className="sos-pulse-ring" />
        <div className="sos-icon">{typeIcons[type] || '🚨'}</div>
        <div className="sos-badge">SEVERITY {severity || aiClassification?.severity} — {type.toUpperCase()}</div>
        <h2>New Critical Incident</h2>
        <p className="sos-description">{description?.substring(0, 180)}</p>
        <div className="sos-location">
          📍 Floor {location?.floor ?? '?'}{location?.room ? `, Room ${location.room}` : ''}{location?.area ? ` — ${location.area}` : ''}
        </div>
        <div className="sos-id">{incidentId}</div>
        {incident.status === 'escalated' && (
          <div className="sos-escalated">🚨 911 CALL INITIATED AUTOMATICALLY</div>
        )}
        <div className="sos-actions">
          <button className="btn btn-danger btn-lg" onClick={onDismiss} id="sos-dismiss-btn">
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
