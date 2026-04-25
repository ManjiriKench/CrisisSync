// Notification Routes
// Manager broadcast to all on-duty staff

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { broadcastToAllStaff } from '../services/notificationService.js';
import { broadcastAlert } from '../services/realtimeSync.js';

const router = Router();

// POST /notifications/broadcast — Manager broadcast
router.post('/broadcast', requireAuth, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length < 1) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const hotelId = req.user.hotelId;

    // Push notifications to all staff
    const results = await broadcastToAllStaff(hotelId, message.trim());

    // Also write to RT DB for live clients
    await broadcastAlert(hotelId, message.trim());

    res.json({
      message: 'Broadcast sent',
      recipientCount: results.length,
      notifications: results,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

export default router;
