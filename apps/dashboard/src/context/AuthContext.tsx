import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "supabaseClient/supabaseConfig";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, perfil: null, rol: "" });

  useEffect(() => {
    let perfilChannel = null;

    const loadPerfil = async (user) => {
      let { data } = await supabase
        .from("usuarios")
        .select("*, empresas(*)")
        .eq("id", user.id)
        .maybeSingle();

      if (
        data &&
        data.empresa_id &&
        (!data.empresas || (Array.isArray(data.empresas) && data.empresas.length === 0))
      ) {
        const { data: empData } = await supabase
          .from("empresas")
          .select("*")
          .eq("id", data.empresa_id)
          .maybeSingle();
        if (empData) {
          data = { ...data, empresas: empData };
        }
      }

      const rol = String(data?.rol || "").trim().toLowerCase();
      setState({ loading: false, user, perfil: data, rol });
    };

    const subscribePerfil = (user) => {
      if (perfilChannel) {
        supabase.removeChannel(perfilChannel);
        perfilChannel = null;
      }
      // Suscripcion en vivo (no solo lectura unica): el registro crea la cuenta de
      // Auth primero y la fila de usuarios recien despues (paso de "datos de
      // empresa"), en el mismo login ya autenticado -- sin esto el contexto se
      // quedaba pegado en rol:"" hasta recargar la pagina.
      perfilChannel = supabase
        .channel(`auth-perfil:${user.id}:${Math.random().toString(36).slice(2)}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "usuarios", filter: `id=eq.${user.id}` },
          () => loadPerfil(user),
        )
        .subscribe();
    };

    const handleSession = (session) => {
      const user = session?.user || null;
      if (perfilChannel) {
        supabase.removeChannel(perfilChannel);
        perfilChannel = null;
      }
      if (!user) {
        setState({ loading: false, user: null, perfil: null, rol: "" });
        return;
      }
      setState((current) => ({ ...current, loading: true, user }));
      loadPerfil(user);
      subscribePerfil(user);
    };

    supabase.auth.getSession().then(({ data }) => handleSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => handleSession(session));

    return () => {
      authListener.subscription.unsubscribe();
      if (perfilChannel) supabase.removeChannel(perfilChannel);
    };
  }, []);

  // El <title> estático de public/index.html ("Nexxus Super Admin") se quedaba en todas las
  // pestañas sin importar el rol -- un admin de empresa normal veía "Nexxus Super Admin" en su
  // propia pestaña del navegador, lo cual es confuso e incorrecto. Se actualiza aquí (no en cada
  // pantalla) porque AuthContext es el único lugar que siempre tiene el rol ya resuelto.
  useEffect(() => {
    if (state.rol === "super_admin") {
      document.title = "Nexxus Super Admin";
    } else if (state.rol === "admin" || state.rol === "admin_empresa") {
      const nombreEmpresa =
        (Array.isArray(state.perfil?.empresas)
          ? state.perfil?.empresas[0]?.nombre
          : state.perfil?.empresas?.nombre) || state.perfil?.empresa_nombre;
      document.title = nombreEmpresa ? `${nombreEmpresa} | Admin` : "Nexxus Admin";
    } else if (!state.loading && !state.user) {
      document.title = "Nexxus Workspace";
    }
  }, [state.rol, state.loading, state.user, state.perfil]);

  // Protege contra el back-forward cache del navegador: sin esto, cerrar sesión y luego pulsar
  // "atrás" puede repintar la última vista autenticada tal cual quedó en memoria (el navegador
  // restaura la página congelada en vez de recargarla), sin volver a pasar por el guard de rol.
  // pageshow con persisted=true detecta exactamente ese caso y fuerza una recarga real, que
  // vuelve a evaluar el estado de sesión actual desde cero.
  useEffect(() => {
    const onPageShow = (event) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const empresaNombre =
    (Array.isArray(state.perfil?.empresas)
      ? state.perfil?.empresas[0]?.nombre
      : state.perfil?.empresas?.nombre) ||
    state.perfil?.empresa_nombre ||
    "";

  const value = {
    ...state,
    esSuperAdmin: state.rol === "super_admin",
    esAdminEmpresa: state.rol === "admin" || state.rol === "admin_empresa",
    empresaId: state.perfil?.empresa_id || "",
    empresaNombre,
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
