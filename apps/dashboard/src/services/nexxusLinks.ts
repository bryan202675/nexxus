// En produccion este dashboard vive en el mismo origen que la app principal (Vercel:
// "/" -> app Expo, "/workspace" -> este dashboard; ver vercel.json), por eso una ruta
// relativa basta para volver a la landing y de paso comparte la sesion de Supabase Auth (mismo
// localStorage de origen) sin custom tokens ni Cloud Functions.
//
// En dev local, Expo (8081) y web-dashboard (3000) son origenes DISTINTOS de verdad -- ninguna
// sesion de Supabase Auth se comparte entre ellos ahi (localStorage es por origen), sin importar que
// URL se use. VITE_NEXXUS_LANDING_URL (.env.development.local) solo sirve para que el botón apunte al
// puerto correcto en dev; el login compartido real solo pasa en produccion (mismo origen).
export const LANDING_URL = import.meta.env.VITE_NEXXUS_LANDING_URL || "/landing";
