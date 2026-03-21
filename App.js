import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import LoginScreen         from './src/screens/LoginScreen';
import RegisterScreen      from './src/screens/RegisterScreen';
import DispatcherDashboard from './src/screens/DispatcherDashboard';
import DriverDashboard     from './src/screens/DriverDashboard';
import CreateTripScreen    from './src/screens/CreateTripScreen';
import { loadAuth }        from './src/utils/auth';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [initialParams, setInitialParams] = useState({});

  useEffect(() => {
    loadAuth().then(({ token, user }) => {
      if (token && user) {
        setInitialParams({ user });
        setInitialRoute(user.role === 'dispatcher' ? 'DispatcherDashboard' : 'DriverDashboard');
      } else {
        setInitialRoute('Login');
      }
    });
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login"               component={LoginScreen} />
        <Stack.Screen name="Register"            component={RegisterScreen} />
        <Stack.Screen name="DispatcherDashboard" component={DispatcherDashboard}
          initialParams={initialRoute === 'DispatcherDashboard' ? initialParams : undefined} />
        <Stack.Screen name="DriverDashboard"     component={DriverDashboard}
          initialParams={initialRoute === 'DriverDashboard' ? initialParams : undefined} />
        <Stack.Screen name="CreateTrip"          component={CreateTripScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
