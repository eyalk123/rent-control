import apiClient from '@/src/core/api/client';
import { USE_MOCK_API } from '@/src/core/api/mock';

export type DevicePlatform = 'ios' | 'android' | 'web';

export interface DeviceToken {
  id: number;
  token: string;
  platform: DevicePlatform;
  created_at: string;
  last_used_at: string;
}

/** Register (or refresh) this device's Expo push token for the signed-in user. */
export async function registerDeviceToken(
  token: string,
  platform: DevicePlatform,
): Promise<DeviceToken | null> {
  if (USE_MOCK_API) return null;
  const response = await apiClient.post<DeviceToken>('/device-tokens', {
    token,
    platform,
  });
  return response.data;
}

/** Unregister this device's push token (call before signing out, while still authed). */
export async function unregisterDeviceToken(token: string): Promise<void> {
  if (USE_MOCK_API) return;
  await apiClient.delete('/device-tokens', { params: { token } });
}
