// ============================================================
// Incident Store — Zustand state for incidents + real-time sync
// ============================================================

import { create } from 'zustand';
import { incidents as incidentsAPI, connectSSE } from '../services/api.js';

const useIncidentStore = create((set, get) => ({
  incidents: [],
  selectedIncident: null,
  auditLogs: [],
  isLoading: false,
  error: null,
  sseConnection: null,
  lastUpdate: null,

  fetchIncidents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await incidentsAPI.list();
      set({
        incidents: response.incidents || [],
        isLoading: false,
        lastUpdate: Date.now(),
      });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchIncident: async (id) => {
    try {
      const incident = await incidentsAPI.get(id);
      set({ selectedIncident: incident });
      return incident;
    } catch (err) {
      set({ error: err.message });
    }
  },

  fetchAuditLogs: async (id) => {
    try {
      const response = await incidentsAPI.audit(id);
      set({ auditLogs: response.logs || [] });
    } catch (err) {
      set({ error: err.message });
    }
  },

  createIncident: async (data) => {
    try {
      const response = await incidentsAPI.create(data);
      // Refetch list
      await get().fetchIncidents();
      return response;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  updateIncident: async (id, data) => {
    try {
      await incidentsAPI.update(id, data);
      await get().fetchIncidents();
      if (get().selectedIncident?.incidentId === id) {
        await get().fetchIncident(id);
      }
    } catch (err) {
      set({ error: err.message });
    }
  },

  assignStaff: async (incidentId, staffId) => {
    try {
      await incidentsAPI.assign(incidentId, staffId);
      await get().fetchIncidents();
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  // Start SSE real-time polling (fallback when Firebase RT DB not available)
  startRealtimeSync: (hotelId) => {
    const existing = get().sseConnection;
    if (existing) existing.close();

    const evtSource = connectSSE(hotelId, (event) => {
      if (event.type === 'incident_update' || event.type === 'new_incident') {
        get().fetchIncidents();
      }
    });

    set({ sseConnection: evtSource });

    // Also poll every 5 seconds as fallback
    const pollInterval = setInterval(() => {
      get().fetchIncidents();
    }, 5000);

    return () => {
      evtSource.close();
      clearInterval(pollInterval);
    };
  },

  stopRealtimeSync: () => {
    const evtSource = get().sseConnection;
    if (evtSource) evtSource.close();
    set({ sseConnection: null });
  },

  clearSelection: () => set({ selectedIncident: null, auditLogs: [] }),
  clearError: () => set({ error: null }),
}));

export default useIncidentStore;
