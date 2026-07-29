import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "firebaseClient/firebaseConfig";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, perfil: null, rol: "" });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ loading: false, user: null, perfil: null, rol: "" });
        return;
      }
      try {
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        const data = snap.exists() ? snap.data() : null;
        const rol = String(data?.rol || data?.role || "").trim().toLowerCase();
        setState({ loading: false, user, perfil: data, rol });
      } catch {
        setState({ loading: false, user, perfil: null, rol: "" });
      }
    });
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
