// ============================================================
// IncidentMap — SVG floor plan with incident + staff pins
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hotels } from '../services/api';
import useAuthStore from '../store/authStore';
import useIncidentStore from '../store/incidentStore';
import './IncidentMap.css';

const TOTAL_FLOORS = 8;
const ROOMS_PER_FLOOR = 10;

const typeColors = {
  medical: '#ef4444', fire: '#f97316', security: '#a855f7',
  infrastructure: '#06b6d4', other: '#64748b', pending_triage: '#94a3b8',
};

const statusSize = { open: 18, assigned: 16, in_progress: 16, escalated: 22, resolved: 12 };

function FloorSVG({ floor, incidents, staff, onPinClick }) {
  const floorIncidents = incidents.filter((i) => i.floor === floor);
  const floorStaff = staff.filter((s) => s.currentFloor === floor);
  const width = 680;
  const height = 160;
  const roomW = width / ROOMS_PER_FLOOR;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="floor-svg">
      {/* Floor background */}
      <rect x="0" y="0" width={width} height={height} rx="8" fill="rgba(26,32,53,0.8)" />
      
      {/* Room cells */}
      {Array.from({ length: ROOMS_PER_FLOOR }, (_, i) => {
        const roomNum = floor * 100 + i + 1;
        const hasIncident = floorIncidents.some((inc) => String(inc.room) === String(roomNum));
        return (
          <g key={i}>
            <rect
              x={i * roomW + 2}
              y={20}
              width={roomW - 4}
              height={height - 40}
              rx="4"
              fill={hasIncident ? 'rgba(239,68,68,0.08)' : 'rgba(148,163,184,0.04)'}
              stroke={hasIncident ? 'rgba(239,68,68,0.3)' : 'rgba(148,163,184,0.1)'}
              strokeWidth="1"
            />
            <text
              x={i * roomW + roomW / 2}
              y={height - 8}
              textAnchor="middle"
              fontSize="9"
              fill="rgba(148,163,184,0.4)"
              fontFamily="JetBrains Mono, monospace"
            >
              {floor}{String(i + 1).padStart(2, '0')}
            </text>
          </g>
        );
      })}

      {/* Corridor line */}
      <line x1={10} y1={height / 2} x2={width - 10} y2={height / 2} stroke="rgba(148,163,184,0.07)" strokeWidth="1" strokeDasharray="6 4" />

      {/* Incident pins */}
      {floorIncidents.map((inc, idx) => {
        const roomIdx = inc.room ? (parseInt(String(inc.room).slice(-2)) - 1) % ROOMS_PER_FLOOR : idx % ROOMS_PER_FLOOR;
        const cx = roomIdx * roomW + roomW / 2;
        const cy = height / 2 - 10;
        const color = typeColors[inc.type] || typeColors.other;
        const size = statusSize[inc.status] || 16;
        return (
          <g key={inc.incidentId} onClick={() => onPinClick && onPinClick(inc)} style={{ cursor: 'pointer' }}>
            <circle cx={cx} cy={cy} r={size / 2 + 4} fill={color} opacity={0.15} />
            <circle cx={cx} cy={cy} r={size / 2} fill={color} stroke="white" strokeWidth="2" />
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
              {inc.severity || '?'}
            </text>
            {inc.status === 'escalated' && (
              <circle cx={cx} cy={cy} r={size / 2 + 8} fill="none" stroke={color} strokeWidth="2" opacity={0.4}>
                <animate attributeName="r" from={size / 2 + 4} to={size / 2 + 14} dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}

      {/* Staff pins */}
      {floorStaff.map((s, idx) => {
        const staffX = width - 40 - idx * 36;
        const staffY = height / 2 + 20;
        return (
          <g key={s.userId}>
            <circle cx={staffX} cy={staffY} r={10} fill="#8b5cf6" stroke="white" strokeWidth="2" />
            <text x={staffX} y={staffY + 4} textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">
              {s.name?.[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function IncidentMap() {
  const user = useAuthStore((s) => s.user);
  const { incidents } = useIncidentStore();
  const navigate = useNavigate();
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [mapData, setMapData] = useState({ staff: [], floors: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hotels.getMap(user?.hotelId || 'hotel-grand-palace')
      .then((data) => {
        setMapData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved').map((i) => ({
    incidentId: i.incidentId,
    type: i.aiClassification?.type || i.type || 'other',
    severity: i.severity || 2,
    status: i.status,
    floor: i.location?.floor,
    room: i.location?.room,
  }));

  const floorsToShow = selectedFloor ? [selectedFloor] : Array.from({ length: TOTAL_FLOORS }, (_, i) => TOTAL_FLOORS - i);

  return (
    <div className="page-container map-page">
      <div className="page-header">
        <div>
          <h1>Floor Map</h1>
          <p>Live incident + staff positions across all floors · {activeIncidents.length} active incidents</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className={`btn btn-ghost btn-sm ${!selectedFloor ? 'active' : ''}`} onClick={() => setSelectedFloor(null)}>
            All Floors
          </button>
          {Array.from({ length: TOTAL_FLOORS }, (_, i) => TOTAL_FLOORS - i).map((f) => (
            <button
              key={f}
              className={`floor-btn ${selectedFloor === f ? 'active' : ''} ${activeIncidents.some(i => i.floor === f) ? 'has-incident' : ''}`}
              onClick={() => setSelectedFloor(f === selectedFloor ? null : f)}
              id={`floor-btn-${f}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="map-legend">
        {Object.entries(typeColors).filter(([k]) => k !== 'pending_triage').map(([type, color]) => (
          <span key={type} className="legend-item">
            <span className="legend-dot" style={{ background: color }} />{type}
          </span>
        ))}
        <span className="legend-item"><span className="legend-dot" style={{ background: '#8b5cf6' }} />staff</span>
      </div>

      {/* Floor Maps */}
      <div className="floors-container">
        {floorsToShow.map((floor) => {
          const floorIncidents = activeIncidents.filter((i) => i.floor === floor);
          const floorStaff = mapData.staff?.filter((s) => s.currentFloor === floor) || [];
          return (
            <div key={floor} className="floor-row">
              <div className="floor-label">
                <span className="floor-num">F{floor}</span>
                {floorIncidents.length > 0 && (
                  <span className="floor-incident-count">{floorIncidents.length}</span>
                )}
                {floorStaff.length > 0 && (
                  <span className="floor-staff-count">👤{floorStaff.length}</span>
                )}
              </div>
              <div className="floor-map-wrap">
                <FloorSVG
                  floor={floor}
                  incidents={floorIncidents}
                  staff={floorStaff}
                  onPinClick={(inc) => navigate(`/incidents/${inc.incidentId}`)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
