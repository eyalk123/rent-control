import React from 'react';
import { useFocusEffect } from 'expo-router';
import { getPreferences, updateRule, updateSettings } from '../api/preferences';
import type { NotificationEvent, NotificationPreferences, NotificationRule } from '../types';

// One copy shared by the overview and the per-event screen. With a copy per screen, a
// change made on the event screen was only in *its* state: going back showed the
// overview's stale copy until its refetch landed — and that refetch could overtake the
// PUT still in flight and bring the old value back.
let cache: NotificationPreferences | null = null;
let pendingWrites = 0;
let mountedScreens = 0;
const listeners = new Set<() => void>();

function setCache(next: NotificationPreferences | null) {
  cache = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function refetch() {
  try {
    const fresh = await getPreferences();
    // A write started after this request went out; its optimistic value is newer.
    if (pendingWrites === 0) setCache(fresh);
  } catch {
    // keep what we have
  }
}

async function write(optimistic: (p: NotificationPreferences) => NotificationPreferences, send: () => Promise<unknown>) {
  if (!cache) return;
  setCache(optimistic(cache));
  pendingWrites++;
  let failed = false;
  try {
    await send();
  } catch {
    failed = true;
  } finally {
    pendingWrites--;
  }
  // The server refused it: put back whatever it actually has.
  if (failed) refetch();
}

/**
 * Preferences for the notification screens. Refetched on focus so a rule saved in the
 * editor shows on return; writes are optimistic and roll back via a refetch on failure.
 */
export function useNotificationPreferences() {
  const prefs = React.useSyncExternalStore(subscribe, () => cache);
  const [loading, setLoading] = React.useState(cache === null);

  // Dropped once no notification screen is open, so the next visit — possibly by another
  // account on this device — starts from the server rather than from what was left here.
  React.useEffect(() => {
    mountedScreens++;
    return () => {
      mountedScreens--;
      if (mountedScreens === 0) cache = null;
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refetch().finally(() => setLoading(false));
    }, []),
  );

  const settings = prefs?.settings;

  const patchSettings = (patch: Parameters<typeof updateSettings>[0]) =>
    write((p) => ({ ...p, settings: { ...p.settings, ...patch } }), () => updateSettings(patch));

  const isMuted = (event: NotificationEvent) => settings?.muted_events.includes(event) ?? false;

  const setEventEnabled = (event: NotificationEvent, enabled: boolean) => {
    const current = settings?.muted_events ?? [];
    const next = enabled ? current.filter((e) => e !== event) : [...current, event];
    patchSettings({ muted_events: next });
  };

  const setRuleEnabled = (rule: NotificationRule, value: boolean) =>
    write(
      (p) => ({ ...p, rules: p.rules.map((r) => (r.id === rule.id ? { ...r, enabled: value } : r)) }),
      () => updateRule(rule.id, { enabled: value }),
    );

  return { prefs, settings, loading, patchSettings, isMuted, setEventEnabled, setRuleEnabled };
}
