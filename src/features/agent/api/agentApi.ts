import apiClient from '@/src/core/api/client';
import { USE_MOCK_API } from '@/src/core/api/mock';
import type { AgentStatus, ConversationDetail, ConversationSummary } from '../types';
import { streamAgentChatHttp, type StreamChatArgs } from './agentStream';
import { getConversationMock, listConversationsMock, streamAgentChatMock } from './agentMock';

/**
 * Throws on failure rather than reporting `{enabled:false}`. "We couldn't ask" and "it is
 * switched off" need different answers on screen: the first is worth retrying, the second is
 * final. Callers decide — see AgentChatContext.
 */
export async function getAgentStatus(): Promise<AgentStatus> {
  if (USE_MOCK_API) return { enabled: true };
  const { data } = await apiClient.get<AgentStatus>('/agent/status');
  return data;
}

export async function listConversations(): Promise<ConversationSummary[]> {
  if (USE_MOCK_API) return listConversationsMock();
  const { data } = await apiClient.get<ConversationSummary[]>('/agent/conversations');
  return data;
}

export async function getConversation(id: number): Promise<ConversationDetail> {
  if (USE_MOCK_API) return getConversationMock(id);
  const { data } = await apiClient.get<ConversationDetail>(`/agent/conversations/${id}`);
  return data;
}

export async function deleteConversation(id: number): Promise<void> {
  if (USE_MOCK_API) return;
  await apiClient.delete(`/agent/conversations/${id}`);
}

/** Stream a chat turn. Resolves when the stream ends (a `done`/`error` event has fired). */
export function streamAgentChat(args: StreamChatArgs): Promise<void> {
  if (USE_MOCK_API) return streamAgentChatMock(args);
  return streamAgentChatHttp(args);
}
