import { createClient } from "@supabase/supabase-js";

// Mismo proyecto Supabase que apps/mobile (ver
// apps/mobile/src/infrastructure/supabase/supabaseClient.ts). Reemplaza a
// firebaseClient/firebaseConfig.js -- ya no hace falta el truco de "app
// secundaria" de Firebase para crear usuarios sin pisar la sesion del
// super admin: las altas de usuario ahora pasan por Edge Functions
// (service_role, sin tocar la sesion del navegador).
export const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  "https://sehmquyehjboznvwztqh.supabase.co";
export const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  "sb_publishable_wmxXYmeqSlu6eicxsdjFFA_-Sb_qHWS";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
