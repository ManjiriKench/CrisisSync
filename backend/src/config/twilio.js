// ============================================================
// Twilio Configuration
// USE_MOCK_SERVICES=true → logs calls/SMS to console
// USE_MOCK_SERVICES=false → real Twilio voice call + SMS
// ============================================================

import 'dotenv/config';
const USE_MOCK = process.env.USE_MOCK_SERVICES !== 'false';

// ── REAL TWILIO CLIENT (commented — enable when USE_MOCK_SERVICES=false) ────
/*
import twilio from 'twilio';
export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
*/

export async function makeEmergencyCall(incident) {
  const script = buildCallScript(incident);

  if (USE_MOCK) {
    console.log('\n🚨 [MOCK TWILIO] Emergency voice call triggered');
    console.log(`   To: ${process.env.EMERGENCY_NUMBER}`);
    console.log(`   Script: ${script}`);
    console.log('   Status: call-initiated (mock)\n');
    return { sid: 'MOCK-CALL-' + Date.now(), status: 'initiated' };
  }

  // ── REAL TWILIO VOICE CALL (uncomment when USE_MOCK_SERVICES=false) ────
  /*
  const call = await twilioClient.calls.create({
    to: process.env.EMERGENCY_NUMBER,
    from: process.env.TWILIO_FROM_NUMBER,
    twiml: `<Response><Say voice="alice">${script}</Say></Response>`,
    record: false,
  });
  return { sid: call.sid, status: call.status };
  */
}

export async function sendSMS(to, message) {
  if (USE_MOCK) {
    console.log(`\n📱 [MOCK TWILIO SMS] To: ${to}\n   Message: ${message}\n`);
    return { sid: 'MOCK-SMS-' + Date.now(), status: 'sent' };
  }

  // ── REAL TWILIO SMS (uncomment when USE_MOCK_SERVICES=false) ────
  /*
  const msg = await twilioClient.messages.create({
    to,
    from: process.env.TWILIO_FROM_NUMBER,
    body: message,
  });
  return { sid: msg.sid, status: msg.status };
  */
}

function buildCallScript(incident) {
  return [
    'This is an automated emergency alert from CrisisSync hotel safety system.',
    `Incident type: ${incident.aiClassification?.type || incident.type}.`,
    `Severity level: ${incident.severity} out of 5.`,
    `Location: Floor ${incident.location?.floor}, Room ${incident.location?.room || 'unknown'}.`,
    `Description: ${incident.description?.substring(0, 200)}.`,
    `Hotel: ${incident.hotelName || 'Grand Palace Hotel'}.`,
    'On-site emergency response has been activated.',
    'Please respond to this location immediately.',
    'This message will repeat once.',
    'This is an automated emergency alert from CrisisSync.',
    `Incident: ${incident.aiClassification?.type || incident.type}, Severity ${incident.severity}.`,
    `Floor ${incident.location?.floor}, Hotel ${incident.hotelName || 'Grand Palace Hotel'}.`,
  ].join(' ');
}

export { USE_MOCK };
