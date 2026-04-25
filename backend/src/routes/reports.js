// Report Routes
// KPI summary + CSV export

import { Router } from 'express';
import { mockStore } from '../config/firebase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /reports/summary — KPIs: avg response time, open count, resolution rate
router.get('/summary', requireAuth, requireRole('manager', 'admin'), (req, res) => {
  const hotelId = req.user.hotelId;
  const incidents = Object.values(mockStore.incidents).filter((i) => i.hotelId === hotelId);

  const total = incidents.length;
  const open = incidents.filter((i) => ['open', 'assigned', 'in_progress'].includes(i.status)).length;
  const resolved = incidents.filter((i) => i.status === 'resolved').length;
  const escalated = incidents.filter((i) => i.status === 'escalated').length;

  // Calculate avg response time (created → resolved)
  const resolvedIncidents = incidents.filter((i) => i.resolvedAt && i.createdAt);
  let avgResponseTimeMs = 0;
  if (resolvedIncidents.length > 0) {
    const totalMs = resolvedIncidents.reduce((sum, i) => {
      return sum + (new Date(i.resolvedAt) - new Date(i.createdAt));
    }, 0);
    avgResponseTimeMs = totalMs / resolvedIncidents.length;
  }

  // Type breakdown
  const typeBreakdown = {};
  incidents.forEach((i) => {
    const t = i.type || i.aiClassification?.type || 'other';
    typeBreakdown[t] = (typeBreakdown[t] || 0) + 1;
  });

  // Severity distribution
  const severityDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  incidents.forEach((i) => {
    const s = i.severity || 2;
    severityDist[s] = (severityDist[s] || 0) + 1;
  });

  // Hourly activity (last 24h)
  const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: incidents.filter((inc) => {
      const h = new Date(inc.createdAt).getHours();
      return h === i;
    }).length,
  }));

  res.json({
    hotelId,
    total,
    open,
    resolved,
    escalated,
    resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(1) + '%' : '0%',
    avgResponseTime: {
      ms: Math.round(avgResponseTimeMs),
      formatted: formatDuration(avgResponseTimeMs),
    },
    typeBreakdown,
    severityDistribution: severityDist,
    hourlyActivity,
  });
});

// GET /reports/export — Download incidents as CSV
router.get('/export', requireAuth, requireRole('manager', 'admin'), (req, res) => {
  const hotelId = req.user.hotelId;
  const incidents = Object.values(mockStore.incidents).filter((i) => i.hotelId === hotelId);

  const headers = ['Incident ID', 'Type', 'Severity', 'Status', 'Floor', 'Room', 'Description', 'Reported By', 'Created At', 'Resolved At'];
  const rows = incidents.map((i) => [
    i.incidentId,
    i.type || '',
    i.severity || '',
    i.status,
    i.location?.floor || '',
    i.location?.room || '',
    `"${(i.description || '').replace(/"/g, '""')}"`,
    i.reportedBy,
    i.createdAt,
    i.resolvedAt || '',
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=crisissync-incidents.csv');
  res.send(csv);
});

function formatDuration(ms) {
  if (ms === 0) return 'N/A';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export default router;
