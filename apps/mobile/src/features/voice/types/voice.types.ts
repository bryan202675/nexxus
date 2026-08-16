export type VoiceSessionState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'reconnecting'
  | 'ended'
  | 'error';

export type VoiceErrorCode =
  | 'microphone_permission_denied'
  | 'audio_init_failed'
  | 'connection_failed'
  | 'unknown';

export interface VoiceSessionError {
  code: VoiceErrorCode;
  message: string;
}

export interface VoiceTranscriptEntry {
  id: string;
  rol: 'usuario' | 'nexxus';
  texto: string;
  final: boolean;
}
