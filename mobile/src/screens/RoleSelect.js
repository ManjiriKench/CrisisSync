// ============================================================
// RoleSelect Screen — Entry point: Guest or Staff
// ============================================================

import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoleSelect({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e1a" />

      <View style={styles.headerSection}>
        <Text style={styles.logo}>🚨</Text>
        <Text style={styles.appName}>CrisisSync</Text>
        <Text style={styles.tagline}>Emergency Response Platform</Text>
      </View>

      <View style={styles.cardsSection}>
        {/* Guest option */}
        <TouchableOpacity
          style={[styles.roleCard, styles.guestCard]}
          onPress={() => navigation.navigate('GuestSOS')}
          activeOpacity={0.8}
          testID="guest-sos-btn"
        >
          <Text style={styles.roleIcon}>🆘</Text>
          <View style={styles.roleText}>
            <Text style={styles.roleTitle}>I Need Help</Text>
            <Text style={styles.roleDesc}>Report an emergency without logging in</Text>
          </View>
          <Text style={styles.roleArrow}>→</Text>
        </TouchableOpacity>

        {/* Staff option */}
        <TouchableOpacity
          style={[styles.roleCard, styles.staffCard]}
          onPress={() => navigation.navigate('StaffLogin')}
          activeOpacity={0.8}
          testID="staff-login-btn"
        >
          <Text style={styles.roleIcon}>👤</Text>
          <View style={styles.roleText}>
            <Text style={styles.roleTitle}>Staff Login</Text>
            <Text style={styles.roleDesc}>View and respond to assigned incidents</Text>
          </View>
          <Text style={styles.roleArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>CrisisSync v1.0 · Mock Mode</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    justifyContent: 'center',
    padding: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 56,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#f1f5f9',
    letterSpacing: -1,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  cardsSection: {
    gap: 14,
    marginBottom: 32,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  guestCard: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  staffCard: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderColor: 'rgba(59,130,246,0.3)',
  },
  roleIcon: {
    fontSize: 28,
  },
  roleText: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 3,
  },
  roleDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  roleArrow: {
    fontSize: 18,
    color: '#94a3b8',
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: '#334155',
  },
});
