import { VoiceTranscriptEntry } from '../types/voice.types';
import { VoiceSessionCredentials } from './voiceSession.service';

interface GeminiLiveCallbacks {
  onConnected: () => void;
  onDisconnected: () => void;
  onError: (message: string) => void;
  onTranscript: (entry: VoiceTranscriptEntry) => void;
  onAudio: (base64: string, mimeType: string) => void;
}

export class GeminiLiveService {
  private socket: WebSocket | null = null;
  private callbacks: GeminiLiveCallbacks | null = null;

  connect(credentials: VoiceSessionCredentials, callbacks: GeminiLiveCallbacks): void {
    this.callbacks = callbacks;
    const url = `${credentials.websocketUrl}?access_token=${encodeURIComponent(credentials.token)}`;
    this.socket = new WebSocket(url);
    this.socket.onopen = () => {
      this.socket?.send(JSON.stringify({ setup: { model: `models/${credentials.model}`, generationConfig: { responseModalities: ['AUDIO'] }, inputAudioTranscription: {}, outputAudioTranscription: {} } }));
      this.callbacks?.onConnected();
    };
    this.socket.onmessage = (event) => this.handleMessage(String(event.data));
    this.socket.onerror = () => this.callbacks?.onError('La conexión de voz encontró un problema.');
    this.socket.onclose = () => this.callbacks?.onDisconnected();
  }

  sendPcm(base64: string): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ realtimeInput: { audio: { data: base64, mimeType: 'audio/pcm;rate=16000' } } }));
  }

  interrupt(): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ clientContent: { turns: [], turnComplete: false } }));
  }

  close(): void { this.socket?.close(); this.socket = null; this.callbacks = null; }

  private handleMessage(raw: string): void {
    try {
      const message = JSON.parse(raw) as Record<string, unknown>;
      const serverContent = message.serverContent as Record<string, unknown> | undefined;
      const modelTurn = serverContent?.modelTurn as { parts?: Array<Record<string, unknown>> } | undefined;
      for (const part of modelTurn?.parts || []) {
        const inlineData = part.inlineData as { data?: string; mimeType?: string } | undefined;
        if (inlineData?.data) this.callbacks?.onAudio(inlineData.data, inlineData.mimeType || 'audio/pcm;rate=24000');
        if (typeof part.text === 'string') this.callbacks?.onTranscript({ id: `${Date.now()}-n`, rol: 'nexxus', texto: part.text, final: Boolean(serverContent?.turnComplete) });
      }
      const input = serverContent?.inputTranscription as { text?: string; finished?: boolean } | undefined;
      if (input?.text) this.callbacks?.onTranscript({ id: `${Date.now()}-u`, rol: 'usuario', texto: input.text, final: Boolean(input.finished) });
      const output = serverContent?.outputTranscription as { text?: string; finished?: boolean } | undefined;
      if (output?.text) this.callbacks?.onTranscript({ id: `${Date.now()}-n`, rol: 'nexxus', texto: output.text, final: Boolean(output.finished) });
    } catch { this.callbacks?.onError('Gemini devolvió un mensaje de voz inválido.'); }
  }
}
