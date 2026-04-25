// ============================================================
// GuestSOS Screen — Big red button, description, room
// ============================================================

import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { incidents } from '../services/api';

export default function GuestSOS({ navigation }) {
  const [description, setDescription] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  const [sending, setSending] = useState(false);
  const [sosPressed, setSosPressed] = useState(false);

  const handleSOS = async () => {
    if (!description.trim()) {
      Alert.alert('Description Required', 'Please describe what is happening so we can help you.');
      return;
    }

    setSending(true);
    try {
      const response = await incidents.create({
        description: description.trim(),
        floor: parseInt(floor) || 1,
        room: room.trim() || null,
        hotelId: 'hotel-grand-palace',
      });

      navigation.navigate('GuestStatus', {
        incidentId: response.incident?.incidentId,
        description: description.trim(),
        floor,
        room,
      });
    } catch (err) {
      Alert.alert('Error', `Failed to send SOS: ${err.message}\n\nMake sure the backend server is running on port 3001.`);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Emergency Header */}
        <View style={styles.header}>
          <Text style={styles.warningBadge}>⚠️ EMERGENCY SOS</Text>
          <Text style={styles.headerTitle}>Request Emergency Help</Text>
          <Text style={styles.headerSub}>Hotel security and first responders will be notified immediately.</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>What is happening? <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the emergency (e.g. 'Person collapsed, not breathing')..."
            placeholderTextColor="#475569"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
            testID="sos-description-input"
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Your Location</Text>
          <View style={styles.locationRow}>
            <View style={[styles.inputWrap, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Floor</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 4"
                placeholderTextColor="#475569"
                value={floor}
                onChangeText={setFloor}
                keyboardType="numeric"
                maxLength={2}
                testID="sos-floor-input"
              />
            </View>
            <View style={[styles.inputWrap, { flex: 2 }]}>
              <Text style={styles.inputLabel}>Room Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 412"
                placeholderTextColor="#475569"
                value={room}
                onChangeText={setRoom}
                keyboardType="numeric"
                maxLength={4}
                testID="sos-room-input"
              />
            </View>
          </View>
        </View>

        {/* SOS Button */}
        <TouchableOpacity
          style={[styles.sosButton, sending && styles.sosButtonDisabled]}
          onPress={handleSOS}
          disabled={sending}
          activeOpacity={0.8}
          testID="send-sos-btn"
        >
          {sending ? (
            <ActivityIndicator color="white" size="large" />
          ) : (
            <>
              <Text style={styles.sosButtonIcon}>🆘</Text>
              <Text style={styles.sosButtonText}>SEND SOS</Text>
              <Text style={styles.sosButtonSub}>Notify security & first responders</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            🔒 No login required · Your SOS will be received within seconds ·
            Emergency services auto-notified for life-threatening incidents
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a0e1a' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  header: {
    alignItems: 'center',
    marginBottom: 28,
    paddingVertical: 20,
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  warningBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
    letterSpacing: 1,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f1f5f9',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },

  section: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  required: { color: '#ef4444' },

  textArea: {
    backgroundColor: '#1a2035',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    color: '#f1f5f9',
    fontSize: 15,
    lineHeight: 22,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, color: '#475569', textAlign: 'right', marginTop: 4 },

  locationRow: { flexDirection: 'row', gap: 10 },
  inputWrap: {},
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },

  input: {
    backgroundColor: '#1a2035',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    color: '#f1f5f9',
    fontSize: 15,
  },

  sosButton: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  sosButtonDisabled: { backgroundColor: '#7f1d1d', shadowOpacity: 0 },
  sosButtonIcon: { fontSize: 36, marginBottom: 6 },
  sosButtonText: { fontSize: 22, fontWeight: '900', color: 'white', letterSpacing: 2 },
  sosButtonSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  disclaimer: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#111827',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  disclaimerText: { fontSize: 11, color: '#475569', textAlign: 'center', lineHeight: 16 },
});
