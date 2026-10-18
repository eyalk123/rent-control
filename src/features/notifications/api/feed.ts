import apiClient from '@/src/core/api/client';
import { USE_MOCK_API, mockFeedAlerts, dismissMockRateAlert } from '@/src/core/api/mock';
import type { NotificationItem } from '../types';

/** The in-app notification feed. The server collapses duplicate offsets and
 * freshens itself on read, so this is the single source for the Home alerts. */
export async function getNotifications(
  status: 'unread' | 'all' = 'all',
): Promise<NotificationItem[]> {
  if (USE_MOCK_API) return mockFeedAlerts() as NotificationItem[];
  const { data } = await apiClient.get<NotificationItem[]>('/notifications', {
    // Asked for explicitly: builds older than this one can't render an alert that names
    // no renter, so the server leaves it out unless the client says it can.
    params: { status, include_mortgage_alerts: true },
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
  if (USE_MOCK_API) return dismissMockRateAlert(id);
  await apiClient.post(`/notifications/${id}/dismiss`);
}
