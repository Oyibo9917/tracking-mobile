# Real-Time Location Tracking — Mobile App

React Native (Expo) mobile app for the real-time driver tracking system. Two roles: **Dispatcher** monitors a driver's live GPS on a map and manages trips. **Driver** receives trip assignments instantly and broadcasts location every 10 seconds.

---

## Screens

| Screen | Role | Description |
|--------|------|-------------|
| `LoginScreen` | Both | Email/password login |
| `RegisterScreen` | Both | Register with role selection |
| `DispatcherDashboard` | Dispatcher | Live map, trip status, cancel button |
| `CreateTripScreen` | Dispatcher | Select driver + destination from Sapele landmarks |
| `DriverDashboard` | Driver | Map with destination, location sender, trip status |

---

## Setup

### Requirements
- Node.js 18+
- Expo CLI — `npm install -g expo-cli`
- iOS Simulator (Xcode) or Android Emulator (Android Studio)

### Steps

```bash
npm install
npx expo install @react-native-async-storage/async-storage
cp .env.example .env
# Edit .env with your Pusher keys
npx expo start --clear
```

Press `i` for iOS Simulator, `a` for Android Emulator.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_BASE_URL_ANDROID` | API URL for Android emulator (default: `http://10.0.2.2:8000/api`) |
| `EXPO_PUBLIC_API_BASE_URL_IOS` | API URL for iOS Simulator (default: `http://127.0.0.1:8000/api`) |
| `EXPO_PUBLIC_API_BASE_URL` | Override for real device / deployed server |
| `EXPO_PUBLIC_PUSHER_KEY` | Pusher app key — must match backend |
| `EXPO_PUBLIC_PUSHER_CLUSTER` | Pusher cluster e.g. `mt1` |
| `EXPO_PUBLIC_WS_HOST` | Leave empty for cloud Pusher; set for self-hosted |
| `EXPO_PUBLIC_WS_PORT` | WebSocket port (default `443`) |
| `EXPO_PUBLIC_SIMULATE_ROUTE` | `true` to simulate driver movement without real GPS |

> For a physical device, set `EXPO_PUBLIC_API_BASE_URL` to your machine's local IP e.g. `http://192.168.1.x:8000/api`

---

## Maps

- **iOS** — native Apple Maps via `react-native-maps` (no API key needed)
- **Android** — Leaflet.js + OpenStreetMap rendered inside a `WebView` (no Google Maps API key needed)

---

## Route Simulation

Set `EXPO_PUBLIC_SIMULATE_ROUTE=true` to demo driver movement without physically moving. The driver app generates 20 waypoints from a fixed start position (Town Gate Road, Sapele) to the trip destination, advancing one step every 10 seconds. The dispatcher sees the blue marker moving in real time. When the last step is reached, the trip is automatically completed.

Set to `false` to use real device GPS.

---

## Design Decisions

- **AsyncStorage** — auth token persisted across app restarts; restored to `global.__authToken` on launch so axios interceptor always has it
- **laravel-echo + pusher-js** — subscribes to Pusher channels for real-time trip assignment and location updates
- **WebView + Leaflet on Android** — avoids Google Maps API key requirement entirely
- **Static Sapele location list** — curated landmarks with coordinates, no external geocoding API needed
