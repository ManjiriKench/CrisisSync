// Incident Routes
// Full CRUD + assign + audit endpoints

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, mockStore } from '../config/firebase.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { sosRateLimit } from '../middleware/rateLimit.js';
import { triageIncident } from '../services/aiTriage.js';
import { handleEscalation } from '../services/twilioEscalation.js';
import { syncIncidentToRTDB } from '../services/realtimeSync.js';
import { notifyStaffAssignment } from '../services/notificationService.js';
import { appendAuditLog, getAuditLogs } from '../services/auditService.js';

const router = Router();

// POST /incidents — Guest SOS (no auth, rate-limited) OR authenticated user
router.post('/', sosRateLimit, optionalAuth, async (req, res) => {
  try {
    const { description, floor, room, area, hotelId: bodyHotelId } = req.body;

    if (!description || description.trim().length < 3) {
      return res.status(400).json({ error: 'Description is required (min 3 chars)' });
    }

    const incidentId = 'INC-' + uuidv4().slice(0, 8).toUpperCase();
    const hotelId = req.user?.hotelId || bodyHotelId || 'hotel-grand-palace';

    const incident = {
      incidentId,
      hotelId,
      reportedBy: req.user?.userId || 'guest',
      type: 'other', // will be updated by AI triage
      severity: 2, // default, updated by AI
      status: 'open',
      location: {
        floor: floor || 1,
        room: room || null,
        area: area || null,
      },
      description: description.trim(),
      aiClassification: null,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };

    // Save to Firestore
    await db.collection('incidents').doc(incidentId).set(incident);

    // Broadcast to RT DB IMMEDIATELY (before AI triage)
    await syncIncidentToRTDB(hotelId, incidentId, {
      incidentId,
      status: 'open',
      type: 'pending_triage',
      severity: 2,
      location: incident.location,
      description: incident.description,
      createdAt: incident.createdAt,
    });

    // Audit log
    await appendAuditLog({
      incidentId,
      actorId: incident.reportedBy,
      action: 'incident_created',
      details: { description: incident.description, location: incident.location },
    });

    console.log(`\n🆕 Incident ${incidentId} created — starting AI triage async...\n`);

    // AI triage runs ASYNC (non-blocking — incident is returned to client immediately)
    triageIncident(incidentId, description, hotelId).then(async (classification) => {
      if (classification) {
        // Check for escalation
        const updatedIncident = {
          ...incident,
          aiClassification: classification,
          severity: classification.severity,
          type: classification.type,
        };

        if (classification.escalate911 && classification.severity >= 4) {
          await db.collection('incidents').doc(incidentId).update({ status: 'escalated' });
          await syncIncidentToRTDB(hotelId, incidentId, { status: 'escalated' });
          updatedIncident.status = 'escalated';
          await handleEscalation(updatedIncident);

          await appendAuditLog({
            incidentId,
            actorId: 'system',
            action: 'incident_escalated',
            details: { reason: 'AI triage triggered 911 escalation', severity: classification.severity },
          });
        }
      }
    });

    res.status(201).json({
      message: 'Incident reported successfully. AI triage in progress.',
      incident,
    });
  } catch (err) {
    console.error('Create incident error:', err);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// GET /incidents — List all (role-filtered)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { role, hotelId, userId } = req.user;
    let incidents = Object.values(mockStore.incidents);

    // Role-based filtering
    if (role === 'staff') {
      const assignedIds = Object.values(mockStore.assignments)
        .filter((a) => a.staffId === userId)
        .map((a) => a.incidentId);
      incidents = incidents.filter((i) => assignedIds.includes(i.incidentId));
    } else if (role === 'manager' || role === 'admin') {
      incidents = incidents.filter((i) => i.hotelId === hotelId);
    }

    // Sort newest first
    incidents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ count: incidents.length, incidents });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list incidents' });
  }
});

// GET /incidents/:id — Full incident detail
router.get('/:id', requireAuth, async (req, res) => {
  const incident = mockStore.incidents[req.params.id];
  if (!incident) return res.status(404).json({ error: 'Incident not found' });
  res.json(incident);
});

// PATCH /incidents/:id — Update status/notes
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const incident = mockStore.incidents[req.params.id];
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const { status, notes } = req.body;
    const updates = {};

    if (status) {
      updates.status = status;
      if (status === 'resolved') updates.resolvedAt = new Date().toISOString();
    }
    if (notes) updates.notes = notes;

    await db.collection('incidents').doc(req.params.id).update(updates);
    await syncIncidentToRTDB(incident.hotelId, req.params.id, updates);
    await appendAuditLog({
      incidentId: req.params.id,
      actorId: req.user.userId,
      action: 'incident_updated',
      details: updates,
    });

    res.json({ message: 'Incident updated', updates });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

// POST /incidents/:id/assign — Assign staff to incident
router.post('/:id/assign', requireAuth, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const incident = mockStore.incidents[req.params.id];
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const { staffId } = req.body;
    if (!staffId) return res.status(400).json({ error: 'staffId required' });

    const staff = mockStore.users[staffId];
    if (!staff || staff.role !== 'staff') return res.status(404).json({ error: 'Staff not found' });

    const assignId = 'ASN-' + uuidv4().slice(0, 8).toUpperCase();
    const assignment = {
      assignId,
      incidentId: req.params.id,
      staffId,
      status: 'assigned',
      assignedAt: new Date().toISOString(),
    };

    await db.collection('assignments').doc(assignId).set(assignment);
    await db.collection('incidents').doc(req.params.id).update({ status: 'assigned' });
    await syncIncidentToRTDB(incident.hotelId, req.params.id, {
      status: 'assigned',
      assignedTo: { staffId, name: staff.name },
    });

    // Notify staff
    await notifyStaffAssignment(staff, incident);

    await appendAuditLog({
      incidentId: req.params.id,
      actorId: req.user.userId,
      action: 'staff_assigned',
      details: { staffId, staffName: staff.name, assignId },
    });

    res.json({ message: `Assigned ${staff.name} to incident`, assignment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign staff' });
  }
});

// GET /incidents/:id/audit — Immutable audit trail
router.get('/:id/audit', requireAuth, async (req, res) => {
  try {
    const logs = await getAuditLogs(req.params.id);
    res.json({ incidentId: req.params.id, count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
