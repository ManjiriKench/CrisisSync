// ============================================================
// KPICard — Animated metric card for reports
// ============================================================

import './KPICard.css';

export default function KPICard({ icon, label, value, sub, color, trend }) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color || 'var(--accent-blue)' }}>
      <div className="kpi-icon-wrap">
        <span className="kpi-icon">{icon}</span>
      </div>
      <div className="kpi-body">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
      {trend !== undefined && (
        <div className={`kpi-trend ${trend >= 0 ? 'up' : 'down'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}
