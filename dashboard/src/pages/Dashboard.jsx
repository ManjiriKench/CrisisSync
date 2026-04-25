// ============================================================
// Dashboard Layout — wraps all sub-pages
// ============================================================

import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import SOSAlert from '../components/SOSAlert';
import useIncidentStore from '../store/incidentStore';
import useAuthStore from '../store/authStore';
import LiveFeed from './LiveFeed';
import IncidentMap from './IncidentMap';
import IncidentList from './IncidentList';
import IncidentDetail from './IncidentDetail';
import StaffManagement from './StaffManagement';
import Reports from './Reports';
import './Dashboard.css';

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { incidents, fetchIncidents, startRealtimeSync } = useIncidentStore();
  const [sosAlert, setSosAlert] = useState(null);
  const [prevCount, setPrevCount] = useState(0);

  const openCount = incidents.filter(
    (i) => ['open', 'escalated'].includes(i.status)
  ).length;

  useEffect(() => {
    fetchIncidents();
    const cleanup = startRealtimeSync(user?.hotelId);
    return cleanup;
  }, []);

  // Detect new critical incidents for SOS overlay
  useEffect(() => {
    if (incidents.length > prevCount && prevCount > 0) {
      const newest = incidents[0];
      if (newest && (newest.status === 'escalated' || newest.severity >= 4)) {
        setSosAlert(newest);
      }
    }
    setPrevCount(incidents.length);
  }, [incidents.length]);

  return (
    <div className="app-layout">
      <Sidebar liveCount={openCount} />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<LiveFeed />} />
          <Route path="/map" element={<IncidentMap />} />
          <Route path="/incidents" element={<IncidentList />} />
          <Route path="/incidents/:id" element={<IncidentDetail />} />
          <Route path="/staff" element={<StaffManagement />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>

      {sosAlert && (
        <SOSAlert incident={sosAlert} onDismiss={() => setSosAlert(null)} />
      )}
    </div>
  );
}
