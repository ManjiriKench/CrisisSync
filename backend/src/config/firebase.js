// ============================================================
// Firebase Admin SDK Configuration
// USE_MOCK_SERVICES=true → uses in-memory mock store
// USE_MOCK_SERVICES=false → connects to real Firebase
// ============================================================

import 'dotenv/config';

const USE_MOCK = process.env.USE_MOCK_SERVICES !== 'false';

// ── MOCK STORE ────────────────────────────────────────────────
// In-memory database that mimics Firestore + Realtime DB
export const mockStore = {
  hotels: {
    'hotel-grand-palace': {
      hotelId: 'hotel-grand-palace',
      name: 'Grand Palace Hotel',
      address: '123 Main Street, New York, NY 10001',
      totalFloors: 8,
      adminEmail: 'admin@grandpalace.com',
    },
  },
  users: {
    'manager-001': {
      userId: 'manager-001', hotelId: 'hotel-grand-palace',
      name: 'Sarah Chen', email: 'sarah@grandpalace.com',
      role: 'manager', deviceToken: 'fcm-token-manager-001',
      currentFloor: null, createdAt: new Date('2024-01-01').toISOString(),
    },
    'staff-001': {
      userId: 'staff-001', hotelId: 'hotel-grand-palace',
      name: 'Marcus Johnson', email: 'marcus@grandpalace.com',
      role: 'staff', deviceToken: 'fcm-token-staff-001',
      currentFloor: 3, createdAt: new Date('2024-01-01').toISOString(),
    },
    'staff-002': {
      userId: 'staff-002', hotelId: 'hotel-grand-palace',
      name: 'Priya Patel', email: 'priya@grandpalace.com',
      role: 'staff', deviceToken: 'fcm-token-staff-002',
      currentFloor: 6, createdAt: new Date('2024-01-01').toISOString(),
    },
    'staff-003': {
      userId: 'staff-003', hotelId: 'hotel-grand-palace',
      name: 'James Rivera', email: 'james@grandpalace.com',
      role: 'staff', deviceToken: 'fcm-token-staff-003',
      currentFloor: 1, createdAt: new Date('2024-01-01').toISOString(),
    },
    'admin-001': {
      userId: 'admin-001', hotelId: 'hotel-grand-palace',
      name: 'Hotel Admin', email: 'admin@grandpalace.com',
      role: 'admin', deviceToken: 'fcm-token-admin-001',
      currentFloor: null, createdAt: new Date('2024-01-01').toISOString(),
    },
  },
  incidents: {},
  assignments: {},
  notifications: {},
  audit_logs: {},
  realtimeDb: {}, // mirrors /hotels/{hotelId}/incidents/{incidentId}
};

// ── REAL FIREBASE (commented out — enable when USE_MOCK_SERVICES=false) ─────
/*
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

export const db = getFirestore();
export const rtdb = getDatabase();
*/

// ── MOCK DB INTERFACE ────────────────────────────────────────
// Mimics Firestore collection/doc/add/set/get/update patterns

class MockCollection {
  constructor(name) {
    this.name = name;
    if (!mockStore[name]) mockStore[name] = {};
  }
  doc(id) {
    return {
      get: async () => {
        const data = mockStore[this.name][id];
        return { exists: !!data, data: () => data, id };
      },
      set: async (data) => { mockStore[this.name][id] = { ...data }; },
      update: async (data) => {
        mockStore[this.name][id] = { ...mockStore[this.name][id], ...data };
      },
      delete: async () => { delete mockStore[this.name][id]; },
      collection: (sub) => new MockCollection(`${this.name}/${id}/${sub}`),
      id,
    };
  }
  async add(data) {
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    mockStore[this.name][id] = { id, ...data };
    return { id };
  }
  where(field, op, value) {
    return {
      get: async () => {
        const docs = Object.entries(mockStore[this.name])
          .filter(([, d]) => {
            if (op === '==') return d[field] === value;
            if (op === 'in') return Array.isArray(value) && value.includes(d[field]);
            return true;
          })
          .map(([id, data]) => ({ id, data: () => data, exists: true }));
        return { docs, empty: docs.length === 0 };
      },
      orderBy: () => ({
        get: async () => {
          const docs = Object.entries(mockStore[this.name])
            .filter(([, d]) => {
              if (op === '==') return d[field] === value;
              return true;
            })
            .map(([id, data]) => ({ id, data: () => data, exists: true }));
          return { docs };
        },
      }),
    };
  }
  async get() {
    const docs = Object.entries(mockStore[this.name]).map(([id, data]) => ({
      id, data: () => data, exists: true,
    }));
    return { docs, empty: docs.length === 0 };
  }
}

class MockDB {
  collection(name) { return new MockCollection(name); }
}

export const db = USE_MOCK ? new MockDB() : null;

// Real-time DB mock
export const rtdb = {
  ref: (path) => ({
    set: async (data) => {
      const parts = path.split('/');
      let cur = mockStore.realtimeDb;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!cur[parts[i]]) cur[parts[i]] = {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = data;
    },
    update: async (data) => {
      const parts = path.split('/');
      let cur = mockStore.realtimeDb;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!cur[parts[i]]) cur[parts[i]] = {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = {
        ...(cur[parts[parts.length - 1]] || {}),
        ...data,
      };
    },
  }),
};

export { USE_MOCK };
