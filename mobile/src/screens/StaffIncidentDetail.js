// ============================================================
// StaffIncidentDetail — En Route / Resolved actions
// ============================================================

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { incidents } from '../services/api';

const SEV_COLORS = { 1: '#22c55e', 2: '#84cc16', 3: '#eab308', 4: '#f97316', 5: '#ef4444' };

export default function StaffIncidentDetail({ route, navigation }) {
  const { incident: initialIncident } = route.params;
  const [incident, setIncident] = useState(initialIncident);
  const [updating, setUpdating] = useState(false);

  const sev = incident.severity || 2;
  const type = incident.aiClassification?.type || incident.type || 'other';
  const ai = incident.aiClassification;

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await incidents.update(incident.incidentId, { status: newStatus });
      setIncident((prev) => ({ ...prev, status: newStatus }));
      if (newStatus === 'resolved') {
        Alert.alert('✅ Resolved', 'Incident marked as resolved. Guest has been notified.', [
          { text: 'Back to List', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', `Failed to update: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Severity Banner */}
        <View style={[styles.sevBanner, { backgroundColor: SEV_COLORS[sev] + '15', borderColor: SEV_COLORS[sev] + '40' }]}>
          <Text style={[styles.sevNum, { color: SEV_COLORS[sev] }]}>{sev}</Text>
          <View style={styles.sevInfo}>
            <Text style={[styles.sevLabel, { color: SEV_COLORS[sev] }]}>SEVERITY {sev}/5 — {type.toUpperCase()}</Text>
            <Text style={styles.incidentId}>{incident.incidentId}</Text>
            <View style={[styles.statusPill, { backgroundColor: '#1e293b' }]}>
              <Text style={styles.statusPillText}>{incident.status?.replace('_', ' ').toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incident Description</Text>
          <Text style={styles.description}>{incident.description}</Text>
        </View>

        {/* Location */}
        <View style={styles.locationCard}>
          <Text style={styles.locationIcon}>📍</Text>
          <View>
            <Text style={styles.locationFloor}>Floor {incident.location?.floor ?? '?'}</Text>
            {incident.location?.room && <Text style={styles.locationRoom}>Room {incident.location.room}</Text>}
            {incident.location?.area && <Text style={styles.locationArea}>{incident.location.area}</Text>}
          </View>
        </View>

        {/* AI Classification */}
        {ai && (
          <View style={styles.aiCard}>
            <Text style={styles.aiBadge}>🤖 Gemini AI Triage</Text>
            <Text style={styles.aiLine}>Type: <Text style={styles.aiValue}>{ai.type?.toUpperCase()}</Text></Text>
            <Text style={styles.aiLine}>Confidence: <Text style={styles.aiValue}>{Math.round((ai.confidence || 0) * 100)}%</Text></Text>
            {ai.escalate911 && (
              <View style={styles.escalateBanner}>
                <Text style={styles.escalateText}>🚨 911 Auto-Call Triggered</Text>
              </View>
            )}
            {ai.actions?.length > 0 && (
              <View style={styles.actionsSection}>
                <Text style={styles.actionsTitle}>Recommended Steps:</Text>
                {ai.actions.map((action, i) => (
                  <Text key={i} style={styles.actionItem}>• {action}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        {incident.status !== 'resolved' && (
          <View style={styles.actionsBar}>
            {['open', 'assigned', 'escalated'].includes(incident.status) && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.enRouteBtn]}
                onPress={() => handleStatusUpdate('in_progress')}
                disabled={updating}
                testID="en-route-btn"
              >
                {updating ? <ActivityIndicator color="white" /> : <Text style={styles.actionBtnText}>🚗 En Route / In Progress</Text>}
              </TouchableOpacity>
            )}
            {['assigned', 'in_progress', 'escalated'].includes(incident.status) && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.resolveBtn]}
                onPress={() => handleStatusUpdate('resolved')}
                disabled={updating}
                testID="resolve-btn"
              >
                {updating ? <ActivityIndicator color="white" /> : <Text style={styles.actionBtnText}>✅ Mark Resolved</Text>}
              </TouchableOpacity>
            )}
          </View>
        )}

        {incident.status === 'resolved' && (
          <View style={styles.resolvedBanner}>
            <Text style={styles.resolvedText}>✅ This incident has been resolved</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a0e1a' },
  container: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },

  sevBanner: { borderRadius: 16, borderWidth: 1, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16 },
  sevNum: { fontSize: 48, fontWeight: '900', lineHeight: 52 },
  sevInfo: { flex: 1, gap: 4 },
  sevLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  incidentId: { fontSize: 10, color: '#334155', fontFamily: 'monospace' },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  statusPillText: { fontSize: 10, fontWeight: '700', color: '#64748b' },

  section: { gap: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  description: { fontSize: 14, color: '#94a3b8', lineHeight: 22, backgroundColor: '#111827', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#1e293b' },

  locationCard: { backgroundColor: '#111827', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#1e293b' },
  locationIcon: { fontSize: 24 },
  locationFloor: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
  locationRoom: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  locationArea: { fontSize: 12, color: '#64748b' },

  aiCard: { backgroundColor: '#0f172a', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)', gap: 8 },
  aiBadge: { fontSize: 12, fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 0.5 },
  aiLine: { fontSize: 13, color: '#64748b' },
  aiValue: { color: '#94a3b8', fontWeight: '700' },
  escalateBanner: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  escalateText: { fontSize: 13, fontWeight: '800', color: '#ef4444', textAlign: 'center' },
  actionsSection: { gap: 4 },
  actionsTitle: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  actionItem: { fontSize: 12, color: '#475569', lineHeight: 18 },

  actionsBar: { gap: 10 },
  actionBtn: { padding: 18, borderRadius: 14, alignItems: 'center' },
  enRouteBtn: { backgroundColor: '#8b5cf6', shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  resolveBtn: { backgroundColor: '#16a34a', shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  actionBtnText: { fontSize: 16, fontWeight: '800', color: 'white' },

  resolvedBanner: { backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
  resolvedText: { fontSize: 15, fontWeight: '700', color: '#22c55e' },
});
