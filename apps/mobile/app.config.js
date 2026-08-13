// Envuelve app.json para poder fijar experiments.baseUrl SOLO cuando el build de Vercel
// exporta este app bajo /app (ver vercel.json: EXPO_PUBLIC_BASE_URL=/app antes de
// `expo export --platform web`). En local (expo start --web, o el launch.json de este repo)
// esa variable no existe, así que baseUrl queda vacío y todo sigue sirviéndose desde la raíz
// como siempre -- por eso esto vive en app.config.js y no directamente en app.json.
const appJson = require('./app.json');

module.exports = ({ config }) => {
  const base = process.env.EXPO_PUBLIC_BASE_URL;
  const expo = { ...appJson.expo, ...config };
  if (base) {
    expo.experiments = { ...(expo.experiments || {}), baseUrl: base };
  }
  return { ...config, ...expo };
};
