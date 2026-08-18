import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "supabaseClient/supabaseConfig";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, perfil: null, rol: "" });

  useEffect(() => {
    let perfilChannel = null;

    const loadPerfil = async (user, isSilent = false) => {
      try {
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
      } catch (error) {
        console.error("AuthContext: error cargando perfil", error);
        if (!isSilent) {
          setState({ loading: false, user, perfil: null, rol: "" });
        }
      }
    };

    const subscribePerfil = (user) => {
      if (perfilChannel) {
        supabase.removeChannel(perfilChannel);
        perfilChannel = null;
      }
      perfilChannel = supabase
        .channel(`auth-perfil:${user.id}:${Math.random().toString(36).slice(2)}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "usuarios", filter: `id=eq.${user.id}` },
          () => loadPerfil(user, true),
        )
        .subscribe();
    };

    const handleSession = (session) => {
      const user = session?.user || null;
      if (!user) {
        if (perfilChannel) {
          supabase.removeChannel(perfilChannel);
          perfilChannel = null;
        }
        setState({ loading: false, user: null, perfil: null, rol: "" });
        return;
      }

      // Si el usuario ya está cargado (mismo ID y perfil presente), actualizamos en segundo plano
      // de forma transparente SIN reiniciar loading: true, evitando que la app desmonte o parpadee la pantalla de carga.
      setState((current) => {
        const isSameUser = current.user?.id === user.id && !!current.perfil;
        return {
          ...current,
          loading: isSameUser ? false : current.loading,
          user,
        };
      });

      loadPerfil(user, true);
      if (!perfilChannel) {
        subscribePerfil(user);
      }
    };

    supabase.auth
      .getSession()
      .then(({ data }) => handleSession(data.session))
      .catch((error) => {
        console.error("AuthContext: error obteniendo sesión", error);
        setState({ loading: false, user: null, perfil: null, rol: "" });
      });
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
    } else if (state.rol === "jefe" || state.rol === "empleado") {
      document.title = "Nexxus Workspace";
    } else if (!state.loading && !state.user) {
      document.title = "Nexxus Workspace";
    }
  }, [state.rol, state.loading, state.user, state.perfil]);

  // Protege contra el back-forward cache del navegador (bfcache): solo si la página fue restaurada
  // congelada desde la memoria del navegador al pulsar "atrás", se fuerza una recarga.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
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
    esWorkspaceUser: ["jefe", "jefe_sector", "empleado", "psicologo"].includes(state.rol),
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
