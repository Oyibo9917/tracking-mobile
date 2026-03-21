import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

global.Pusher = Pusher;

const createEcho = (token) => {
  const wsHost = process.env.EXPO_PUBLIC_WS_HOST;
  const cluster = process.env.EXPO_PUBLIC_PUSHER_CLUSTER ?? 'mt1';

  // If no custom WS host, use Pusher cloud
  const config = wsHost
    ? {
        wsHost,
        wsPort:  Number(process.env.EXPO_PUBLIC_WS_PORT ?? 6001),
        wssPort: Number(process.env.EXPO_PUBLIC_WS_PORT ?? 6001),
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
      }
    : {
        cluster,
        forceTLS: true,
        enabledTransports: ['ws', 'wss'],
      };

  return new Echo({
    broadcaster:  'pusher',
    key:          process.env.EXPO_PUBLIC_PUSHER_KEY,
    disableStats: true,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    ...config,
  });
};

export default createEcho;
