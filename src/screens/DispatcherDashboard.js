import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapComponent from '../components/MapComponent';
import createEcho from '../config/echo';
import api from '../config/api';
import { clearAuth } from '../utils/auth';

export default function DispatcherDashboard({ navigation, route }) {
  const { user } = route.params ?? {};

  const [trip, setTrip]                   = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading]             = useState(true);
  const echoRef                           = useRef(null);

  // Fetch the dispatcher's active trip from the API
  const fetchActiveTrip = useCallback(async () => {
    try {
      const { data } = await api.get('/trips/active');
      setTrip(data.data);

      if (data.data?.current_lat) {
        setDriverLocation({
          latitude:  data.data.current_lat,
          longitude: data.data.current_lng,
        });
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load trip.');
      }
      // 404 = no active trip yet, that's fine
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveTrip();
  }, [fetchActiveTrip]);

  // Subscribe to real-time location updates once we have a trip
  useEffect(() => {
    if (!trip) return;

    const echo = createEcho(global.__authToken);
    echoRef.current = echo;

    echo
      .channel(`trip.${trip.id}`)
      .listen('.location.updated', (payload) => {
        setDriverLocation({
          latitude:  payload.current_lat,
          longitude: payload.current_lng,
        });
        setTrip((prev) => ({ ...prev, status: payload.status }));
      })
      .listen('.trip.completed', (payload) => {
        setTrip((prev) => ({ ...prev, status: payload.status }));
      })
      .listen('.trip.cancelled', (payload) => {
        setTrip((prev) => ({ ...prev, status: payload.status }));
      });

    return () => {
      echo.leaveChannel(`trip.${trip.id}`);
    };
  }, [trip?.id]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Trip',
      'Are you sure you want to cancel this trip?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/trips/${trip.id}/cancel`);
              setTrip((prev) => ({ ...prev, status: 'cancelled' }));
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message ?? 'Failed to cancel trip.');
            }
          },
        },
      ],
    );
  };

  const handleLogout = async () => {
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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Dispatcher</Text>
            {trip && (
              <Text style={styles.status}>
                Status: <Text style={styles.statusValue}>{trip.status}</Text>
              </Text>
            )}
            {trip?.destination_address ? (
              <Text style={styles.address} numberOfLines={1}>{trip.destination_address}</Text>
            ) : null}
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
              <Text style={styles.completedSub}>Driver has arrived at the destination.</Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => { setTrip(null); setDriverLocation(null); navigation.navigate('CreateTrip', { user }); }}
              >
                <Text style={styles.createBtnText}>Create New Trip</Text>
              </TouchableOpacity>
            </View>
          ) : trip.status === 'cancelled' ? (
            <View style={styles.center}>
              <Text style={styles.cancelledIcon}>🚫</Text>
              <Text style={styles.cancelledText}>Trip Cancelled</Text>
              <Text style={styles.completedSub}>The trip was cancelled.</Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => { setTrip(null); setDriverLocation(null); navigation.navigate('CreateTrip', { user }); }}
              >
                <Text style={styles.createBtnText}>Create New Trip</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <MapComponent destination={destination} driver={driverLocation} />
              {!driverLocation && (
                <View style={styles.waiting}>
                  <ActivityIndicator size="small" color="#2563eb" />
                  <Text style={styles.waitingText}>Waiting for driver location...</Text>
                </View>
              )}
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelBtnText}>Cancel Trip</Text>
              </TouchableOpacity>
            </>
          )
        ) : (
          <View style={styles.center}>
            <Text style={styles.info}>No active trip.</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('CreateTrip', { user })}
            >
              <Text style={styles.createBtnText}>Create New Trip</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#fff' },
  container:     { flex: 1 },
  header:        { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:         { fontSize: 18, fontWeight: 'bold' },
  status:        { marginTop: 2, color: '#555', fontSize: 13 },
  statusValue:   { fontWeight: '600', color: '#2563eb' },
  address:       { color: '#888', fontSize: 12, marginTop: 2, maxWidth: 220 },
  logoutBtn:     { paddingVertical: 8, paddingHorizontal: 12 },
  logout:        { color: '#dc2626', fontWeight: '600', fontSize: 15 },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  info:          { color: '#888', fontSize: 16 },
  createBtn:     { backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  createBtnText: { color: '#fff', fontWeight: '600' },
  waiting:       { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  waitingText:   { color: '#555' },
  completedIcon: { fontSize: 48, marginBottom: 8 },
  completedText: { fontSize: 22, fontWeight: 'bold', color: '#16a34a' },
  completedSub:  { color: '#888', marginTop: 6, fontSize: 14, marginBottom: 24 },
  cancelBtn:     { margin: 16, borderWidth: 1, borderColor: '#dc2626', padding: 14, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { color: '#dc2626', fontWeight: '600', fontSize: 16 },
  cancelledIcon: { fontSize: 48, marginBottom: 8 },
  cancelledText: { fontSize: 22, fontWeight: 'bold', color: '#dc2626' },
});
