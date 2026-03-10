const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// eslint-disable-next-line no-undef
const config = getDefaultConfig(__dirname);

// Enable LAN and local network exposure
config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      const isSecureConnection =
        req.headers['x-forwarded-proto'] === 'https' ||
        req.connection.encrypted ||
        req.secure;

      // Ensure EXPO_PUBLIC_* vars are properly exposed
      if (req.url === '/.expo/config.json') {
        res.setHeader('Content-Type', 'application/json');
      }

      return middleware(req, res, next);
    };
  },
};

module.exports = withNativeWind(config, {
  input: './global.css',
  inlineRem: 16,
});