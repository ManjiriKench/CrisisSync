// ============================================================
// IncidentDetail — Full view with AI triage + audit log
// ============================================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import useIncidentStore from '../store/incidentStore';
import useAuthStore from '../store/authStore';
import AssignStaffModal from '../components/AssignStaffModal';
import AuditLog from '../components/AuditLog';
import AITriagePanel from '../components/AITriagePanel';
import './IncidentDetail.css';

const typeIcons = { medical: '🏥', fire: '🔥', security: '🛡️', infrastructure: '⚡', other: '⚠️' };

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { selectedIncident, auditLogs, fetchIncident, fetchAuditLogs, updateIncident } = useIncidentStore();
  const [showAssign, setShowAssign] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchIncident(id);
      fetchAuditLogs(id);
    }
  }, [id]);

  const incident = selectedIncident;
  if (!incident) {
    return (
      <div className="loading-page">
        <div className="spinner" style={{ width: 36, height: 36 }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading incident...</p>
      </div>
    );
  }

  const { aiClassification, location, description, status, severity, type, createdAt, resolvedAt, incidentId } = incident;
  const resolvedType = aiClassification?.type || type || 'other';

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    await updateIncident(incidentId, { status: newStatus });
    await fetchIncident(incidentId);
    await fetchAuditLogs(incidentId);
    setUpdating(false);
  };

  const nextActions = {
    open: ['assigned', 'in_progress'],
    assigned: ['in_progress', 'resolved'],
    in_progress: ['resolved'],
    escalated: ['in_progress', 'resolved'],
    resolved: [],
  };

  return (
    <div className="page-container incident-detail-page">
      {/* Header */}
      <div className="detail-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} id="back-btn">
          ← Back
        </button>
        <div className="detail-title-row">
          <span className="detail-type-icon">{typeIcons[resolvedType] || '⚠️'}</span>
          <div>
            <h1>{resolvedType.charAt(0).toUpperCase() + resolvedType.slice(1)} Incident</h1>
            <code className="incident-id">{incidentId}</code>
          </div>
          <div className="detail-badges">
            <span className={`badge badge-${status.replace('_', '-')}`}>{status.replace('_', ' ')}</span>
            <span className={`badge badge-severity-${severity || 2}`}>Severity {severity || 2}</span>
            {status === 'escalated' && <span className="badge badge-escalated">🚨 911 Initiated</span>}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Left Column */}
        <div className="detail-left">
          {/* Core Info */}
          <div className="card">
            <h3 className="card-section-title">Incident Report</h3>
            <p className="detail-description">{description}</p>
            <div className="detail-info-grid">
              <div className="detail-info-item">
                <span className="detail-info-label">Location</span>
                <span>
                  Floor {location?.floor ?? '?'}
                  {location?.room ? `, Room ${location.room}` : ''}
                  {location?.area ? ` — ${location.area}` : ''}
                </span>
              </div>
              <div className="detail-info-item">
                <span className="detail-info-label">Reported by</span>
                <span>{incident.reportedBy === 'guest' ? '👤 Guest (unauthenticated)' : incident.reportedBy}</span>
              </div>
              <div className="detail-info-item">
                <span className="detail-info-label">Created</span>
                <span>
                  {createdAt && format(new Date(createdAt), 'PPpp')}
                  {' '}({createdAt && formatDistanceToNow(new Date(createdAt), { addSuffix: true })})
                </span>
              </div>
              {resolvedAt && (
                <div className="detail-info-item">
                  <span className="detail-info-label">Resolved</span>
                  <span>{format(new Date(resolvedAt), 'PPpp')}</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Triage Panel */}
          <AITriagePanel classification={aiClassification} />

          {/* Audit Log */}
          <AuditLog logs={auditLogs} />
        </div>

        {/* Right Column */}
        <div className="detail-right">
          {/* Actions */}
          {user?.role !== 'staff' && (
            <div className="card">
              <h3 className="card-section-title">Manager Actions</h3>
              <div className="action-buttons">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAssign(true)}
                  disabled={status === 'resolved'}
                  id="assign-btn"
                >
                  👤 Assign Staff
                </button>
                {nextActions[status]?.map((s) => (
                  <button
                    key={s}
                    className="btn btn-ghost"
                    onClick={() => handleStatusChange(s)}
                    disabled={updating}
                    id={`status-${s}-btn`}
                  >
                    {updating ? <span className="spinner" /> : null}
                    {s === 'in_progress' ? '⚙️ Mark In Progress' :
                     s === 'resolved' ? '✅ Mark Resolved' :
                     s === 'assigned' ? '👤 Mark Assigned' : s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Staff Actions */}
          {user?.role === 'staff' && nextActions[status]?.length > 0 && (
            <div className="card">
              <h3 className="card-section-title">My Actions</h3>
              <div className="action-buttons">
                {nextActions[status].map((s) => (
                  <button
                    key={s}
                    className={`btn ${s === 'in_progress' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => handleStatusChange(s)}
                    disabled={updating}
                    id={`staff-status-${s}-btn`}
                  >
                    {s === 'in_progress' ? '🚗 En Route / In Progress' : '✅ Mark Resolved'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Actions List */}
          {aiClassification?.actions?.length > 0 && (
            <div className="card">
              <h3 className="card-section-title">🤖 Recommended Actions</h3>
              <ol className="ai-actions-list">
                {aiClassification.actions.map((action, i) => (
                  <li key={i}>
                    <span className="action-num">{i + 1}</span>
                    {action}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>

      {showAssign && (
        <AssignStaffModal incident={incident} onClose={() => setShowAssign(false)} />
      )}
    </div>
  );
}
