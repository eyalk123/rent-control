import type { AgentEvent, ConversationDetail, ConversationSummary } from '../types';
import type { StreamChatArgs } from './agentStream';

/**
 * In-memory stand-in for POST /agent/chat, used when `USE_MOCK_API` is on (which the dev web
 * preview turns on — see src/core/api/mock.ts). It replays a canned answer through the same
 * `AgentEvent` sequence the real SSE stream emits, so the chat UI — tool activity, streaming
 * deltas, citation chips — can be exercised with no backend and no API key.
 */

const MOCK_THREADS: ConversationSummary[] = [
  {
    id: 1,
    title: 'Overdue renters in March',
    created_at: '2026-03-02T09:12:00Z',
    updated_at: '2026-03-02T09:14:00Z',
  },
];

// Markers sit after a complete clause, never inside one. The last line used to read
// 'Everyone else at [[property:1|123 Main St]] has paid.', which strips to "Everyone else
// at has paid." — the prose leaned on the marker's label to make sense, so the mock was
// modelling a shape the backend does not produce and preview mode showed a broken sentence.
const MOCK_ANSWER =
  'Two renters are behind this month.\n\n' +
  '- **Sarah Johnson** — ₪2,200, 6 days overdue [[renter:1|Sarah Johnson]]\n' +
  '- **Michael Chen** — ₪1,900, 2 days overdue [[renter:2|Michael Chen]]\n\n' +
  'Everyone else at 123 Main St has paid. [[property:1|123 Main St]]';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function listConversationsMock(): Promise<ConversationSummary[]> {
  return Promise.resolve(MOCK_THREADS);
}

export function getConversationMock(id: number): Promise<ConversationDetail> {
  const conversation = MOCK_THREADS.find((c) => c.id === id) ?? MOCK_THREADS[0];
  return Promise.resolve({
    conversation,
    messages: [
      { id: 1, role: 'user', content: "Who hasn't paid this month?", created_at: conversation.created_at },
      {
        id: 2,
        role: 'assistant',
        content: [{ type: 'text', text: MOCK_ANSWER }],
        created_at: conversation.updated_at,
      },
    ],
  });
}

/** Replays the canned answer word by word, honouring `signal` so Stop still works. */
export async function streamAgentChatMock({ signal, onEvent }: StreamChatArgs): Promise<void> {
  const emit = (event: AgentEvent) => {
    if (!signal?.aborted) onEvent(event);
  };

  emit({ type: 'conversation', conversation_id: 1 });
  await delay(400);
  emit({ type: 'tool', name: 'get_overdue' });
  await delay(900);

  const words = MOCK_ANSWER.split(' ');
  for (const word of words) {
    if (signal?.aborted) return;
    emit({ type: 'text', delta: `${word} ` });
    await delay(35);
  }

  emit({ type: 'done', status: 'ok', message: '', tool_calls: ['get_overdue'] });
}
