const base = require('./app.json');

module.exports = () => {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  return {
    ...base.expo,
    ios: {
      ...base.expo.ios,
      ...(apiKey ? { config: { googleMapsApiKey: apiKey } } : {}),
    },
    android: {
      ...base.expo.android,
      ...(apiKey ? { config: { googleMaps: { apiKey } } } : {}),
    },
  };
};
