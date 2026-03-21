const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force pusher-js to use the react-native build but we provide
// a mock for @react-native-community/netinfo via the alias below.
// Do NOT redirect to the web build — it uses browser DOM APIs.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@react-native-community/netinfo') {
    return {
      filePath: require.resolve('./src/mocks/netinfo.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
