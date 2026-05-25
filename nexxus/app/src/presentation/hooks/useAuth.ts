/**
 * Documentacion Nexxus - nexxus/app/src/presentation/hooks/useAuth.ts
 * Capa: presentacion.
 * Proposito: Hook de presentacion. Expone estado y acciones reutilizables para componentes React sin duplicar logica.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { useState, useEffect } desde React; habilita componentes, hooks y tipos base para esta pieza.
import { useState, useEffect } from 'react';
// Importa { useCases } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { useCases } from '@/infrastructure/firebase/container';
// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from '@/domain/entities/User';
// Importa { LoginDTO, LoginEmpresarialDTO }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { LoginDTO, LoginEmpresarialDTO } from '@/application/dtos/AuthDTO';

/**
 * Hook useAuth. Expone estado derivado y acciones reutilizables para componentes React.
 */
export function useAuth() {
  // Inicializa [user, setUser]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [user, setUser] = useState<User | null>(null);
  // Inicializa [loading, setLoading]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [loading, setLoading] = useState(true);
  // Inicializa [error, setError]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [error, setError] = useState<string | null>(null);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // checkSession agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
    async function checkSession() {
      // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
      try {
        // Declara currentUser; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const currentUser = await useCases.auth.getCurrentUser.execute();
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        setUser((prev) => prev ? prev : currentUser);
      } catch (err: any) {
        // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
        console.error('Error checking session:', err);
      } finally {
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        setLoading(false);
      }
    }
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    checkSession();
  }, []);

  // Declara login; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const login = async (dto: LoginDTO) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setLoading(true);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setError(null);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara response; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const response = await useCases.auth.login.execute(dto);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setUser(response.user);
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return response.user;
    } catch (err: any) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setError(err.userMessage || 'Error al iniciar sesión');
      // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
      throw err;
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setLoading(false);
    }
  };

  // Declara loginEmpresarial; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const loginEmpresarial = async (dto: LoginEmpresarialDTO) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setLoading(true);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setError(null);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara response; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const response = await useCases.auth.loginEmpresarial.execute(dto);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setUser(response.user);
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return response.user;
    } catch (err: any) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setError(err.userMessage || 'Error en el acceso empresarial');
      // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
      throw err;
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setLoading(false);
    }
  };

  // Declara logout; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const logout = async () => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setLoading(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await useCases.auth.logout.execute();
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setUser(null);
    } catch (err: any) {
      // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
      console.error('Error logging out:', err);
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setLoading(false);
    }
  };

  // Declara updateUser; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const updateUser = (updatedUser: User) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setUser(updatedUser);
  };

  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    loginEmpresarial,
    logout,
    updateUser
  };
}
