-- Los Expo push tokens son credenciales de dispositivo: ningún administrador debe poder
-- enumerarlos o modificarlos desde el Data API. La Edge Function usa service_role y no depende
-- de estas políticas para enviar ni retirar tokens inválidos.
alter policy "push_tokens_select" on public.push_tokens
  using ((select auth.uid()) = usuario_id);

alter policy "push_tokens_update" on public.push_tokens
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);
