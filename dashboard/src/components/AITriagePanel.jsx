// ============================================================
// AITriagePanel — Gemini AI classification result display
// ============================================================

import './AITriagePanel.css';

const typeColors = {
  medical: 'var(--type-medical)',
  fire: 'var(--type-fire)',
  security: 'var(--type-security)',
  infrastructure: 'var(--type-infrastructure)',
  other: 'var(--type-other)',
};

const severityDesc = [
  '', 'Minimal — Non-urgent, can be handled during normal operations',
  'Low — Requires attention but not immediately life-threatening',
  'Moderate — Significant incident requiring prompt response',
  'High — Serious risk, immediate response required',
  'Critical — Life-threatening, all resources deploy immediately',
];

export default function AITriagePanel({ classification }) {
  if (!classification) {
    return (
      <div className="card ai-triage-panel ai-pending">
        <div className="ai-triage-header">
          <span className="ai-badge">🤖 Gemini AI Triage</span>
        </div>
        <div className="ai-pending-state">
          <div className="spinner" />
          <p>AI analysis in progress…</p>
        </div>
      </div>
    );
  }

  const { type, severity, actions, confidence, escalate911 } = classification;
  const confidencePct = Math.round((confidence || 0) * 100);
  const color = typeColors[type] || typeColors.other;

  return (
    <div className="card ai-triage-panel" style={{ '--ai-color': color }}>
      <div className="ai-triage-header">
        <span className="ai-badge">🤖 Gemini AI Triage</span>
        <span className="ai-confidence">
          <span className="confidence-bar-wrap">
            <span className="confidence-bar" style={{ width: `${confidencePct}%` }} />
          </span>
          {confidencePct}% confidence
        </span>
      </div>

      <div className="ai-triage-results">
        <div className="ai-result-item">
          <span className="ai-result-label">Classified Type</span>
          <span className="ai-result-value ai-type" style={{ color }}>
            {type?.charAt(0).toUpperCase() + type?.slice(1)}
          </span>
        </div>

        <div className="ai-result-item">
          <span className="ai-result-label">Severity Score</span>
          <div className="severity-score-row">
            <div className="severity-dots">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className={`severity-dot ${n <= severity ? 'filled' : ''} dot-${n <= severity ? severity : 0}`}
                />
              ))}
            </div>
            <span className="severity-text">{severity}/5 — {severityDesc[severity]}</span>
          </div>
        </div>

        <div className="ai-result-item">
          <span className="ai-result-label">Emergency Escalation</span>
          <span className={`ai-escalate-badge ${escalate911 ? 'escalated' : 'clear'}`}>
            {escalate911 ? '🚨 911 Call Auto-Initiated' : '✅ No Escalation Required'}
          </span>
        </div>
      </div>
    </div>
  );
}
