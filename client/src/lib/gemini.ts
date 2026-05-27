import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Setup ─────────────────────────────────────────────────────────────────────
const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

const genAI = new GoogleGenerativeAI(apiKey ?? '');

export const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro',   name: 'Gemini 2.5 Pro'   },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash'  },
] as const;

export type GeminiModelId = typeof GEMINI_MODELS[number]['id'];

// ─── Internal: non-streaming fallback ──────────────────────────────────────────
async function fetchWithoutStream(
  prompt: string,
  modelId: GeminiModelId
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: modelId });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

// ─── Main: streaming with auto-fallback ────────────────────────────────────────
/**
 * Stream a Gemini response. Calls `onChunk` with the accumulated text on every
 * token received. If streaming fails for any reason (parse error, network blip,
 * etc.) it transparently retries with `generateContent` so the user always gets
 * an answer.
 */
export async function streamGeminiResponse(
  prompt: string,
  onChunk: (accumulatedText: string) => void,
  modelId: GeminiModelId = 'gemini-2.5-flash'
): Promise<string> {
  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY — add it to client/.env');
  }

  const model = genAI.getGenerativeModel({ model: modelId });

  // ── Attempt 1: streaming ──────────────────────────────────────────────────
  try {
    const result = await model.generateContentStream(prompt);
    let fullText = '';

    for await (const chunk of result.stream) {
      // chunk.text() is the only correct way — never JSON.parse, never fetch
      const chunkText = chunk.text();
      fullText += chunkText;
      onChunk(fullText);
    }

    // Verify we actually got something
    if (!fullText.trim()) throw new Error('Empty stream response');

    return fullText;
  } catch (streamErr: unknown) {
    const msg = streamErr instanceof Error ? streamErr.message : String(streamErr);
    console.warn('[Gemini] Stream failed, falling back to generateContent:', msg);

    // Re-throw real errors (auth, quota) without falling back
    if (
      msg.includes('API_KEY_INVALID') ||
      msg.includes('Missing VITE_GEMINI_API_KEY') ||
      msg.includes('429') ||
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('403') ||
      msg.includes('PERMISSION_DENIED')
    ) {
      throw streamErr;
    }

    // ── Attempt 2: non-streaming fallback ─────────────────────────────────
    try {
      const text = await fetchWithoutStream(prompt, modelId);
      if (!text.trim()) throw new Error('Empty fallback response', { cause: streamErr });
      onChunk(text);
      return text;
    } catch (fallbackErr: unknown) {
      // If fallback also fails, throw the original stream error so we show
      // a meaningful message rather than a generic one
      console.error('[Gemini] Fallback also failed:', fallbackErr);
      throw streamErr;
    }
  }
}

// ─── Friendly error messages shown in the UI ───────────────────────────────────
export function parseGeminiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes('Missing VITE_GEMINI_API_KEY'))
    return 'API key not configured. Add `VITE_GEMINI_API_KEY` to `client/.env`.';

  if (msg.includes('API_KEY_INVALID') || (msg.includes('400') && msg.includes('key')))
    return 'Invalid API key. Please check your `VITE_GEMINI_API_KEY`.';

  if (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota') ||
    msg.includes('free_tier')
  )
    return 'Rate limit reached. Retrying automatically in 30 seconds…';

  if (msg.includes('403') || msg.includes('PERMISSION_DENIED'))
    return 'Permission denied. Make sure the Gemini API is enabled in Google AI Studio.';

  if (msg.includes('404') || msg.includes('not found'))
    return 'Model not available for your API key. Switch to Gemini 2.5 Flash.';

  if (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('network') ||
    msg.includes('ECONNREFUSED')
  )
    return 'Network error. Check your internet connection and try again.';

  if (msg.includes('Failed to parse stream') || msg.includes('parse'))
    return 'Stream parse error. Used fallback response. Please retry if needed.';

  return msg;
}
