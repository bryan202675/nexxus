import { Buffer } from "node:buffer";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  setHeader: (name: string, value: string | number) => void;
  json: (body: { error: string }) => void;
  end: (body?: Uint8Array) => void;
};

const MAX_TEXT_LENGTH = 1_200;
const VOICES = new Set(["es-MX-DaliaNeural", "es-US-AlonsoNeural"]);

function readBody(body: unknown): { text?: unknown; voice?: unknown } {
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as { text?: unknown; voice?: unknown };
    } catch {
      return {};
    }
  }
  return body && typeof body === "object" ? body as { text?: unknown; voice?: unknown } : {};
}

async function hasValidSupabaseSession(authorization: string | undefined): Promise<boolean> {
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!token || !supabaseUrl || !supabaseAnonKey) return false;

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` },
  });
  return response.ok;
}

export const config = { runtime: "nodejs" };

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido." });
  }

  try {
    const authorization = Array.isArray(req.headers.authorization) ? req.headers.authorization[0] : req.headers.authorization;
    if (!await hasValidSupabaseSession(authorization)) {
      return res.status(401).json({ error: "Tu sesión no es válida." });
    }

    const { text, voice } = readBody(req.body);
    if (typeof text !== "string" || !text.trim() || text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ error: "El texto de voz es inválido o demasiado largo." });
    }

    const selectedVoice = typeof voice === "string" && VOICES.has(voice) ? voice : "es-MX-DaliaNeural";
    const tts = new MsEdgeTTS();
    await tts.setMetadata(selectedVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text.trim(), { rate: 0.96, pitch: "+0Hz" });
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      audioStream.on("data", (chunk: Uint8Array) => chunks.push(Buffer.from(chunk)));
      audioStream.on("end", resolve);
      audioStream.on("error", reject);
    });
    tts.close();

    const audio = Buffer.concat(chunks);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audio.length);
    // La voz puede contener datos internos: nunca permitir caché compartida por CDN.
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).end(audio);
  } catch {
    return res.status(502).json({ error: "No pudimos generar la voz de Nexxus." });
  }
}
