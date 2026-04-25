// ============================================================
// BroadcastModal — Manager broadcast to all on-duty staff
// ============================================================

import { useState } from 'react';
import { notifications } from '../services/api';
import './BroadcastModal.css';

const templates = [
  'All staff: Please report to your designated emergency stations immediately.',
  'Fire drill in progress. This is a test — please follow evacuation procedures.',
  'Code Blue on Floor 4 — Medical personnel respond immediately.',
  'Security alert: All staff maintain heightened awareness. Report suspicious activity.',
  'All clear. Resume normal operations. Thank you for your response.',
];

export default function BroadcastModal({ onClose }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await notifications.broadcast(message.trim());
      setSent(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error('Broadcast failed:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content broadcast-modal" onClick={(e) => e.stopPropagation()}>
        <div className="broadcast-header">
          <span className="broadcast-icon">📢</span>
          <div>
            <h2>Staff Broadcast</h2>
            <p>Sends push notification to all on-duty staff</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {sent ? (
          <div className="broadcast-success">
            <div className="broadcast-success-icon">✅</div>
            <h3>Broadcast Sent!</h3>
            <p>All staff have been notified.</p>
          </div>
        ) : (
          <>
            <div className="broadcast-templates">
              <p className="templates-label">Quick templates:</p>
              {templates.map((t, i) => (
                <button
                  key={i}
                  className="template-btn"
                  onClick={() => setMessage(t)}
                  id={`template-${i}`}
                >
                  {t.substring(0, 70)}...
                </button>
              ))}
            </div>

            <textarea
              className="broadcast-input"
              placeholder="Type your broadcast message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              id="broadcast-message-input"
            />
            <div className="broadcast-char-count">{message.length}/500</div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleSend}
                disabled={sending || !message.trim()}
                id="send-broadcast-btn"
              >
                {sending ? <span className="spinner" /> : '📢'} Send to All Staff
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
