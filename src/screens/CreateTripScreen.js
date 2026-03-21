import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../config/api';

// A curated list of Sapele landmarks with coordinates
const SAPELE_LOCATIONS = [
  { name: 'Sapele Town Centre',        lat: 5.8904,  lng: 5.6800 },
  { name: 'Sapele Market',             lat: 5.8950,  lng: 5.6783 },
  { name: 'Sapele Port',               lat: 5.8833,  lng: 5.6667 },
  { name: 'Okirigwe',                  lat: 5.9000,  lng: 5.6900 },
  { name: 'Okumagba Layout',           lat: 5.8870,  lng: 5.6850 },
  { name: 'GRA Sapele',                lat: 5.8950,  lng: 5.6950 },
  { name: 'Sapele Road Junction',      lat: 5.8800,  lng: 5.6750 },
  { name: 'Amukpe',                    lat: 5.9100,  lng: 5.6700 },
  { name: 'Ugbeyiyi',                  lat: 5.8750,  lng: 5.6900 },
  { name: 'Sapele Bridge',             lat: 5.8883,  lng: 5.6733 },
  { name: 'Okpe Road',                 lat: 5.9050,  lng: 5.6800 },
  { name: 'Iyanomo',                   lat: 5.8700,  lng: 5.6850 },
  { name: 'Sapele General Hospital',   lat: 5.8920,  lng: 5.6810 },
  { name: 'Sapele Polytechnic',        lat: 5.9020,  lng: 5.6880 },
  { name: 'Deco Road',                 lat: 5.8860,  lng: 5.6760 },
  { name: 'Orerokpe Road',             lat: 5.9150,  lng: 5.6650 },
  { name: 'Ogorode',                   lat: 5.8780,  lng: 5.6820 },
  { name: 'Sapele Waterside',          lat: 5.8840,  lng: 5.6700 },
  { name: 'Ugbegun',                   lat: 5.9200,  lng: 5.6900 },
  { name: 'Elume',                     lat: 5.8650,  lng: 5.6750 },
];

export default function CreateTripScreen({ navigation, route }) {
  const { user } = route.params ?? {};

  const [drivers, setDrivers]               = useState([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverDropdownOpen, setDriverDropdownOpen] = useState(false);

  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  // Fetch drivers on mount
  useEffect(() => {
    api.get('/drivers')
      .then(({ data }) => setDrivers(data.data))
      .catch(() => Alert.alert('Error', 'Failed to load drivers.'))
      .finally(() => setDriversLoading(false));
  }, []);

  // Filter Lagos locations as user types
  const handleLocationSearch = (text) => {
    setLocationSearch(text);
    setSelectedLocation(null);
    if (text.length < 2) {
      setLocationResults([]);
      return;
    }
    const q = text.toLowerCase();
    setLocationResults(SAPELE_LOCATIONS.filter((l) => l.name.toLowerCase().includes(q)));
  };

  const selectLocation = (loc) => {
    setSelectedLocation(loc);
    setLocationSearch(loc.name);
    setLocationResults([]);
  };

  const handleCreate = async () => {
    if (!selectedDriver) {
      Alert.alert('Error', 'Please select a driver.');
      return;
    }
    if (!selectedLocation) {
      Alert.alert('Error', 'Please search and select a destination.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/trips', {
        driver_id:           selectedDriver.id,
        destination_lat:     selectedLocation.lat,
        destination_lng:     selectedLocation.lng,
        destination_address: selectedLocation.name + ', Sapele',
      });
      navigation.replace('DispatcherDashboard', { user, trip: data.data });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to create trip.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>New Trip</Text>

        {/* Location (non-editable) */}
        <Text style={styles.label}>Location</Text>
        <View style={styles.lockedInput}>
          <Text style={styles.lockedText}>Sapele, Delta State</Text>
        </View>

        {/* Driver select */}
        <Text style={styles.label}>Driver</Text>
        {driversLoading ? (
          <ActivityIndicator style={{ marginBottom: 16 }} color="#2563eb" />
        ) : (
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setDriverDropdownOpen((o) => !o)}
            >
              <Text style={selectedDriver ? styles.dropdownSelected : styles.dropdownPlaceholder}>
                {selectedDriver ? `${selectedDriver.name} (${selectedDriver.email})` : 'Select a driver...'}
              </Text>
              <Text style={styles.chevron}>{driverDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {driverDropdownOpen && (
              <View style={styles.dropdownList}>
                {drivers.length === 0 ? (
                  <Text style={styles.dropdownEmpty}>No drivers found.</Text>
                ) : (
                  drivers.map((d) => (
                    <TouchableOpacity
                      key={d.id}
                      style={[styles.dropdownItem, selectedDriver?.id === d.id && styles.dropdownItemActive]}
                      onPress={() => { setSelectedDriver(d); setDriverDropdownOpen(false); }}
                    >
                      <Text style={[styles.dropdownItemText, selectedDriver?.id === d.id && styles.dropdownItemTextActive]}>
                        {d.name}
                      </Text>
                      <Text style={styles.dropdownItemSub}>{d.email}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {/* Destination search */}
        <Text style={styles.label}>Destination</Text>
        <TextInput
          style={styles.input}
          placeholder="Search location in Sapele..."
          value={locationSearch}
          onChangeText={handleLocationSearch}
        />
        {locationResults.length > 0 && (
          <View style={styles.suggestionList}>
            {locationResults.map((loc) => (
              <TouchableOpacity
                key={loc.name}
                style={styles.suggestionItem}
                onPress={() => selectLocation(loc)}
              >
                <Text style={styles.suggestionText}>{loc.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {selectedLocation && (
          <Text style={styles.coordsHint}>
            {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
          </Text>
        )}

        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={submitting}>
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Set Destination & Start Trip</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:                  { flex: 1, backgroundColor: '#f9f9f9' },
  container:             { padding: 24, paddingBottom: 48 },
  title:                 { fontSize: 24, fontWeight: 'bold', marginBottom: 24, marginTop: 8 },
  label:                 { fontSize: 13, color: '#555', marginBottom: 4 },

  lockedInput:           { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#f3f4f6' },
  lockedText:            { color: '#6b7280', fontSize: 15 },

  dropdownWrapper:       { marginBottom: 16, zIndex: 10 },
  dropdownTrigger:       { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownPlaceholder:   { color: '#9ca3af', fontSize: 15 },
  dropdownSelected:      { color: '#111', fontSize: 15, flex: 1 },
  chevron:               { color: '#6b7280', marginLeft: 8 },
  dropdownList:          { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, backgroundColor: '#fff', marginTop: 4, overflow: 'hidden' },
  dropdownEmpty:         { padding: 12, color: '#9ca3af', textAlign: 'center' },
  dropdownItem:          { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  dropdownItemActive:    { backgroundColor: '#eff6ff' },
  dropdownItemText:      { fontSize: 15, color: '#111' },
  dropdownItemTextActive:{ color: '#2563eb', fontWeight: '600' },
  dropdownItemSub:       { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  input:                 { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 4, backgroundColor: '#fff' },
  suggestionList:        { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, backgroundColor: '#fff', marginBottom: 8, overflow: 'hidden' },
  suggestionItem:        { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  suggestionText:        { fontSize: 15, color: '#111' },
  coordsHint:            { fontSize: 12, color: '#9ca3af', marginBottom: 16, marginLeft: 4 },

  button:                { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText:            { color: '#fff', fontWeight: '600', fontSize: 16 },
});
