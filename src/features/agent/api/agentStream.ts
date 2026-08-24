import Constants from 'expo-constants';
import { fetch as expoFetch } from 'expo/fetch';
import type { AgentEvent } from '../types';

// Same base URL source as src/core/api/client.ts.
const BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) || 'http://localhost:8000';

export interface StreamChatArgs {
  message: string;
  conversationId: number | null;
  getToken: () => Promise<string | null>;
  signal?: AbortSignal;
  onEvent: (event: AgentEvent) => void;
}

/** Non-2xx from /agent/chat (e.g. 429 daily limit, 401 expired, 503 disabled). */
export class AgentHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'AgentHttpError';
  }
}

/** The stream went quiet for too long — see IDLE_TIMEOUT_MS. */
export class AgentStreamTimeoutError extends Error {
  constructor() {
    super('The agent stream stalled');
    this.name = 'AgentStreamTimeoutError';
  }
}

/**
 * How long to wait for the next chunk before giving up. The backend sends no heartbeat and has
 * no idle timeout of its own, so a hung upstream call or a connection dropped without a FIN
 * would otherwise leave the reader awaiting forever — the UI stuck showing Stop with no way
 * back but killing the app. Generous enough to cover a slow tool call between text deltas.
 */
const IDLE_TIMEOUT_MS = 45_000;

function readWithTimeout(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<ReadableStreamReadResult<Uint8Array>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stalled = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new AgentStreamTimeoutError()), IDLE_TIMEOUT_MS);
  });
  return Promise.race([reader.read(), stalled]).finally(() => clearTimeout(timer));
}

/**
 * POST /agent/chat and consume the SSE stream. Uses `expo/fetch` (whose response `body` is a
 * ReadableStream) — axios can't stream. `TextDecoder` is a WinterCG global installed by Expo
 * at boot (expo/src/winter/runtime.native.ts), and `{ stream: true }` keeps a multi-byte char
 * (e.g. Hebrew) intact when it's split across chunk boundaries. Each `data:` frame is a JSON
 * event ({type, ...}); we buffer across chunks because a frame can be split mid-read. This
 * mirrors the web client's reader.
 */
export async function streamAgentChatHttp({
  message,
  conversationId,
  getToken,
  signal,
  onEvent,
}: StreamChatArgs): Promise<void> {
  const token = await getToken();
  const res = await expoFetch(`${BASE_URL}/agent/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, conversation_id: conversationId }),
    signal,
  });

  if (!res.ok || !res.body) {
    // Raw fetch bypasses the axios error interceptor; surface a typed error for the caller.
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch {
      /* non-JSON error body */
    }
    throw new AgentHttpError(res.status, detail);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  // Whether the response body reached its own end. Drives the `finally` below.
  let bodyComplete = false;

  try {
    for (;;) {
      const { done, value } = await readWithTimeout(reader);
      if (done) {
        bodyComplete = true;
        break;
      }
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      let sep: number;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const event = parseFrame(buffer.slice(0, sep));
        buffer = buffer.slice(sep + 2);
        if (!event) continue;
        onEvent(event);
        // `done` and `error` are terminal per the backend's protocol. Returning here means a
        // server that holds the socket open afterwards can't leave the UI stuck streaming.
        // The backend closes right after either one, so treat the body as finished as well —
        // see the `finally` for why cancelling at that moment is the thing to avoid.
        if (event.type === 'done' || event.type === 'error') {
          bodyComplete = true;
          return;
        }
      }
    }
    const tail = parseFrame(buffer);
    if (tail) onEvent(tail);
  } finally {
    // Release the connection only when walking away from a body that is still open — a
    // timeout or an abort. Cancelling one that is about to finish on its own throws
    // `TypeError: The stream is not in a state that permits close`, and NOT here where it
    // could be caught: expo's own `didComplete` listener calls `controller.close()` without
    // checking whether the stream was already cancelled, unlike the `didReceiveResponseData`
    // listener right above it, which does (expo/src/winter/fetch/FetchResponse.ts). The throw
    // therefore lands in expo's callback, escapes as an unhandled error, and — with Sentry
    // wired up — reports itself on turns that actually succeeded. Measured at 5 of 6
    // completed turns before this guard, 0 of 6 after.
    if (!bodyComplete) reader.cancel().catch(() => {});
  }
}

function parseFrame(frame: string): AgentEvent | null {
  const data = frame
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).replace(/^ /, ''))
    .join('\n');
  if (!data) return null;
  try {
    return JSON.parse(data) as AgentEvent;
  } catch {
    return null;
  }
}
