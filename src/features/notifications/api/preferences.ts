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

// Mock mode keeps what was written, the way the server would — otherwise a toggle
// reverts the moment a screen refetches, and the rule editor has nothing to save to.
let mockPrefs: NotificationPreferences = EMPTY_PREFS;
let mockNextRuleId = 1;

export async function getPreferences(): Promise<NotificationPreferences> {
  if (USE_MOCK_API) return mockPrefs;
  const { data } = await apiClient.get<NotificationPreferences>('/notification-preferences');
  return data;
}

export async function updateSettings(
  patch: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  if (USE_MOCK_API) {
    mockPrefs = { ...mockPrefs, settings: { ...mockPrefs.settings, ...patch } };
    return mockPrefs.settings;
  }
  const { data } = await apiClient.put<NotificationSettings>(
    '/notification-preferences/settings',
    patch,
  );
  return data;
}

export async function createRule(draft: NotificationRuleDraft): Promise<NotificationRule> {
  if (USE_MOCK_API) {
    const rule: NotificationRule = { id: mockNextRuleId++, label: null, enabled: true, ...draft };
    mockPrefs = { ...mockPrefs, rules: [...mockPrefs.rules, rule] };
    return rule;
  }
  const { data } = await apiClient.post<NotificationRule>('/notification-rules', draft);
  return data;
}

export async function updateRule(
  id: number,
  patch: Partial<NotificationRuleDraft>,
): Promise<NotificationRule> {
  if (USE_MOCK_API) {
    mockPrefs = { ...mockPrefs, rules: mockPrefs.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) };
    return mockPrefs.rules.find((r) => r.id === id)!;
  }
  const { data } = await apiClient.patch<NotificationRule>(`/notification-rules/${id}`, patch);
  return data;
}

export async function deleteRule(id: number): Promise<void> {
  if (USE_MOCK_API) {
    mockPrefs = { ...mockPrefs, rules: mockPrefs.rules.filter((r) => r.id !== id) };
    return;
  }
  await apiClient.delete(`/notification-rules/${id}`);
}

export async function previewRule(draft: NotificationRuleDraft): Promise<RulePreview> {
  if (USE_MOCK_API) return { matched_renters: 0, estimated_alerts: 0 };
  const { data } = await apiClient.post<RulePreview>('/notification-rules/preview', draft);
  return data;
}
