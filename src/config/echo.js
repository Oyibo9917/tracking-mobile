import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

global.Pusher = Pusher;

const createEcho = (token) => {
  // ── Reverb (self-hosted) ────────────────────────────────────────────────
  // Android emulator reaches host machine via 10.0.2.2
  // iOS Simulator uses 127.0.0.1
  const { Platform } = require('react-native');
  const reverbHost = Platform.OS === 'android'
    ? process.env.EXPO_PUBLIC_REVERB_HOST_ANDROID
    : process.env.EXPO_PUBLIC_REVERB_HOST_IOS;

  const reverbConfig = {
    wsHost:            reverbHost,
    wsPort:            Number(process.env.EXPO_PUBLIC_REVERB_PORT ?? 8080),
    wssPort:           Number(process.env.EXPO_PUBLIC_REVERB_PORT ?? 8080),
    forceTLS:          false,
    enabledTransports: ['ws'],
    disableStats:      true,
  };

  // ── Pusher cloud (commented out — swap back if needed) ─────────────────
  // const cluster = process.env.EXPO_PUBLIC_PUSHER_CLUSTER ?? 'mt1';
  // const pusherConfig = {
  //   cluster,
  //   forceTLS:          true,
  //   enabledTransports: ['ws', 'wss'],
  //   disableStats:      true,
  // };

  return new Echo({
    broadcaster: 'reverb',
    key:         process.env.EXPO_PUBLIC_REVERB_APP_KEY,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    ...reverbConfig,
    // ...pusherConfig,  // ← uncomment to switch back to Pusher
  });
};

export default createEcho;
