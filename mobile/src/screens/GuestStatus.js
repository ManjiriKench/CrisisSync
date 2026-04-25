// ============================================================
// GuestStatus Screen — Track incident status
// ============================================================

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { incidents } from '../services/api';

const statusConfig = {
  open: { color: '#f59e0b', icon: '🔴', label: 'Received', desc: 'Your emergency has been received and is being assessed.' },
  assigned: { color: '#3b82f6', icon: '👤', label: 'Help Assigned', desc: 'A staff member has been assigned and is on their way.' },
  in_progress: { color: '#8b5cf6', icon: '🚗', label: 'Help En Route', desc: 'Emergency responder is en route to you right now.' },
  escalated: { color: '#ef4444', icon: '🚨', label: 'Escalated to 911', desc: 'Emergency services have been auto-notified. Stay calm.' },
  resolved: { color: '#22c55e', icon: '✅', label: 'Resolved', desc: 'Your incident has been resolved. Stay safe.' },
};

export default function GuestStatus({ route, navigation }) {
  const { incidentId, description, floor, room } = route.params;
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    if (!incidentId) return;
    try {
      const data = await incidents.get(incidentId);
      setIncident(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const poll = setInterval(fetchStatus, 5000);
    return () => clearInterval(poll);
  }, []);

  const status = incident?.status || 'open';
  const cfg = statusConfig[status] || statusConfig.open;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Status Card */}
        <View style={[styles.statusCard, { borderColor: cfg.color + '40' }]}>
          <Text style={styles.statusIcon}>{cfg.icon}</Text>
          <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={styles.statusDesc}>{cfg.desc}</Text>

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text style={styles.loadingText}>Updating status...</Text>
            </View>
          )}
        </View>

        {/* Incident Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Your Emergency Report</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID</Text>
            <Text style={styles.infoValue}>{incidentId || 'Pending...'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>
              {floor ? `Floor ${floor}` : 'Unknown'}{room ? `, Room ${room}` : ''}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.infoValue}>{description?.substring(0, 100)}</Text>
          </View>
          {incident?.aiClassification && (
            <View style={[styles.aiBadge]}>
              <Text style={styles.aiBadgeText}>
                🤖 Classified: {incident.aiClassification.type?.toUpperCase()} — Severity {incident.aiClassification.severity}/5
              </Text>
            </View>
          )}
        </View>

        {/* Status Timeline */}
        <View style={styles.timeline}>
          {['open', 'assigned', 'in_progress', 'resolved'].map((s, i) => {
            const statusOrder = ['open', 'assigned', 'in_progress', 'resolved', 'escalated'];
            const currentIdx = statusOrder.indexOf(status);
            const thisIdx = statusOrder.indexOf(s);
            const isDone = currentIdx >= thisIdx || status === 'escalated';
            return (
              <View key={s} style={styles.timelineItem}>
                <View style={[styles.timelineDot, isDone && styles.timelineDotDone]} />
                {i < 3 && <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} />}
                <Text style={[styles.timelineLabel, isDone && styles.timelineLabelDone]}>
                  {statusConfig[s]?.label}
                </Text>
              </View>
            );
          })}
        </View>

        {error && <Text style={styles.error}>Connection error. Retrying...</Text>}

        <TouchableOpacity style={styles.newSOSBtn} onPress={() => navigation.navigate('GuestSOS')}>
          <Text style={styles.newSOSText}>Report Another Emergency</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a0e1a' },
  container: { flex: 1, padding: 20, gap: 16 },

  statusCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
  },
  statusIcon: { fontSize: 52, marginBottom: 12 },
  statusLabel: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
  statusDesc: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  loadingText: { fontSize: 12, color: '#64748b' },

  infoCard: { backgroundColor: '#111827', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#1e293b' },
  infoTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  infoLabel: { fontSize: 12, color: '#475569', width: 80 },
  infoValue: { fontSize: 13, color: '#94a3b8', flex: 1 },

  aiBadge: { backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 8, padding: 8, marginTop: 8, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  aiBadgeText: { fontSize: 12, color: '#3b82f6', fontWeight: '600' },

  timeline: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 16, backgroundColor: '#111827', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b' },
  timelineItem: { alignItems: 'center', flex: 1, position: 'relative' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#1e293b', borderWidth: 2, borderColor: '#334155', marginBottom: 6 },
  timelineDotDone: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  timelineLine: { position: 'absolute', top: 5, left: '50%', right: '-50%', height: 2, backgroundColor: '#1e293b', zIndex: -1 },
  timelineLineDone: { backgroundColor: '#3b82f6' },
  timelineLabel: { fontSize: 9, color: '#334155', textAlign: 'center', fontWeight: '600' },
  timelineLabelDone: { color: '#94a3b8' },

  error: { color: '#ef4444', fontSize: 12, textAlign: 'center' },

  newSOSBtn: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', alignItems: 'center' },
  newSOSText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
});
