// ============================================================
// StaffLogin Screen
// ============================================================

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, setAuthToken } from '../services/api';

export default function StaffLogin({ navigation }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await auth.loginAsRole('staff');
      setAuthToken(response.accessToken);
      navigation.navigate('StaffIncidentList', { user: response.user });
    } catch (err) {
      Alert.alert('Login Failed', `${err.message}\n\nMake sure the backend is running on port 3001.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.icon}>👤</Text>
          <Text style={styles.title}>Staff Access</Text>
          <Text style={styles.sub}>Log in to view your incident assignments and update response status.</Text>
        </View>

        <View style={styles.demoInfo}>
          <Text style={styles.demoTitle}>Demo Login</Text>
          <Text style={styles.demoText}>Marcus Johnson — Floor 3 Responder</Text>
          <Text style={styles.demoDetail}>No credentials needed in mock mode.</Text>
        </View>

        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          testID="staff-login-confirm-btn"
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.loginBtnText}>Login as Staff →</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a0e1a' },
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 20 },
  header: { alignItems: 'center', marginBottom: 8 },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '900', color: '#f1f5f9', marginBottom: 8 },
  sub: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  demoInfo: { backgroundColor: '#111827', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  demoTitle: { fontSize: 11, fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  demoText: { fontSize: 15, fontWeight: '700', color: '#f1f5f9', marginBottom: 2 },
  demoDetail: { fontSize: 12, color: '#64748b' },
  loginBtn: { backgroundColor: '#3b82f6', borderRadius: 14, padding: 18, alignItems: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  loginBtnDisabled: { backgroundColor: '#1e40af' },
  loginBtnText: { fontSize: 17, fontWeight: '800', color: 'white' },
  backBtn: { alignItems: 'center', padding: 12 },
  backText: { fontSize: 14, color: '#475569', fontWeight: '600' },
});
