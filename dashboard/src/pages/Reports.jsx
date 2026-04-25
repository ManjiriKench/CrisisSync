// ============================================================
// Reports — KPI summary, charts, CSV export
// ============================================================

import { useState, useEffect } from 'react';
import { reports as reportsAPI } from '../services/api';
import KPICard from '../components/KPICard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import './Reports.css';

const TYPE_COLORS = {
  medical: '#ef4444', fire: '#f97316', security: '#a855f7',
  infrastructure: '#06b6d4', other: '#64748b',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || 'var(--accent-blue)' }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    reportsAPI.summary()
      .then((data) => {
        setSummary(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await reportsAPI.exportCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'crisissync-incidents.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="loading-page"><div className="spinner" style={{ width: 36, height: 36 }} /></div>;
  }

  if (!summary) {
    return (
      <div className="page-container">
        <div className="page-header"><h1>Reports</h1></div>
        <p style={{ color: 'var(--text-muted)' }}>No data available. Run the backend and seed demo data.</p>
      </div>
    );
  }

  const typeData = Object.entries(summary.typeBreakdown || {}).map(([name, value]) => ({ name, value }));
  const hourlyData = (summary.hourlyActivity || []).filter((h) => h.count > 0).slice(0, 24);
  const severityData = Object.entries(summary.severityDistribution || {}).map(([sev, count]) => ({
    name: `Sev ${sev}`, value: count, sev: Number(sev),
  }));

  return (
    <div className="page-container reports-page">
      <div className="page-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Operational metrics and incident analytics</p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={handleExport}
          disabled={exporting}
          id="export-csv-btn"
        >
          {exporting ? <span className="spinner" /> : '⬇️'} Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <KPICard icon="📋" label="Total Incidents" value={summary.total} color="var(--accent-blue)" />
        <KPICard icon="🔴" label="Open" value={summary.open} color="var(--status-open)" />
        <KPICard icon="✅" label="Resolved" value={summary.resolved} color="var(--status-resolved)" />
        <KPICard icon="🚨" label="Escalated" value={summary.escalated} color="var(--severity-5)" />
        <KPICard icon="📊" label="Resolution Rate" value={summary.resolutionRate} color="var(--accent-cyan)" />
        <KPICard
          icon="⏱️"
          label="Avg Response Time"
          value={summary.avgResponseTime?.formatted || 'N/A'}
          color="var(--accent-purple)"
          sub="created → resolved"
        />
      </div>

      {/* Charts grid */}
      <div className="reports-charts-grid">
        {/* Incident Type Pie */}
        <div className="card report-chart-card">
          <h3 className="card-section-title">Incidents by Type</h3>
          {typeData.length === 0 ? (
            <div className="chart-empty">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {typeData.map((entry) => (
                    <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Severity Distribution Bar */}
        <div className="card report-chart-card">
          <h3 className="card-section-title">Severity Distribution</h3>
          {severityData.length === 0 ? (
            <div className="chart-empty">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={severityData} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry) => (
                    <Cell
                      key={entry.sev}
                      fill={
                        entry.sev === 5 ? '#ef4444' :
                        entry.sev === 4 ? '#f97316' :
                        entry.sev === 3 ? '#eab308' :
                        entry.sev === 2 ? '#84cc16' : '#22c55e'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Hourly Activity */}
        {hourlyData.length > 0 && (
          <div className="card report-chart-card report-chart-wide">
            <h3 className="card-section-title">Incident Activity by Hour</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={hourlyData} barCategoryGap="20%">
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}
                  tickFormatter={(h) => `${h}:00`} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="var(--accent-blue)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
