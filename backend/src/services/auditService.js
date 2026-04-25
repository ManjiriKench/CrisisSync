// Audit Log Service
// Append-only immutable log — no update/delete permitted

import { db } from '../config/firebase.js';
import { v4 as uuidv4 } from 'uuid';

export async function appendAuditLog({ incidentId, actorId, action, details }) {
  const logId = uuidv4();
  const entry = {
    logId,
    incidentId,
    actorId,
    action,
    details: details || {},
    ts: new Date().toISOString(),
  };

  await db.collection('audit_logs').doc(logId).set(entry);
  return entry;
}

export async function getAuditLogs(incidentId) {
  const snapshot = await db.collection('audit_logs')
    .where('incidentId', '==', incidentId)
    .get();

  const logs = [];
  snapshot.docs.forEach((doc) => logs.push(doc.data()));
  return logs.sort((a, b) => new Date(a.ts) - new Date(b.ts));
}
