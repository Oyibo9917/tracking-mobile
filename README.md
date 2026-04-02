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
# Edit .env — set REVERB keys to match the backend
npx expo start --clear
```

Press `i` for iOS Simulator, `a` for Android Emulator.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_BASE_URL_ANDROID` | API URL for Android emulator (`http://10.0.2.2:8000/api`) |
| `EXPO_PUBLIC_API_BASE_URL_IOS` | API URL for iOS Simulator (`http://127.0.0.1:8000/api`) |
| `EXPO_PUBLIC_API_BASE_URL` | Override for real device / deployed server |
| `EXPO_PUBLIC_REVERB_APP_KEY` | Must match `REVERB_APP_KEY` in backend `.env` |
| `EXPO_PUBLIC_REVERB_HOST_ANDROID` | Reverb host for Android emulator (`10.0.2.2`) |
| `EXPO_PUBLIC_REVERB_HOST_IOS` | Reverb host for iOS Simulator (`127.0.0.1`) |
| `EXPO_PUBLIC_REVERB_PORT` | Reverb port (default `8080`) |
| `EXPO_PUBLIC_SIMULATE_ROUTE` | `true` to simulate driver movement without real GPS |

> For a physical device, set `EXPO_PUBLIC_API_BASE_URL` to your machine's local IP and `EXPO_PUBLIC_REVERB_HOST_ANDROID` / `EXPO_PUBLIC_REVERB_HOST_IOS` to the same IP.

---

## WebSocket — Reverb vs Pusher

The app uses **Laravel Reverb** (self-hosted) by default. To switch back to Pusher cloud, uncomment the Pusher config block in `src/config/echo.js` and update the `.env` with Pusher keys.

---

## Maps

- **iOS** — native Apple Maps via `react-native-maps` (no API key needed)
- **Android** — Leaflet.js + OpenStreetMap rendered inside a `WebView` (no Google Maps API key needed)

---

## Route Simulation

Set `EXPO_PUBLIC_SIMULATE_ROUTE=true` to demo driver movement without physically moving. The driver app generates 20 waypoints from Town Gate Road, Sapele (`5.876893, 5.708794`) to the trip destination, advancing one step every 10 seconds. The dispatcher sees the blue marker moving in real time. On the last step the trip is automatically completed.

Set to `false` to use real device GPS.

---

## Design Decisions

- **AsyncStorage** — auth token persisted across app restarts; restored to `global.__authToken` on launch so axios interceptor always has it
- **laravel-echo + pusher-js** — subscribes to Reverb/Pusher channels for real-time events
- **WebView + Leaflet on Android** — avoids Google Maps API key requirement entirely
- **Static Sapele location list** — curated landmarks with coordinates, no external geocoding API needed
