// Auth Routes
// POST /auth/login — JWT + refresh token (no auth required)

import { Router } from 'express';
import { mockStore } from '../config/firebase.js';
import { generateTokens } from '../middleware/auth.js';

const router = Router();

// POST /auth/login
// Body: { email, password } or { role } for demo/mock mode
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;

  // Mock mode: accept role-based login for demo
  if (role) {
    const user = Object.values(mockStore.users).find((u) => u.role === role);
    if (!user) {
      return res.status(401).json({ error: `No user found with role: ${role}` });
    }
    const tokens = generateTokens(user);
    return res.json({
      ...tokens,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        hotelId: user.hotelId,
      },
    });
  }

  // Email-based login (mock: match email, ignore password)
  const user = Object.values(mockStore.users).find((u) => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const tokens = generateTokens(user);
  res.json({
    ...tokens,
    user: {
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      hotelId: user.hotelId,
    },
  });
});

// POST /auth/refresh (not fully implemented — placeholder)
router.post('/refresh', (req, res) => {
  res.json({ message: 'Refresh token endpoint — implement with real Firebase auth' });
});

export default router;
