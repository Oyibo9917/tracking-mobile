import { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { WebView } from 'react-native-webview';

/**
 * @param {object} destination  - { latitude, longitude }
 * @param {object|null} driver  - { latitude, longitude } or null
 */
export default function MapComponent({ destination, driver }) {
  const mapRef  = useRef(null);
  const webRef  = useRef(null);

  // iOS: fit to both markers when driver updates
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    if (!mapRef.current || !destination || !driver) return;
    mapRef.current.fitToCoordinates([destination, driver], {
      edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
      animated: true,
    });
  }, [driver?.latitude, driver?.longitude]);

  // Android: push updated driver coords into the WebView via postMessage
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    if (!webRef.current || !driver) return;
    webRef.current.postMessage(JSON.stringify({
      type: 'updateDriver',
      lat:  driver.latitude,
      lng:  driver.longitude,
    }));
  }, [driver?.latitude, driver?.longitude]);

  if (!destination) {
    return (
      <View style={styles.placeholder}>
        <Text>No destination set.</Text>
      </View>
    );
  }

  // ── Android: Leaflet inside a WebView ──────────────────────────────────────
  if (Platform.OS === 'android') {
    const html = buildLeafletHtml(destination, driver);
    return (
      <WebView
        ref={webRef}
        style={styles.map}
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        onMessage={() => {}} // required for postMessage to work
      />
    );
  }

  // ── iOS: native Apple Maps ─────────────────────────────────────────────────
  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      mapType="standard"
      initialRegion={{
        latitude:       destination.latitude,
        longitude:      destination.longitude,
        latitudeDelta:  0.05,
        longitudeDelta: 0.05,
      }}
    >
      <Marker coordinate={destination} title="Destination" pinColor="red" />
      {driver && <Marker coordinate={driver} title="Driver" pinColor="blue" />}
    </MapView>
  );
}

function buildLeafletHtml(destination, driver) {
  const driverJs = driver
    ? `var driverMarker = L.marker([${driver.latitude}, ${driver.longitude}], {icon: blueIcon}).addTo(map).bindPopup('Driver');`
    : `var driverMarker = null;`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>html,body,#map{margin:0;padding:0;height:100%;width:100%;}</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map').setView([${destination.latitude}, ${destination.longitude}], 14);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  var redIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34]
  });
  var blueIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34]
  });

  L.marker([${destination.latitude}, ${destination.longitude}], {icon: redIcon}).addTo(map).bindPopup('Destination');
  ${driverJs}

  // Listen for driver location updates from React Native
  document.addEventListener('message', function(e) { handleMsg(e.data); });
  window.addEventListener('message', function(e) { handleMsg(e.data); });

  function handleMsg(raw) {
    try {
      var msg = JSON.parse(raw);
      if (msg.type === 'updateDriver') {
        var latlng = [msg.lat, msg.lng];
        if (driverMarker) {
          driverMarker.setLatLng(latlng);
        } else {
          driverMarker = L.marker(latlng, {icon: blueIcon}).addTo(map).bindPopup('Driver');
        }
        map.fitBounds([
          [${destination.latitude}, ${destination.longitude}],
          [msg.lat, msg.lng]
        ], {padding: [40, 40]});
      }
    } catch(e) {}
  }
</script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  map:         { flex: 1 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
