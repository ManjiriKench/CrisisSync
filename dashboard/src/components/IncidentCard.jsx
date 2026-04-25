// ============================================================
// IncidentCard — severity-colored card with status badge
// ============================================================

import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import './IncidentCard.css';

const typeIcons = {
  medical: '🏥', fire: '🔥', security: '🛡️', infrastructure: '⚡', other: '⚠️', pending_triage: '🔍',
};

const severityLabels = { 1: 'Minimal', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Critical' };

export default function IncidentCard({ incident, compact = false }) {
  const navigate = useNavigate();
  const { incidentId, type, severity, status, location, description, createdAt, aiClassification } = incident;
  const resolvedType = aiClassification?.type || type || 'other';
  const resolvedSeverity = aiClassification?.severity || severity || 2;

  return (
    <div
      className={`incident-card severity-border-${resolvedSeverity} ${compact ? 'compact' : ''}`}
      onClick={() => navigate(`/incidents/${incidentId}`)}
      role="button"
      tabIndex={0}
    >
      <div className="incident-card-header">
        <div className="incident-type-icon">{typeIcons[resolvedType] || '⚠️'}</div>
        <div className="incident-meta">
          <div className="incident-title">
            <span className={`badge badge-type-${resolvedType}`}>{resolvedType}</span>
            <span className={`badge badge-${status.replace('_', '-')}`}>{status.replace('_', ' ')}</span>
            {(status === 'escalated' || resolvedSeverity === 5) && (
              <span className="badge badge-escalated">🚨 911</span>
            )}
          </div>
          <div className="incident-id-row">
            <code className="incident-id">{incidentId}</code>
            <span className="incident-time">
              {createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : '—'}
            </span>
          </div>
        </div>
        <div className={`severity-orb severity-orb-${resolvedSeverity}`}>
          <span>{resolvedSeverity}</span>
          <small>{severityLabels[resolvedSeverity]}</small>
        </div>
      </div>

      {!compact && (
        <p className="incident-desc">{description?.substring(0, 120)}{description?.length > 120 ? '…' : ''}</p>
      )}

      <div className="incident-location">
        <span>📍</span>
        <span>Floor {location?.floor ?? '?'}</span>
        {location?.room && <span>· Room {location.room}</span>}
        {location?.area && <span>· {location.area}</span>}
      </div>

      {!compact && aiClassification && (
        <div className="incident-ai-preview">
          <span className="ai-tag">🤖 AI</span>
          <span>Confidence: {Math.round((aiClassification.confidence || 0) * 100)}%</span>
          {aiClassification.escalate911 && <span className="ai-escalate">· Auto-911 triggered</span>}
        </div>
      )}
    </div>
  );
}
