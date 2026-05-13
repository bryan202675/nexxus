import { useState, useEffect } from 'react';
import { useCases } from '@/infrastructure/firebase/container';
import { User } from '@/domain/entities/User';
import { LoginDTO } from '@/application/dtos/AuthDTO';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSession() {
      try {
        const currentUser = await useCases.auth.getCurrentUser.execute();
        setUser(currentUser);
      } catch (err: any) {
        console.error('Error checking session:', err);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const login = async (dto: LoginDTO) => {
    setLoading(true);
    setError(null);
    try {
      const response = await useCases.auth.login.execute(dto);
      setUser(response.user);
      return response.user;
    } catch (err: any) {
      setError(err.userMessage || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await useCases.auth.logout.execute();
      setUser(null);
    } catch (err: any) {
      console.error('Error logging out:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout
  };
}
