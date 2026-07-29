// En produccion este dashboard vive en el mismo origen que la app principal (Firebase Hosting:
// "/" -> app Expo, "/workspace" -> este dashboard; ver nexxus/firebase.json), por eso una ruta
// relativa basta para volver a la landing y de paso comparte la sesion de Firebase Auth (misma
// IndexedDB de origen) sin custom tokens ni Cloud Functions.
//
// En dev local, Expo (8081) y web-dashboard (3000) son origenes DISTINTOS de verdad -- ninguna
// sesion de Firebase Auth se comparte entre ellos ahi (IndexedDB es por origen), sin importar que
// URL se use. REACT_APP_NEXXUS_LANDING_URL (.env.local) solo sirve para que el botón apunte al
// puerto correcto en dev; el login compartido real solo pasa en produccion (mismo origen).
export const LANDING_URL = process.env.REACT_APP_NEXXUS_LANDING_URL || "/landing";
