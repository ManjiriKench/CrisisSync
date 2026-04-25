// ============================================================
// Gemini AI Configuration
// USE_MOCK_SERVICES=true → returns simulated triage responses
// USE_MOCK_SERVICES=false → real Gemini 1.5 Flash API call
// ============================================================

import 'dotenv/config';
const USE_MOCK = process.env.USE_MOCK_SERVICES !== 'false';

// ── REAL GEMINI CLIENT (commented — enable when USE_MOCK_SERVICES=false) ────
/*
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
*/

// ── MOCK TRIAGE LOGIC ────────────────────────────────────────
// Heuristic classifier that mimics Gemini output based on keywords
function mockClassify(description) {
  const text = description.toLowerCase();

  // Type detection
  let type = 'other';
  if (/fire|smoke|flame|burning|evacuate/.test(text)) type = 'fire';
  else if (/medical|collapsed|unconscious|unresponsive|chest pain|breathing|heart|seizure|injured/.test(text)) type = 'medical';
  else if (/fight|theft|assault|suspicious|weapon|threat|robbery|security/.test(text)) type = 'security';
  else if (/flood|leak|power|elevator|stuck|broken|outage|gas/.test(text)) type = 'infrastructure';

  // Severity scoring 1-5
  let severity = 2;
  if (/unresponsive|unconscious|not breathing|collapsed|life/.test(text)) severity = 5;
  else if (/severe|serious|urgent|critical|chest pain|bleed/.test(text)) severity = 4;
  else if (/injured|pain|stuck|threat|fire|smoke/.test(text)) severity = 3;
  else if (/minor|small|little|slow/.test(text)) severity = 1;

  // Recommended actions
  const actionsMap = {
    medical: [
      'Dispatch first responder to location immediately',
      'Retrieve AED from nearest emergency station',
      'Clear area and do not move victim',
      'Call emergency services if unresponsive',
    ],
    fire: [
      'Activate fire alarm system',
      'Initiate evacuation for affected floor',
      'Contact fire department immediately',
      'Account for all guests via roll call',
    ],
    security: [
      'Dispatch security personnel to location',
      'Do not engage — observe and report',
      'Lock down adjacent areas if threat confirmed',
      'Contact local police if physical threat',
    ],
    infrastructure: [
      'Dispatch maintenance team to location',
      'Isolate affected area from guests',
      'Check adjacent systems for cascading failure',
      'Update guest services on any service disruption',
    ],
    other: [
      'Investigate reported incident',
      'Dispatch available staff to location',
      'Document all findings in incident log',
    ],
  };

  const escalate911 = severity >= 4 && (type === 'medical' || type === 'fire' || type === 'security');
  const confidence = 0.72 + Math.random() * 0.22;

  return {
    type,
    severity,
    actions: actionsMap[type] || actionsMap.other,
    confidence: parseFloat(confidence.toFixed(2)),
    escalate911,
  };
}

export async function runGeminiTriage(description) {
  if (USE_MOCK) {
    // Simulate slight network delay for realism
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));
    return mockClassify(description);
  }

  // ── REAL GEMINI CALL (uncomment when USE_MOCK_SERVICES=false) ───────────
  /*
  const systemPrompt = `You are an emergency triage AI for a hospitality venue.
Classify incidents accurately. Be conservative on severity.
If in doubt, escalate.`;

  const userPrompt = `Classify this incident: ${description}
Respond ONLY in valid JSON, no markdown, no preamble:
{
  "type": "medical|fire|security|infrastructure|other",
  "severity": 1,
  "actions": ["immediate step 1", "step 2"],
  "confidence": 0.0,
  "escalate911": false
}`;

  const chat = geminiModel.startChat({
    history: [{ role: 'user', parts: [{ text: systemPrompt }] }],
  });
  const result = await chat.sendMessage(userPrompt);
  const text = result.response.text().trim();
  return JSON.parse(text);
  */
}

export { USE_MOCK };
