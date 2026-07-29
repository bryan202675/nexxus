import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "firebaseClient/firebaseConfig";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, perfil: null, rol: "" });

  useEffect(() => {
    let unsubPerfil = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubPerfil) {
        unsubPerfil();
        unsubPerfil = null;
      }
      if (!user) {
        setState({ loading: false, user: null, perfil: null, rol: "" });
        return;
      }
      // onSnapshot (no getDoc): el registro crea la cuenta de Auth primero y el doc de
      // usuarios/{uid} recien despues (paso de "datos de empresa"), en el mismo login ya
      // autenticado. Con una lectura unica el contexto se quedaba pegado en rol:"" para siempre
      // (onAuthStateChanged no vuelve a dispararse solo porque el doc de Firestore cambio), lo que
      // rebotaba a /auth/sa-login justo despues de crear la empresa. Con listener en vivo, el rol
      // se actualiza apenas el doc existe, sin necesitar recargar la pagina.
      setState((current) => ({ ...current, loading: true, user }));
      unsubPerfil = onSnapshot(
        doc(db, "usuarios", user.uid),
        (snap) => {
          const data = snap.exists() ? snap.data() : null;
          const rol = String(data?.rol || data?.role || "").trim().toLowerCase();
          setState({ loading: false, user, perfil: data, rol });
        },
        () => setState({ loading: false, user, perfil: null, rol: "" })
      );
    });

    return () => {
      unsubAuth();
      if (unsubPerfil) unsubPerfil();
    };
  }, []);

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

  const value = {
    ...state,
    esSuperAdmin: state.rol === "super_admin",
    esAdminEmpresa: state.rol === "admin" || state.rol === "admin_empresa",
    empresaId: state.perfil?.empresaId || state.perfil?.empresa_id || "",
    signOut: () => firebaseSignOut(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
