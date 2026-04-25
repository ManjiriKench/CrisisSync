// ============================================================
// AssignStaffModal — Assign staff to an incident
// ============================================================

import { useState, useEffect } from 'react';
import { hotels } from '../services/api';
import useAuthStore from '../store/authStore';
import useIncidentStore from '../store/incidentStore';
import './AssignStaffModal.css';

export default function AssignStaffModal({ incident, onClose }) {
  const user = useAuthStore((s) => s.user);
  const assignStaff = useIncidentStore((s) => s.assignStaff);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    hotels.getStaff(user?.hotelId || 'hotel-grand-palace')
      .then((res) => {
        setStaffList(res.staff || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAssign = async () => {
    if (!selectedStaff) return;
    setAssigning(true);
    setError(null);
    try {
      await assignStaff(incident.incidentId, selectedStaff);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.message || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content assign-modal" onClick={(e) => e.stopPropagation()}>
        <div className="assign-modal-header">
          <h2>Assign Staff</h2>
          <p>
            Select a staff member to respond to{' '}
            <code>{incident.incidentId}</code>
          </p>
          <button className="btn btn-ghost btn-sm assign-close" onClick={onClose}>✕</button>
        </div>

        <div className="assign-incident-info">
          <span>📍 Floor {incident.location?.floor}</span>
          {incident.location?.room && <span>Room {incident.location.room}</span>}
          <span className={`badge badge-severity-${incident.severity || 2}`}>
            Severity {incident.severity || 2}
          </span>
        </div>

        {success ? (
          <div className="assign-success">✅ Staff assigned successfully!</div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : (
          <>
            <div className="staff-list">
              {staffList.map((s) => (
                <button
                  key={s.userId}
                  className={`staff-item ${selectedStaff === s.userId ? 'selected' : ''}`}
                  onClick={() => setSelectedStaff(s.userId)}
                  id={`staff-select-${s.userId}`}
                >
                  <div className="staff-avatar">{s.name?.[0]}</div>
                  <div className="staff-info">
                    <strong>{s.name}</strong>
                    <span>
                      {s.currentFloor ? `Floor ${s.currentFloor}` : 'Location unknown'}
                    </span>
                  </div>
                  {selectedStaff === s.userId && <span className="check">✓</span>}
                </button>
              ))}
            </div>

            {error && <div className="assign-error">❌ {error}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={!selectedStaff || assigning}
                onClick={handleAssign}
                id="confirm-assign-btn"
              >
                {assigning ? <span className="spinner" /> : null} Assign Staff
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
