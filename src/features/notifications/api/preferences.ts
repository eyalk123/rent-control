import apiClient from '@/src/core/api/client';
import { USE_MOCK_API } from '@/src/core/api/mock';
import type {
  NotificationPreferences,
  NotificationRule,
  NotificationRuleDraft,
  NotificationSettings,
  RulePreview,
} from '../types';

const EMPTY_PREFS: NotificationPreferences = {
  // Mirrors the backend's column defaults, so mock mode shows the same starting state.
  settings: {
    master_enabled: true,
    muted_events: [],
    cpi_min_change_amount: 10,
    cpi_min_change_percent: 0.5,
    whatsapp_templates: {},
  },
  rules: [],
};

export async function getPreferences(): Promise<NotificationPreferences> {
  if (USE_MOCK_API) return EMPTY_PREFS;
  const { data } = await apiClient.get<NotificationPreferences>('/notification-preferences');
  return data;
}

export async function updateSettings(
  patch: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  if (USE_MOCK_API) return { ...EMPTY_PREFS.settings, ...patch };
  const { data } = await apiClient.put<NotificationSettings>(
    '/notification-preferences/settings',
    patch,
  );
  return data;
}

export async function createRule(draft: NotificationRuleDraft): Promise<NotificationRule> {
  const { data } = await apiClient.post<NotificationRule>('/notification-rules', draft);
  return data;
}

export async function updateRule(
  id: number,
  patch: Partial<NotificationRuleDraft>,
): Promise<NotificationRule> {
  const { data } = await apiClient.patch<NotificationRule>(`/notification-rules/${id}`, patch);
  return data;
}

export async function deleteRule(id: number): Promise<void> {
  await apiClient.delete(`/notification-rules/${id}`);
}

export async function previewRule(draft: NotificationRuleDraft): Promise<RulePreview> {
  if (USE_MOCK_API) return { matched_renters: 0, estimated_alerts: 0 };
  const { data } = await apiClient.post<RulePreview>('/notification-rules/preview', draft);
  return data;
}
