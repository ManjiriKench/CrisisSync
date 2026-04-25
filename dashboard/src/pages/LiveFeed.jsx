// ============================================================
// LiveFeed — Real-time incident stream (Home page)
// ============================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useIncidentStore from '../store/incidentStore';
import useAuthStore from '../store/authStore';
import { notifications } from '../services/api';
import IncidentCard from '../components/IncidentCard';
import KPICard from '../components/KPICard';
import BroadcastModal from '../components/BroadcastModal';
import './LiveFeed.css';

const FILTERS = ['all', 'open', 'escalated', 'assigned', 'in_progress', 'resolved'];

export default function LiveFeed() {
  const { incidents, isLoading, lastUpdate } = useIncidentStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [demoSOSLoading, setDemoSOSLoading] = useState(false);

  const filtered = incidents.filter((i) => filter === 'all' || i.status === filter);

  const stats = {
    total: incidents.length,
    open: incidents.filter((i) => i.status === 'open').length,
    escalated: incidents.filter((i) => i.status === 'escalated').length,
    inProgress: incidents.filter((i) => i.status === 'in_progress').length,
    resolved: incidents.filter((i) => i.status === 'resolved').length,
  };

  // Demo SOS simulation
  const { createIncident, fetchIncidents } = useIncidentStore();
  const handleDemoSOS = async () => {
    setDemoSOSLoading(true);
    try {
      await createIncident({
        description: 'Guest collapsed in room 412, unresponsive. Not breathing normally.',
        floor: 4,
        room: '412',
        area: 'Guest Room',
        hotelId: user?.hotelId || 'hotel-grand-palace',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setDemoSOSLoading(false);
    }
  };

  return (
    <div className="page-container livefeed-page">
      <div className="page-header">
        <div>
          <h1>Live Operations Feed</h1>
          <p>
            Real-time incident stream · Auto-refreshes every 5s ·{' '}
            <span className="live-dot" /> Last sync {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : '—'}
          </p>
        </div>
        <div className="livefeed-actions">
          {user?.role !== 'staff' && (
            <button
              className="btn btn-ghost"
              onClick={() => setShowBroadcast(true)}
              id="broadcast-btn"
            >
              📢 Broadcast
            </button>
          )}
          <button
            className="btn btn-danger"
            onClick={handleDemoSOS}
            disabled={demoSOSLoading}
            id="demo-sos-btn"
          >
            {demoSOSLoading ? <span className="spinner" /> : '🆘'} Demo SOS
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid livefeed-stats">
        <KPICard icon="📋" label="Total Incidents" value={stats.total} color="var(--accent-blue)" />
        <KPICard icon="🔴" label="Open" value={stats.open} color="var(--status-open)" />
        <KPICard icon="🚨" label="Escalated" value={stats.escalated} color="var(--severity-5)" />
        <KPICard icon="⚙️" label="In Progress" value={stats.inProgress} color="var(--status-in-progress)" />
        <KPICard icon="✅" label="Resolved" value={stats.resolved} color="var(--status-resolved)" />
      </div>

      {/* Filter Tabs */}
      <div className="livefeed-filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
            id={`filter-${f}`}
          >
            {f === 'all' ? 'All' : f.replace('_', ' ')}
            {f !== 'all' && (
              <span className="filter-count">
                {incidents.filter((i) => i.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Incident Stream */}
      <div className="livefeed-stream">
        {isLoading && incidents.length === 0 ? (
          <div className="loading-page">
            <div className="spinner" style={{ width: 36, height: 36 }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading incidents...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>No {filter === 'all' ? '' : filter} incidents</h3>
            <p>
              {filter === 'all'
                ? 'All clear. Press "Demo SOS" to simulate an emergency.'
                : `No incidents with status: ${filter}`}
            </p>
            <button className="btn btn-ghost" onClick={handleDemoSOS}>
              🆘 Simulate SOS
            </button>
          </div>
        ) : (
          filtered.map((incident) => (
            <IncidentCard key={incident.incidentId} incident={incident} />
          ))
        )}
      </div>

      {showBroadcast && (
        <BroadcastModal onClose={() => setShowBroadcast(false)} />
      )}
    </div>
  );
}
