// ============================================================
// CrisisSync Mobile App — Root Navigator
// ============================================================

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import GuestSOS from './src/screens/GuestSOS';
import GuestStatus from './src/screens/GuestStatus';
import StaffLogin from './src/screens/StaffLogin';
import StaffIncidentList from './src/screens/StaffIncidentList';
import StaffIncidentDetail from './src/screens/StaffIncidentDetail';
import RoleSelect from './src/screens/RoleSelect';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#0a0e1a" />
      <Stack.Navigator
        initialRouteName="RoleSelect"
        screenOptions={{
          headerStyle: { backgroundColor: '#111827' },
          headerTintColor: '#f1f5f9',
          headerTitleStyle: { fontWeight: '800', fontSize: 18 },
          headerShadowVisible: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#0a0e1a' },
        }}
      >
        <Stack.Screen name="RoleSelect" component={RoleSelect} options={{ headerShown: false }} />
        <Stack.Screen name="GuestSOS" component={GuestSOS} options={{ title: '🆘 Emergency SOS', headerLeft: () => null }} />
        <Stack.Screen name="GuestStatus" component={GuestStatus} options={{ title: '📍 Incident Status' }} />
        <Stack.Screen name="StaffLogin" component={StaffLogin} options={{ title: 'Staff Login' }} />
        <Stack.Screen name="StaffIncidentList" component={StaffIncidentList} options={{ title: '📋 My Assignments', headerLeft: () => null }} />
        <Stack.Screen name="StaffIncidentDetail" component={StaffIncidentDetail} options={{ title: 'Incident Details' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
