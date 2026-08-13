import { supabase } from "supabaseClient/supabaseConfig";

// Reemplaza los ~415 lineas de contexto + respuesta determinista + llamada
// a Gemini DESDE EL NAVEGADOR (con la API key expuesta en
// REACT_APP_GEMINI_API_KEY porque no habia Cloud Functions donde
// esconderla). Ahora existe la Edge Function ask-nexxus-ai (Fase 2), que
// arma el contexto y llama a Gemini server-side con la key protegida --
// este archivo queda como un wrapper delgado sobre esa funcion.
export async function askNexxusAI({ prompt, history = [] }) {
  const { data, error } = await supabase.functions.invoke("ask-nexxus-ai", { body: { prompt, history } });
  if (error) throw new Error(error.message || "No se pudo consultar a Nexxus IA.");
  return data;
}
