import { apiClient, USE_MOCK_API } from '@/src/core/api';

export interface PlatformVersion {
  latest: string | null;
  minimum: string | null;
}

export interface AppVersionInfo {
  ios: PlatformVersion;
  android: PlatformVersion;
}

/**
 * The store versions configured on the backend (`MOBILE_*_VERSION_*` env vars). Unauthenticated,
 * so an outdated build is told to update even when it can no longer sign in.
 *
 * Mock mode answers "nothing configured" so the prompt stays out of the way of UI work.
 */
export async function getAppVersion(): Promise<AppVersionInfo> {
  if (USE_MOCK_API) {
    return { ios: { latest: '99.0.0', minimum: null }, android: { latest: '99.0.0', minimum: null } }; // TEMP-VERIFY
  }
  const response = await apiClient.get<AppVersionInfo>('/app-version');
  return response.data;
}
