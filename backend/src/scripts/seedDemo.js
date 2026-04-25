// ============================================================
// Demo Seed Script
// Run: npm run seed
// Populates mock store with sample incidents for demo
// ============================================================

import { mockStore } from '../config/firebase.js';
import { triageIncident } from '../services/aiTriage.js';

const demoIncidents = [
  {
    incidentId: 'INC-DEMO-001',
    hotelId: 'hotel-grand-palace',
    reportedBy: 'guest',
    description: 'Guest collapsed in room 412, appears unresponsive. Not breathing normally.',
    location: { floor: 4, room: '412', area: 'Guest Room' },
    status: 'escalated',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    incidentId: 'INC-DEMO-002',
    hotelId: 'hotel-grand-palace',
    reportedBy: 'staff-001',
    description: 'Smoke detected in kitchen ventilation system on floor 2. No visible flames yet.',
    location: { floor: 2, room: null, area: 'Kitchen' },
    status: 'in_progress',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    incidentId: 'INC-DEMO-003',
    hotelId: 'hotel-grand-palace',
    reportedBy: 'guest',
    description: 'Suspicious person loitering near elevator on floor 6, wearing dark hoodie, acting erratic.',
    location: { floor: 6, room: null, area: 'Elevator Lobby' },
    status: 'assigned',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    incidentId: 'INC-DEMO-004',
    hotelId: 'hotel-grand-palace',
    reportedBy: 'guest',
    description: 'Water leaking from ceiling in room 305, large puddle forming on floor.',
    location: { floor: 3, room: '305', area: 'Guest Room' },
    status: 'open',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    incidentId: 'INC-DEMO-005',
    hotelId: 'hotel-grand-palace',
    reportedBy: 'guest',
    description: 'Minor slip and fall in lobby area. Guest has small bruise on knee, walking fine.',
    location: { floor: 1, room: null, area: 'Main Lobby' },
    status: 'resolved',
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    resolvedAt: new Date(Date.now() - 90 * 60000).toISOString(),
  },
];

async function seed() {
  console.log('🌱 Seeding demo data...\n');

  for (const incident of demoIncidents) {
    // Run AI triage
    const classification = await triageIncident(
      incident.incidentId,
      incident.description,
      incident.hotelId
    );

    const full = {
      ...incident,
      type: classification?.type || 'other',
      severity: classification?.severity || 2,
      aiClassification: classification,
      resolvedAt: incident.resolvedAt || null,
    };

    mockStore.incidents[incident.incidentId] = full;
    console.log(`  ✅ ${incident.incidentId}: ${classification?.type} (severity ${classification?.severity})`);
  }

  // Create some assignments
  mockStore.assignments['ASN-DEMO-001'] = {
    assignId: 'ASN-DEMO-001',
    incidentId: 'INC-DEMO-001',
    staffId: 'staff-001',
    status: 'in_progress',
    assignedAt: new Date(Date.now() - 40 * 60000).toISOString(),
  };
  mockStore.assignments['ASN-DEMO-002'] = {
    assignId: 'ASN-DEMO-002',
    incidentId: 'INC-DEMO-003',
    staffId: 'staff-002',
    status: 'assigned',
    assignedAt: new Date(Date.now() - 10 * 60000).toISOString(),
  };

  // Create audit logs
  const auditEntries = [
    { logId: 'LOG-001', incidentId: 'INC-DEMO-001', actorId: 'guest', action: 'incident_created', details: { description: demoIncidents[0].description }, ts: demoIncidents[0].createdAt },
    { logId: 'LOG-002', incidentId: 'INC-DEMO-001', actorId: 'system:gemini', action: 'ai_triage_completed', details: { type: 'medical', severity: 5 }, ts: new Date(Date.now() - 44 * 60000).toISOString() },
    { logId: 'LOG-003', incidentId: 'INC-DEMO-001', actorId: 'system:twilio', action: 'emergency_call_initiated', details: { callSid: 'MOCK-CALL-DEMO' }, ts: new Date(Date.now() - 44 * 60000).toISOString() },
    { logId: 'LOG-004', incidentId: 'INC-DEMO-001', actorId: 'manager-001', action: 'staff_assigned', details: { staffId: 'staff-001', staffName: 'Marcus Johnson' }, ts: new Date(Date.now() - 40 * 60000).toISOString() },
    { logId: 'LOG-005', incidentId: 'INC-DEMO-001', actorId: 'staff-001', action: 'incident_updated', details: { status: 'in_progress', note: 'En route to room 412' }, ts: new Date(Date.now() - 38 * 60000).toISOString() },
  ];

  for (const entry of auditEntries) {
    mockStore.audit_logs[entry.logId] = entry;
  }

  console.log(`\n🌱 Seed complete: ${demoIncidents.length} incidents, ${Object.keys(mockStore.assignments).length} assignments, ${auditEntries.length} audit logs`);
  console.log('   Now start the server: npm run dev\n');
}

seed().catch(console.error);
