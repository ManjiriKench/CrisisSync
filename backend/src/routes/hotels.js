// Hotel Routes
// Staff list, floor map config

import { Router } from 'express';
import { mockStore } from '../config/firebase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /hotels/:id/staff — All staff with live floor positions
router.get('/:id/staff', requireAuth, requireRole('manager', 'admin'), (req, res) => {
  const hotelId = req.params.id;
  const staff = Object.values(mockStore.users).filter(
    (u) => u.hotelId === hotelId && u.role === 'staff'
  );

  res.json({
    hotelId,
    count: staff.length,
    staff: staff.map((s) => ({
      userId: s.userId,
      name: s.name,
      email: s.email,
      currentFloor: s.currentFloor,
      deviceToken: undefined, // don't expose
    })),
  });
});

// GET /hotels/:id/map — Floor map config with live incident + staff pins
router.get('/:id/map', requireAuth, (req, res) => {
  const hotelId = req.params.id;
  const hotel = mockStore.hotels[hotelId];
  if (!hotel) return res.status(404).json({ error: 'Hotel not found' });

  const incidents = Object.values(mockStore.incidents)
    .filter((i) => i.hotelId === hotelId && i.status !== 'resolved')
    .map((i) => ({
      incidentId: i.incidentId,
      type: i.type || i.aiClassification?.type || 'other',
      severity: i.severity,
      status: i.status,
      floor: i.location?.floor,
      room: i.location?.room,
      area: i.location?.area,
    }));

  const staff = Object.values(mockStore.users)
    .filter((u) => u.hotelId === hotelId && u.role === 'staff')
    .map((s) => ({
      userId: s.userId,
      name: s.name,
      currentFloor: s.currentFloor,
    }));

  res.json({
    hotel: {
      name: hotel.name,
      totalFloors: hotel.totalFloors,
    },
    floors: Array.from({ length: hotel.totalFloors }, (_, i) => ({
      floor: i + 1,
      roomsPerFloor: 20,
      layout: 'standard', // SVG overlay type
    })),
    incidents,
    staff,
  });
});

// GET /hotels/:id — Hotel details
router.get('/:id', requireAuth, (req, res) => {
  const hotel = mockStore.hotels[req.params.id];
  if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
  res.json(hotel);
});

export default router;
