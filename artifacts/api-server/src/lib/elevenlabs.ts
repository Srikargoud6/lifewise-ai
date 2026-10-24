import { createHash } from "node:crypto";
import { z } from "zod/v4";
import { HttpError } from "./lifewise-store";

const VOICES_TTL_MS = 5 * 60 * 1000;
const AUDIO_CACHE_LIMIT_BYTES = 6 * 1024 * 1024;
const AUDIO_CACHE_MAX_AGE_MS = 30 * 60 * 1000;
const MAX_SPEECH_BYTES = 2 * 1024 * 1024;
const SPEECH_LIMIT = 12;

const voiceResponseSchema = z.object({
  voices: z.array(z.object({
    voice_id: z.string().min(1).max(100),
    name: z.string().min(1).max(100),
  })),
});

export type CoachingVoice = { id: string; name: string };

let voiceCache: { expiresAt: number; voices: CoachingVoice[] } | undefined;
const audioCache = new Map<string, { audio: Buffer; createdAt: number }>();
const inFlight = new Map<string, Promise<Buffer>>();
const speechBuckets = new Map<string, { count: number; resetAt: number }>();
let audioCacheBytes = 0;

function getApiKey(): string {
  const key = process.env.Eleven_labs_api_key;
  if (!key) throw new HttpError(503, "ElevenLabs voice is not configured. Add the key in Replit Secrets.");
  return key;
}

async function requestElevenLabs(path: string, init?: RequestInit): Promise<Response> {
  const key = getApiKey();
  try {
    const response = await fetch(`https://api.elevenlabs.io${path}`, {
      ...init,
      headers: { "xi-api-key": key, accept: "application/json", ...init?.headers },
      signal: AbortSignal.timeout(20_000),
    });
    if (response.status === 401 || response.status === 403) {
      throw new HttpError(503, "ElevenLabs rejected the configured key or its permissions. Check the key in Replit Secrets.");
    }
    if (response.status === 429) throw new HttpError(429, "ElevenLabs is rate-limited or out of credits. Try again later.");
    if (!response.ok) throw new HttpError(502, "ElevenLabs could not complete the voice request. Please retry.");
    return response;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(503, "ElevenLabs could not be reached. Please use the device voice or try again later.");
  }
}

export async function listCoachingVoices(): Promise<CoachingVoice[]> {
  if (voiceCache && voiceCache.expiresAt > Date.now()) return voiceCache.voices;
  const response = await requestElevenLabs("/v1/voices");
  let body: unknown;
  try { body = await response.json(); }
  catch { throw new HttpError(502, "ElevenLabs returned an invalid voice list."); }
  const parsed = voiceResponseSchema.safeParse(body);
  if (!parsed.success) throw new HttpError(502, "ElevenLabs returned an invalid voice list.");
  const voices = parsed.data.voices.map(({ voice_id, name }) => ({ id: voice_id, name }));
  voiceCache = { voices, expiresAt: Date.now() + VOICES_TTL_MS };
  return voices;
}

function enforceSpeechLimit(owner: string): void {
  const now = Date.now();
  if (speechBuckets.size > 5000) {
    for (const [key, bucket] of speechBuckets) if (bucket.resetAt <= now) speechBuckets.delete(key);
  }
  const bucket = speechBuckets.get(owner) ?? { count: 0, resetAt: now + 60_000 };
  if (bucket.resetAt <= now) { bucket.count = 0; bucket.resetAt = now + 60_000; }
  if (bucket.count >= SPEECH_LIMIT) throw new HttpError(429, "Voice playback is limited to 12 new clips per minute. Please wait and retry.");
  bucket.count++;
  speechBuckets.set(owner, bucket);
}

function cacheAudio(key: string, audio: Buffer): void {
  if (audio.length > AUDIO_CACHE_LIMIT_BYTES / 2) return;
  for (const [oldKey, entry] of audioCache) {
    if (entry.createdAt + AUDIO_CACHE_MAX_AGE_MS <= Date.now()) {
      audioCache.delete(oldKey);
      audioCacheBytes -= entry.audio.length;
    }
  }
  while (audioCacheBytes + audio.length > AUDIO_CACHE_LIMIT_BYTES) {
    const oldestKey = audioCache.keys().next().value;
    if (!oldestKey) break;
    const oldest = audioCache.get(oldestKey)!;
    audioCache.delete(oldestKey);
    audioCacheBytes -= oldest.audio.length;
  }
  audioCache.set(key, { audio, createdAt: Date.now() });
  audioCacheBytes += audio.length;
}

export async function generateCoachingSpeech(text: string, voiceId: string, owner: string): Promise<Buffer> {
  if (text.length > 3000) throw new HttpError(413, "This coaching message is too long to turn into speech.");
  const voices = await listCoachingVoices();
  if (!voices.some((voice) => voice.id === voiceId)) throw new HttpError(400, "Choose a voice from your ElevenLabs account.");

  const cacheKey = createHash("sha256").update(`${voiceId}\0${text}`).digest("hex");
  const cached = audioCache.get(cacheKey);
  if (cached && cached.createdAt + AUDIO_CACHE_MAX_AGE_MS > Date.now()) {
    audioCache.delete(cacheKey);
    audioCache.set(cacheKey, cached);
    return cached.audio;
  }

  let pending = inFlight.get(cacheKey);
  if (!pending) {
    enforceSpeechLimit(owner);
    pending = (async () => {
      const response = await requestElevenLabs(`/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "audio/mpeg" },
        body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
      });
      const audio = Buffer.from(await response.arrayBuffer());
      if (!audio.length || audio.length > MAX_SPEECH_BYTES) throw new HttpError(502, "ElevenLabs returned an invalid or oversized audio clip.");
      cacheAudio(cacheKey, audio);
      return audio;
    })().finally(() => { inFlight.delete(cacheKey); });
    inFlight.set(cacheKey, pending);
  }
  return pending;
}

export const elevenLabsReady = () => Boolean(process.env.Eleven_labs_api_key);
