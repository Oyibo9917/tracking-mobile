// Minimal mock for @react-native-community/netinfo
// required by pusher-js react-native build.
const NetInfo = {
  addEventListener: () => () => {},
  fetch: () => Promise.resolve({ isConnected: true, isInternetReachable: true }),
};

export default NetInfo;
