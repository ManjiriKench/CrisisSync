// AI Triage Service
// Wraps Gemini classification and attaches result to incident asynchronously

import { runGeminiTriage } from '../config/gemini.js';
import { db } from '../config/firebase.js';
import { syncIncidentToRTDB } from './realtimeSync.js';
import { appendAuditLog } from './auditService.js';

export async function triageIncident(incidentId, description, hotelId) {
  try {
    console.log(`🤖 [AI Triage] Processing incident ${incidentId}...`);
    const classification = await runGeminiTriage(description);

    // Update incident with AI classification
    const incidentRef = db.collection('incidents').doc(incidentId);
    await incidentRef.update({
      aiClassification: classification,
      type: classification.type,
      severity: classification.severity,
    });

    // Sync to realtime DB
    await syncIncidentToRTDB(hotelId, incidentId, {
      aiClassification: classification,
      type: classification.type,
      severity: classification.severity,
    });

    // Audit log
    await appendAuditLog({
      incidentId,
      actorId: 'system:gemini',
      action: 'ai_triage_completed',
      details: {
        type: classification.type,
        severity: classification.severity,
        confidence: classification.confidence,
        escalate911: classification.escalate911,
        actionsCount: classification.actions.length,
      },
    });

    console.log(`✅ [AI Triage] Incident ${incidentId}: ${classification.type} (severity ${classification.severity}, confidence ${classification.confidence})`);

    return classification;
  } catch (err) {
    console.error(`❌ [AI Triage] Error for ${incidentId}:`, err.message);
    return null;
  }
}
