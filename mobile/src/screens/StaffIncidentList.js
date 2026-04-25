// ============================================================
// StaffIncidentList Screen — Assigned incidents
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { incidents } from '../services/api';

const TYPE_ICONS = { medical: '🏥', fire: '🔥', security: '🛡️', infrastructure: '⚡', other: '⚠️' };
const SEV_COLORS = { 1: '#22c55e', 2: '#84cc16', 3: '#eab308', 4: '#f97316', 5: '#ef4444' };
const STATUS_COLORS = {
  open: '#f59e0b', assigned: '#3b82f6', in_progress: '#8b5cf6', escalated: '#ef4444', resolved: '#22c55e'
};

export default function StaffIncidentList({ route, navigation }) {
  const { user } = route.params;
  const [incidentList, setIncidentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIncidents = useCallback(async () => {
    try {
      const response = await incidents.list();
      setIncidentList(response.incidents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 8000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchIncidents();
  };

  const renderItem = ({ item }) => {
    const type = item.aiClassification?.type || item.type || 'other';
    const sev = item.severity || 2;
    return (
      <TouchableOpacity
        style={[styles.incidentCard, { borderLeftColor: SEV_COLORS[sev] }]}
        onPress={() => navigation.navigate('StaffIncidentDetail', { incident: item })}
        activeOpacity={0.8}
        testID={`incident-card-${item.incidentId}`}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.typeIcon}>{TYPE_ICONS[type] || '⚠️'}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardType}>{type.toUpperCase()}</Text>
            <Text style={styles.cardId}>{item.incidentId}</Text>
          </View>
          <View style={[styles.sevBadge, { backgroundColor: SEV_COLORS[sev] + '20' }]}>
            <Text style={[styles.sevText, { color: SEV_COLORS[sev] }]}>{sev}</Text>
          </View>
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardLocation}>
            📍 Floor {item.location?.floor ?? '?'}{item.location?.room ? `, Rm ${item.location.room}` : ''}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
              {item.status?.replace('_', ' ')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading incidents...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.userBar}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>{user?.name?.[0] || 'S'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Staff Member'}</Text>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      <FlatList
        data={incidentList.filter(i => i.status !== 'resolved')}
        renderItem={renderItem}
        keyExtractor={(item) => item.incidentId}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>All Clear</Text>
            <Text style={styles.emptyDesc}>No active incidents assigned to you.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a0e1a' },
  loadingContainer: { flex: 1, backgroundColor: '#0a0e1a', justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14 },
  userBar: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingHorizontal: 18, backgroundColor: '#111827', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  userAvatar: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { fontSize: 14, fontWeight: '800', color: 'white' },
  userName: { fontSize: 15, fontWeight: '700', color: '#f1f5f9', flex: 1 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e' },
  liveText: { fontSize: 11, color: '#22c55e', fontWeight: '700' },
  list: { padding: 14, gap: 10 },
  incidentCard: { backgroundColor: '#111827', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1e293b', borderLeftWidth: 4, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeIcon: { fontSize: 24 },
  cardMeta: { flex: 1 },
  cardType: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5 },
  cardId: { fontSize: 10, color: '#334155', fontFamily: 'monospace', marginTop: 2 },
  sevBadge: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sevText: { fontSize: 16, fontWeight: '900' },
  cardDesc: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLocation: { fontSize: 12, color: '#475569' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#94a3b8' },
  emptyDesc: { fontSize: 14, color: '#475569', textAlign: 'center' },
});
