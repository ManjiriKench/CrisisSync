// ============================================================
// StaffManagement — Staff with live floor positions
// ============================================================

import { useState, useEffect } from 'react';
import { hotels } from '../services/api';
import useAuthStore from '../store/authStore';
import './StaffManagement.css';

const roleColors = {
  staff: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  manager: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  admin: 'linear-gradient(135deg, #06b6d4, #0891b2)',
};

export default function StaffManagement() {
  const user = useAuthStore((s) => s.user);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hotels.getStaff(user?.hotelId || 'hotel-grand-palace')
      .then((res) => {
        setStaffList(res.staff || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Group by floor
  const byFloor = staffList.reduce((acc, s) => {
    const floor = s.currentFloor ?? 'Unknown';
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(s);
    return acc;
  }, {});

  const floorKeys = Object.keys(byFloor).sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return Number(b) - Number(a);
  });

  return (
    <div className="page-container staff-page">
      <div className="page-header">
        <div>
          <h1>Staff Management</h1>
          <p>{staffList.length} staff members · Live floor positions</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="staff-summary">
        <div className="staff-summary-card">
          <div className="staff-summary-value">{staffList.length}</div>
          <div className="staff-summary-label">Total Staff On Duty</div>
        </div>
        <div className="staff-summary-card">
          <div className="staff-summary-value">{Object.keys(byFloor).filter(k => k !== 'Unknown').length}</div>
          <div className="staff-summary-label">Floors with Coverage</div>
        </div>
        <div className="staff-summary-card">
          <div className="staff-summary-value">{byFloor['Unknown']?.length || 0}</div>
          <div className="staff-summary-label">Location Unknown</div>
        </div>
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" style={{ width: 36, height: 36 }} /></div>
      ) : (
        <div className="staff-floors">
          {floorKeys.map((floor) => (
            <div key={floor} className="staff-floor-group">
              <div className="staff-floor-header">
                <span className="staff-floor-label">
                  {floor === 'Unknown' ? '📍 Location Unknown' : `📍 Floor ${floor}`}
                </span>
                <span className="staff-floor-count">{byFloor[floor].length} staff</span>
              </div>
              <div className="staff-cards">
                {byFloor[floor].map((s) => (
                  <div key={s.userId} className="staff-card">
                    <div className="staff-card-avatar" style={{ background: roleColors[s.role] || roleColors.staff }}>
                      {s.name?.[0]}
                    </div>
                    <div className="staff-card-info">
                      <strong>{s.name}</strong>
                      <span>{s.email}</span>
                    </div>
                    <div className="staff-card-floor">
                      <div className={`staff-status-dot ${floor !== 'Unknown' ? 'active' : ''}`} />
                      {floor !== 'Unknown' ? `Floor ${floor}` : 'Offline'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
