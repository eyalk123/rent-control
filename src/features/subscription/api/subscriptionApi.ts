import apiClient from '@/src/core/api/client';
import { USE_MOCK_API } from '@/src/core/api/mock';
import { acknowledgeLockNoticeMock, getSubscriptionMock } from './subscriptionMock';
import type { Subscription } from '../types';

export async function getSubscription(): Promise<Subscription> {
  if (USE_MOCK_API) return getSubscriptionMock();
  const { data } = await apiClient.get<Subscription>('/subscription');
  return data;
}

/** Record that the over-limit explanation has been shown. Called once, after showing it. */
export async function acknowledgeLockNotice(): Promise<void> {
  if (USE_MOCK_API) return acknowledgeLockNoticeMock();
  await apiClient.post('/subscription/lock-notice/ack');
}
