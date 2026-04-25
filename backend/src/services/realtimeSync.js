// Realtime Sync Service
// Writes incident status changes to Firebase Realtime DB for sub-100ms broadcast

import { rtdb } from '../config/firebase.js';

export async function syncIncidentToRTDB(hotelId, incidentId, data) {
  try {
    const path = `hotels/${hotelId}/incidents/${incidentId}`;
    await rtdb.ref(path).update({
      ...data,
      lastUpdated: Date.now(),
    });
    console.log(`⚡ [RT Sync] ${path} updated`);
  } catch (err) {
    console.error('❌ [RT Sync] Error:', err.message);
  }
}

export async function syncStaffLocation(hotelId, userId, location) {
  try {
    const path = `hotels/${hotelId}/staff/${userId}/location`;
    await rtdb.ref(path).set({
      ...location,
      lastSeen: Date.now(),
    });
  } catch (err) {
    console.error('❌ [RT Sync Staff] Error:', err.message);
  }
}

export async function broadcastAlert(hotelId, message) {
  try {
    const path = `hotels/${hotelId}/alerts/current`;
    await rtdb.ref(path).set({
      message,
      timestamp: Date.now(),
    });
    console.log(`📢 [RT Broadcast] Alert sent to hotel ${hotelId}`);
  } catch (err) {
    console.error('❌ [RT Broadcast] Error:', err.message);
  }
}
