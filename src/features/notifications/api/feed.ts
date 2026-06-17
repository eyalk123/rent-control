import apiClient from '@/src/core/api/client';
import { USE_MOCK_API } from '@/src/core/api/mock';
import type { NotificationItem } from '../types';

/** The in-app notification feed. The server collapses duplicate offsets and
 * freshens itself on read, so this is the single source for the Home alerts. */
export async function getNotifications(
  status: 'unread' | 'all' = 'all',
): Promise<NotificationItem[]> {
  if (USE_MOCK_API) return [];
  const { data } = await apiClient.get<NotificationItem[]>('/notifications', {
    params: { status },
  });
  return data;
}

export async function markNotificationRead(id: number): Promise<void> {
  if (USE_MOCK_API) return;
  await apiClient.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  if (USE_MOCK_API) return;
  await apiClient.post('/notifications/read-all');
}

/** Dismiss a feed item. Server-side this clears the whole (type, renter, period)
 * group, so marking rent paid / ignoring removes every offset behind the item. */
export async function dismissNotification(id: number): Promise<void> {
  if (USE_MOCK_API) return;
  await apiClient.post(`/notifications/${id}/dismiss`);
}
