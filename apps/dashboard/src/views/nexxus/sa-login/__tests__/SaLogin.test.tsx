import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SaLogin from '../index';

const signInWithPassword = vi.fn().mockResolvedValue({ error: null });

// vi.mock no intercepta especificadores resueltos vía el alias de tsconfig (baseUrl "src") en
// este setup de vite-tsconfig-paths -- SaLogin/index.tsx importa con el alias y seguía recibiendo
// el AuthContext real (probado: el mismo mock con ruta relativa sí intercepta). Ruta relativa
// obligatoria aquí en vez del alias "context/..." / "supabaseClient/..." que usa el resto del repo.
vi.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false, rol: null, esSuperAdmin: false, esAdminEmpresa: false }),
}));

vi.mock('../../../../supabaseClient/supabaseConfig', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => signInWithPassword(...args),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn(),
    },
  },
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <SaLogin />
    </MemoryRouter>
  );
}

describe('SaLogin (formulario de acceso)', () => {
  beforeEach(() => {
    signInWithPassword.mockClear();
  });

  it('muestra un error y no llama a Supabase si falta correo o contraseña', async () => {
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/ingresa tu correo y contraseña/i)).toBeInTheDocument();
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('normaliza el correo (trim + minúsculas) al iniciar sesión', async () => {
    renderLogin();

    fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: '  Admin@Nexxus.com  ' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'secreta123' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: 'admin@nexxus.com',
        password: 'secreta123',
      });
    });
  });

  it('traduce el error de credenciales inválidas a un mensaje en español', async () => {
    signInWithPassword.mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } });
    renderLogin();

    fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: 'admin@nexxus.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'mala' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/correo o contraseña incorrectos/i)).toBeInTheDocument();
  });
});
