// En produccion este dashboard vive en el mismo origen que la app principal (Firebase Hosting:
// "/" -> app Expo, "/workspace" -> este dashboard; ver nexxus/firebase.json), por eso una ruta
// relativa basta para volver a la landing y de paso comparte la sesion de Firebase Auth (misma
// IndexedDB de origen) sin custom tokens ni Cloud Functions.
export const LANDING_URL = process.env.REACT_APP_NEXXUS_LANDING_URL || "/landing";
