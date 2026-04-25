// JWT Authentication Middleware
// Verifies Bearer token, attaches decoded user to req.user
// Roles: guest (no token), staff, manager, admin

import jwt from 'jsonwebtoken';
import { mockStore } from '../config/firebase.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token expired or invalid' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
    }
    next();
  };
}

// Optional auth — attaches user if token present, continues anyway (for guest SOS)
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    } catch (_) {
      req.user = null;
    }
  }
  next();
}

// Generate JWT for a user
export function generateTokens(user) {
  const payload = {
    userId: user.userId,
    hotelId: user.hotelId,
    role: user.role,
    name: user.name,
    email: user.email,
  };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
  const refreshToken = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}
