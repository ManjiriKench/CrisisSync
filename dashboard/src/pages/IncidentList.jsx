// ============================================================
// IncidentList — Full filterable incident table
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import useIncidentStore from '../store/incidentStore';
import './IncidentList.css';

const typeIcons = { medical: '🏥', fire: '🔥', security: '🛡️', infrastructure: '⚡', other: '⚠️' };

export default function IncidentList() {
  const { incidents, isLoading } = useIncidentStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');

  let filtered = incidents.filter((i) => {
    const matchSearch =
      !searchTerm ||
      i.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.incidentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(i.location?.floor).includes(searchTerm) ||
      i.location?.room?.includes(searchTerm);
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    const matchType = typeFilter === 'all' || (i.aiClassification?.type || i.type) === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  if (sortBy === 'created') {
    filtered = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === 'severity') {
    filtered = filtered.sort((a, b) => (b.severity || 0) - (a.severity || 0));
  }

  return (
    <div className="page-container incident-list-page">
      <div className="page-header">
        <div>
          <h1>Incidents</h1>
          <p>{incidents.length} total · {incidents.filter(i => i.status === 'open').length} open</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="list-filters">
        <input
          className="list-search"
          placeholder="Search incidents, rooms, IDs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          id="incident-search"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} id="status-filter">
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} id="type-filter">
          <option value="all">All Types</option>
          <option value="medical">Medical</option>
          <option value="fire">Fire</option>
          <option value="security">Security</option>
          <option value="infrastructure">Infrastructure</option>
          <option value="other">Other</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} id="sort-filter">
          <option value="created">Newest First</option>
          <option value="severity">Severity</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Incident ID</th>
              <th>Description</th>
              <th>Location</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Reported</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32 }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                No incidents match your filters.
              </td></tr>
            ) : (
              filtered.map((incident) => {
                const type = incident.aiClassification?.type || incident.type || 'other';
                const sev = incident.severity || 2;
                return (
                  <tr
                    key={incident.incidentId}
                    className="incident-row"
                    onClick={() => navigate(`/incidents/${incident.incidentId}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span className={`badge badge-type-${type}`}>
                        {typeIcons[type]} {type}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {incident.incidentId}
                      </code>
                    </td>
                    <td className="desc-cell">
                      {incident.description?.substring(0, 70)}{incident.description?.length > 70 ? '…' : ''}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem' }}>
                        Floor {incident.location?.floor ?? '?'}
                        {incident.location?.room ? ` · Rm ${incident.location.room}` : ''}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-severity-${sev}`}>{sev}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${incident.status?.replace('_', '-')}`}>
                        {incident.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {incident.createdAt
                        ? formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })
                        : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="list-footer">Showing {filtered.length} of {incidents.length} incidents</div>
    </div>
  );
}
