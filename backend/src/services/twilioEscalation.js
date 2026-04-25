// Twilio Escalation Service
// Auto-initiates voice call to emergency services when escalate911=true AND severity>=4

import { makeEmergencyCall } from '../config/twilio.js';
import { appendAuditLog } from './auditService.js';

export async function handleEscalation(incident) {
  const { aiClassification } = incident;

  if (!aiClassification?.escalate911 || aiClassification.severity < 4) {
    return null;
  }

  console.log(`\n🚨🚨🚨 ESCALATION TRIGGERED for incident ${incident.incidentId}`);
  console.log(`   Type: ${aiClassification.type}, Severity: ${aiClassification.severity}`);

  try {
    const callResult = await makeEmergencyCall({
      ...incident,
      hotelName: 'Grand Palace Hotel',
    });

    await appendAuditLog({
      incidentId: incident.incidentId,
      actorId: 'system:twilio',
      action: 'emergency_call_initiated',
      details: {
        callSid: callResult.sid,
        to: process.env.EMERGENCY_NUMBER,
        status: callResult.status,
        severity: aiClassification.severity,
        type: aiClassification.type,
      },
    });

    console.log(`✅ [Escalation] Call initiated: ${callResult.sid}\n`);
    return callResult;
  } catch (err) {
    console.error('❌ [Escalation] Failed to initiate call:', err.message);
    return null;
  }
}
