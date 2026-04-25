// User Routes
// Location updates for staff

import { Router } from 'express';
import { db, mockStore } from '../config/firebase.js';
import { requireAuth } from '../middleware/auth.js';
import { syncStaffLocation } from '../services/realtimeSync.js';

const router = Router();

// PATCH /users/:id/location — Update staff floor position
router.patch('/:id/location', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { floor, area } = req.body;

    if (!floor && floor !== 0) {
      return res.status(400).json({ error: 'floor is required' });
    }

    // Update in Firestore
    if (mockStore.users[id]) {
      mockStore.users[id].currentFloor = floor;
    }
    await db.collection('users').doc(id).update({ currentFloor: floor });

    // Sync to Realtime DB for live map
    const hotelId = req.user.hotelId;
    await syncStaffLocation(hotelId, id, { floor, area });

    res.json({ message: 'Location updated', floor, area });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// GET /users/me — Current user profile
router.get('/me', requireAuth, (req, res) => {
  const user = mockStore.users[req.user.userId];
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
    hotelId: user.hotelId,
    currentFloor: user.currentFloor,
  });
});

export default router;
