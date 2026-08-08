import { supabase } from './supabaseClient';
import { IAuthRepository } from 'domain/repositories/IAuthRepository';
import { User } from 'domain/entities/User';
import { AuthError } from 'domain/errors/AuthError';
import { mapUserRow } from './mappers';

export class SupabaseAuthRepository implements IAuthRepository {
  async login(correo: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({ email: correo, password });
    if (error) throw AuthError.fromAuthCode('auth/invalid-credential', error.message);
    const user = await this.getById(data.user.id);
    if (!user) throw AuthError.userNotFound();
    return user;
  }

  async loginEmpresarial(codigoEmpresa: string, usuario: string, password: string): Promise<User> {
    const { data, error } = await supabase.rpc('login_empresarial', {
      p_codigo_empresa: codigoEmpresa,
      p_usuario: usuario,
      p_password: password,
    });
    if (error) throw AuthError.fromAuthCode('auth/network-timeout', error.message);
    const correo = data?.correo as string | undefined;
    if (!correo) throw AuthError.fromAuthCode('auth/invalid-credential', data?.error || 'Credenciales inválidas.');

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: correo, password });
    if (signInError) {
      // El login interno (RPC) ya validó código+usuario+contraseña; si esta segunda verificación
      // contra Supabase Auth falla, casi siempre es la contraseña interna desincronizada de la
      // real (ver reset-employee-password). Código distinto para poder dar un mensaje específico.
      throw AuthError.fromAuthCode('auth/password-desync', signInError.message);
    }
    const user = await this.getById(signInData.user.id);
    if (!user) {
      await supabase.auth.signOut().catch(() => {});
      throw AuthError.userNotFound();
    }
    return user;
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id;
    if (!uid) return null;
    return this.getById(uid);
  }

  async register(correo: string, password: string, nombre: string, rol: User['rol']): Promise<User> {
    const { data, error } = await supabase.auth.signUp({ email: correo, password });
    if (error || !data.user) throw AuthError.fromAuthCode('auth/error', error?.message);
    const uid = data.user.id;

    const { error: insertError } = await supabase.from('usuarios').insert({
      id: uid,
      nombre,
      correo,
      rol,
    });
    if (insertError) throw AuthError.fromAuthCode('auth/error', insertError.message);

    const user = await this.getById(uid);
    if (!user) throw AuthError.userNotFound();
    return user;
  }

  private async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase.from('usuarios').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return mapUserRow(data);
  }
}
