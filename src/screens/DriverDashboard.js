import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Linking, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapComponent from '../components/MapComponent';
import createEcho from '../config/echo';
import api from '../config/api';
import { clearAuth } from '../utils/auth';
import { buildRoute } from '../utils/simulateRoute';

// Set EXPO_PUBLIC_SIMULATE_ROUTE=true in .env to simulate movement without GPS
const SIMULATE = process.env.EXPO_PUBLIC_SIMULATE_ROUTE === 'true';

// Driver's starting position for simulation (Town Gate Road, Sapele)
const SIMULATION_START = { latitude: 5.876893, longitude: 5.708794 };

const LOCATION_INTERVAL_MS = 10000;

function openNativeMaps(latitude, longitude, address) {
  const label = encodeURIComponent(address || 'Trip Destination');
  const url = Platform.select({
    ios:     `maps://app?daddr=${latitude},${longitude}&q=${label}`,
    android: `google.navigation:q=${latitude},${longitude}`,
  });

  Linking.canOpenURL(url).then((supported) => {
    if (supported) {
      Linking.openURL(url);
    } else {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
    }
  });
}

export default function DriverDashboard({ navigation, route }) {
  const { user } = route.params ?? {};

  const [trip, setTrip]                       = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [sending, setSending]                 = useState(false);
  const intervalRef                           = useRef(null);
  const echoRef                               = useRef(null);

  const fetchActiveTrip = useCallback(async () => {
    try {
      const { data } = await api.get('/trips/active');
      setTrip(data.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load trip.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveTrip();
  }, [fetchActiveTrip]);

  // Listen for trip assignment in real-time so driver doesn't need to refresh
  useEffect(() => {
    if (!user?.id || trip) return;

    const echo = createEcho(global.__authToken);
    echoRef.current = echo;

    echo
      .channel(`driver.${user.id}`)
      .listen('.trip.assigned', (payload) => {
        api.get(`/trips/${payload.trip_id}`)
          .then(({ data }) => setTrip(data.data))
          .catch(() => fetchActiveTrip());
      });

    return () => {
      echo.leaveChannel(`driver.${user.id}`);
    };
  }, [user?.id, trip]);

  // Listen for trip cancellation from dispatcher
  useEffect(() => {
    if (!trip?.id || trip.status === 'cancelled' || trip.status === 'completed') return;

    const echo = createEcho(global.__authToken);

    echo
      .channel(`trip.${trip.id}`)
      .listen('.trip.cancelled', (payload) => {
        clearInterval(intervalRef.current);
        setTrip((prev) => ({ ...prev, status: payload.status }));
      });

    return () => {
      echo.leaveChannel(`trip.${trip.id}`);
    };
  }, [trip?.id]);

  // Start sending location once we have a trip
  useEffect(() => {
    if (!trip) return;

    let active = true;

    if (SIMULATE) {
      const destination = { latitude: trip.destination_lat, longitude: trip.destination_lng };
      const route = buildRoute(SIMULATION_START, destination, 20);
      let stepIndex = 0;

      const sendStep = async () => {
        if (!active) return;
        const point = route[stepIndex];
        setCurrentLocation(point);
        setSending(true);
        try {
          await api.patch(`/trips/${trip.id}/location`, {
            current_lat: point.latitude,
            current_lng: point.longitude,
          });
        } catch (err) {
          console.warn('Location update failed:', err.message);
        } finally {
          setSending(false);
        }

        if (stepIndex >= route.length - 1) {
          // Reached destination — complete the trip
          clearInterval(intervalRef.current);
          try {
            await api.patch(`/trips/${trip.id}/complete`);
            setTrip((prev) => ({ ...prev, status: 'completed' }));
          } catch (err) {
            console.warn('Complete trip failed:', err.message);
          }
        } else {
          stepIndex++;
        }
      };

      sendStep();
      intervalRef.current = setInterval(sendStep, LOCATION_INTERVAL_MS);
    } else {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to track your trip.');
          return;
        }

        // Send immediately on trip load
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          const { latitude, longitude } = loc.coords;
          setCurrentLocation({ latitude, longitude });
          await api.patch(`/trips/${trip.id}/location`, { current_lat: latitude, current_lng: longitude });
        } catch (_) {}

        intervalRef.current = setInterval(async () => {
          if (!active) return;
          try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude, longitude } = loc.coords;
            setCurrentLocation({ latitude, longitude });
            setSending(true);
            await api.patch(`/trips/${trip.id}/location`, { current_lat: latitude, current_lng: longitude });
          } catch (err) {
            console.warn('Location update failed:', err.message);
          } finally {
            setSending(false);
          }
        }, LOCATION_INTERVAL_MS);
      })();
    }

    return () => {
      active = false;
      clearInterval(intervalRef.current);
    };
  }, [trip?.id]);

  const handleLogout = async () => {
    clearInterval(intervalRef.current);
    echoRef.current?.leaveAllChannels();
    try { await api.post('/logout'); } catch (_) {}
    await clearAuth();
    navigation.replace('Login');
  };

  const destination = trip
    ? { latitude: trip.destination_lat, longitude: trip.destination_lng }
    : null;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Driver {SIMULATE ? '🔁 Simulating' : ''}</Text>
            {trip?.destination_address ? (
              <Text style={styles.address} numberOfLines={1}>{trip.destination_address}</Text>
            ) : null}
            {sending && (
              <View style={styles.sendingRow}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.sendingText}>Sending location...</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logout}>Logout</Text>
          </TouchableOpacity>
        </View>

        {trip ? (
          trip.status === 'completed' ? (
            <View style={styles.center}>
              <Text style={styles.completedIcon}>✅</Text>
              <Text style={styles.completedText}>Trip Completed</Text>
              <Text style={styles.completedSub}>You have arrived at your destination.</Text>
            </View>
          ) : trip.status === 'cancelled' ? (
            <View style={styles.center}>
              <Text style={styles.cancelledIcon}>🚫</Text>
              <Text style={styles.cancelledText}>Trip Cancelled</Text>
              <Text style={styles.completedSub}>The dispatcher has cancelled this trip.</Text>
            </View>
          ) : (
            <>
              <MapComponent destination={destination} driver={currentLocation} />
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => openNativeMaps(trip.destination_lat, trip.destination_lng, trip.destination_address)}
              >
                <Text style={styles.navButtonText}>Open in Maps</Text>
              </TouchableOpacity>
            </>
          )
        ) : (
          <View style={styles.center}>
            <Text style={styles.info}>Waiting for trip assignment...</Text>
            <ActivityIndicator size="small" color="#2563eb" style={{ marginTop: 8 }} />
            <TouchableOpacity style={styles.refreshBtn} onPress={fetchActiveTrip}>
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#fff' },
  container:      { flex: 1 },
  header:         { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:          { fontSize: 18, fontWeight: 'bold' },
  address:        { color: '#888', fontSize: 12, marginTop: 2, maxWidth: 220 },
  sendingRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  sendingText:    { color: '#555', fontSize: 13 },
  logoutBtn:      { paddingVertical: 8, paddingHorizontal: 12 },
  logout:         { color: '#dc2626', fontWeight: '600', fontSize: 15 },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  info:           { color: '#888', fontSize: 16 },
  navButton:      { margin: 16, backgroundColor: '#16a34a', padding: 14, borderRadius: 8, alignItems: 'center' },
  navButtonText:  { color: '#fff', fontWeight: '600', fontSize: 16 },
  refreshBtn:     { backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  refreshBtnText: { color: '#fff', fontWeight: '600' },
  completedIcon:  { fontSize: 48, marginBottom: 8 },
  completedText:  { fontSize: 22, fontWeight: 'bold', color: '#16a34a' },
  completedSub:   { color: '#888', marginTop: 6, fontSize: 14 },
  cancelledIcon:  { fontSize: 48, marginBottom: 8 },
  cancelledText:  { fontSize: 22, fontWeight: 'bold', color: '#dc2626' },
});
