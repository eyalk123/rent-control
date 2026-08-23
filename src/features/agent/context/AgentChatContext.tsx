import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { getAgentStatus, getConversation, streamAgentChat } from '../api/agentApi';
import { AgentHttpError, AgentStreamTimeoutError } from '../api/agentStream';
import { parseCitations } from '../utils/citations';
import type { ChatDisplayMessage, StoredMessage } from '../types';

type ChatStatus = 'idle' | 'streaming' | 'error';

interface AgentChatValue {
  /** Whether the backend agent is configured (has an API key). */
  enabled: boolean;
  statusLoading: boolean;
  /** The availability check itself failed — distinct from a definitive "not configured". */
  statusFailed: boolean;
  refreshStatus: () => void;
  messages: ChatDisplayMessage[];
  activeConversationId: number | null;
  status: ChatStatus;
  /** i18n tool key for the current activity line, or null. */
  activity: string | null;
  send: (text: string) => void;
  /** Resend the last question after a failed turn. */
  retry: () => void;
  stop: () => void;
  newChat: () => void;
  openThread: (id: number) => Promise<void>;
}

const AgentChatContext = createContext<AgentChatValue | null>(null);

let _uid = 0;
const uid = () => `m${++_uid}`;

type Block = { type?: string; text?: string };

/** Map stored turns (raw content blocks) into rendered messages: user strings and assistant
 *  text; tool_result turns (user role, array content) are skipped. */
function storedToDisplay(messages: StoredMessage[]): ChatDisplayMessage[] {
  const out: ChatDisplayMessage[] = [];
  for (const m of messages) {
    if (m.role === 'user' && typeof m.content === 'string') {
      out.push({ id: `s${m.id}`, role: 'user', text: m.content, sources: [] });
    } else if (m.role === 'assistant' && Array.isArray(m.content)) {
      const text = (m.content as Block[])
        .filter((b) => b.type === 'text')
        .map((b) => b.text ?? '')
        .join('');
      if (text.trim()) {
        const { text: prose, refs } = parseCitations(text);
        out.push({ id: `s${m.id}`, role: 'assistant', text: prose, sources: refs });
      }
    }
  }
  return out;
}

export function AgentChatProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { getToken, isSignedIn } = useAppAuth();

  const [enabled, setEnabled] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusFailed, setStatusFailed] = useState(false);
  const [statusAttempt, setStatusAttempt] = useState(0);
  const [messages, setMessages] = useState<ChatDisplayMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [activity, setActivity] = useState<string | null>(null);

  // Refs so the async stream callback reads current values without re-subscribing.
  const statusRef = useRef<ChatStatus>('idle');
  const convoIdRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // The last question asked, so a failed turn can be resent without retyping it.
  const lastSentRef = useRef<string>('');

  // Fetch the feature-flag status once the user is signed in (so the bearer token is ready —
  // fetching before auth restores would 401 and wrongly show "not available").
  useEffect(() => {
    if (!isSignedIn) {
      setEnabled(false);
      setStatusFailed(false);
      setStatusLoading(false);
      return;
    }
    let alive = true;
    setStatusLoading(true);
    setStatusFailed(false);
    getAgentStatus()
      .then((s) => {
        if (!alive) return;
        setEnabled(s.enabled);
      })
      .catch(() => {
        // A failed check is not the same as "the assistant is switched off" — saying so would
        // strand the tab on that message for the rest of the session. Let the user retry.
        if (!alive) return;
        setEnabled(false);
        setStatusFailed(true);
      })
      .finally(() => {
        if (alive) setStatusLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [isSignedIn, statusAttempt]);

  const refreshStatus = useCallback(() => setStatusAttempt((n) => n + 1), []);

  const patchMessage = useCallback((id: string, patch: Partial<ChatDisplayMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const setBusy = useCallback((s: ChatStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  /** Turn a failure into something worth reading. Only 429 used to get its own wording. */
  const describeError = useCallback(
    (err: unknown): string => {
      if (err instanceof AgentStreamTimeoutError) return t('agent.errorTimeout');
      if (err instanceof AgentHttpError) {
        if (err.status === 429) return t('agent.errorLimit');
        if (err.status === 401) return t('agent.errorAuth');
        if (err.status === 503) return t('agent.errorUnavailable');
        // The backend puts a human sentence in `detail`; prefer it to a generic string.
        if (err.message && !/^HTTP \d+$/.test(err.message)) return err.message;
      }
      return t('agent.errorGeneric');
    },
    [t],
  );

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || statusRef.current === 'streaming') return;
      lastSentRef.current = trimmed;

      const assistantId = uid();
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'user', text: trimmed, sources: [] },
        { id: assistantId, role: 'assistant', text: '', sources: [], streaming: true },
      ]);
      setBusy('streaming');
      setActivity(null);

      const controller = new AbortController();
      abortRef.current = controller;
      let raw = '';

      streamAgentChat({
        message: trimmed,
        conversationId: convoIdRef.current,
        getToken,
        signal: controller.signal,
        onEvent: (ev) => {
          switch (ev.type) {
            case 'conversation':
              convoIdRef.current = ev.conversation_id;
              setActiveConversationId(ev.conversation_id);
              break;
            case 'tool':
              setActivity(ev.name);
              break;
            case 'text': {
              setActivity(null); // answer is arriving — drop the "checking…" line
              raw += ev.delta;
              const { text: prose, refs } = parseCitations(raw);
              patchMessage(assistantId, { text: prose, sources: refs });
              break;
            }
            case 'done': {
              const { text: prose, refs } = parseCitations(ev.message || raw);
              patchMessage(assistantId, { text: prose, sources: refs, streaming: false });
              break;
            }
            case 'error':
              // Keep whatever streamed; the server's own wording beats a generic string.
              patchMessage(assistantId, {
                streaming: false,
                error: true,
                retryable: true,
                errorText: ev.detail || t('agent.errorGeneric'),
              });
              break;
          }
        },
      })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return; // User tapped Stop — keep what streamed.
          // Never overwrite `text`: a failure three paragraphs in used to delete all three.
          patchMessage(assistantId, {
            error: true,
            retryable: true,
            errorText: describeError(err),
          });
        })
        .finally(() => {
          // In `finally` because the mock resolves cleanly on abort while the real transport
          // rejects — clearing this only in `.catch` left the typing dots spinning forever in
          // preview mode.
          patchMessage(assistantId, { streaming: false });
          setActivity(null);
          setBusy('idle');
          abortRef.current = null;
        });
    },
    [getToken, patchMessage, setBusy, t, describeError],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  /** Resend the last question, dropping the failed pair so the thread doesn't accumulate them. */
  const retry = useCallback(() => {
    const question = lastSentRef.current;
    if (!question || statusRef.current === 'streaming') return;
    setMessages((prev) => {
      const lastUser = prev.map((m) => m.role === 'user').lastIndexOf(true);
      return lastUser === -1 ? prev : prev.slice(0, lastUser);
    });
    send(question);
  }, [send]);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    convoIdRef.current = null;
    setActiveConversationId(null);
    setMessages([]);
    setActivity(null);
    setBusy('idle');
  }, [setBusy]);

  /**
   * Resolves to whether the thread loaded. It used to let a rejection escape as an unhandled
   * promise rejection, leaving the caller navigating away from a chat that never changed.
   */
  const openThread = useCallback(
    async (id: number) => {
      abortRef.current?.abort();
      const detail = await getConversation(id);
      convoIdRef.current = id;
      setActiveConversationId(id);
      setMessages(storedToDisplay(detail.messages));
      setActivity(null);
      setBusy('idle');
    },
    [setBusy],
  );

  return (
    <AgentChatContext.Provider
      value={{
        enabled,
        statusLoading,
        statusFailed,
        refreshStatus,
        messages,
        activeConversationId,
        status,
        activity,
        send,
        retry,
        stop,
        newChat,
        openThread,
      }}
    >
      {children}
    </AgentChatContext.Provider>
  );
}

export function useAgentChat() {
  const ctx = useContext(AgentChatContext);
  if (!ctx) throw new Error('useAgentChat must be used within AgentChatProvider');
  return ctx;
}
