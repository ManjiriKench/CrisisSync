// Notification Service
// FCM Push + Twilio SMS dispatch for staff assignments and broadcast

import { db, mockStore } from '../config/firebase.js';
import { sendSMS } from '../config/twilio.js';
import { v4 as uuidv4 } from 'uuid';

// ── REAL FCM (commented — enable when USE_MOCK_SERVICES=false) ────
/*
import { getMessaging } from 'firebase-admin/messaging';

async function sendFCMPush(deviceToken, title, body, data = {}) {
  const message = {
    token: deviceToken,
    notification: { title, body },
    data,
  };
  return getMessaging().send(message);
}
*/

async function sendFCMPush(deviceToken, title, body, data = {}) {
  console.log(`📲 [MOCK FCM] Push to ${deviceToken.slice(0, 16)}...`);
  console.log(`   Title: ${title}`);
  console.log(`   Body: ${body}`);
  return { messageId: 'mock-fcm-' + Date.now() };
}

export async function notifyStaffAssignment(staffUser, incident) {
  const notifId = uuidv4();
  const message = `New assignment: ${incident.aiClassification?.type || 'unknown'} incident (severity ${incident.severity}) — Floor ${incident.location?.floor}, Room ${incident.location?.room || 'N/A'}`;

  // Push notification
  try {
    await sendFCMPush(
      staffUser.deviceToken || 'no-token',
      '🚨 New Incident Assignment',
      message,
      { incidentId: incident.incidentId }
    );
  } catch (err) {
    console.error('FCM push failed:', err.message);
  }

  // Save notification record
  const notif = {
    notifId,
    incidentId: incident.incidentId,
    recipientId: staffUser.userId,
    channel: 'push',
    message,
    status: 'sent',
    sentAt: new Date().toISOString(),
  };
  await db.collection('notifications').doc(notifId).set(notif);
  return notif;
}

export async function broadcastToAllStaff(hotelId, message) {
  const staffUsers = Object.values(mockStore.users).filter(
    (u) => u.hotelId === hotelId && u.role === 'staff'
  );

  const results = [];
  for (const staff of staffUsers) {
    const notifId = uuidv4();
    try {
      await sendFCMPush(staff.deviceToken || 'no-token', '📢 Manager Broadcast', message);
      const notif = {
        notifId,
        incidentId: null,
        recipientId: staff.userId,
        channel: 'push',
        message,
        status: 'sent',
        sentAt: new Date().toISOString(),
      };
      await db.collection('notifications').doc(notifId).set(notif);
      results.push(notif);
    } catch (err) {
      console.error(`Broadcast to ${staff.name} failed:`, err.message);
    }
  }

  console.log(`📢 [Broadcast] Sent to ${results.length} staff members`);
  return results;
}
