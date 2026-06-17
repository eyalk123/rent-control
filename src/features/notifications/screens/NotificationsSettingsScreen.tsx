import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Switch, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScreenContainer } from '@/src/shared/components/ui';
import { Icon } from '@/src/shared/components/ui/Icon';
import { useAlert } from '@/src/core/context';
import { useLanguageContext, useRtlLabelStyle } from '@/src/context';
import { darkColors, ICON_SM, lightColors, spacing } from '@/src/core/theme';
import { deleteRule, getPreferences, updateRule, updateSettings } from '../api/preferences';
import { NOTIFICATION_EVENTS, type NotificationEvent, type NotificationPreferences, type NotificationRule } from '../types';

export function NotificationsSettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();
  const { appConfirm, appAlert } = useAlert();
  const rtlLabelStyle = useRtlLabelStyle();
  const { isRtl } = useLanguageContext();

  const header = (
    <View style={[styles.pageHeader, { borderBottomColor: colors.outline }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8} accessibilityRole="button">
        <Icon name={isRtl ? 'chevron-right' : 'chevron-left'} size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text variant="titleLarge" style={[styles.pageTitle, { color: colors.textPrimary }]}>
        {t('notifications.manageTitle')}
      </Text>
      <View style={styles.backButton} />
    </View>
  );

  const [prefs, setPrefs] = React.useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setPrefs(await getPreferences());
    } catch {
      // keep previous state on error
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      load(prefs !== null); // silent refetch when returning from the editor
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load]),
  );

  const settings = prefs?.settings;
  const masterOn = settings?.master_enabled ?? true;

  const patchSettings = async (patch: Parameters<typeof updateSettings>[0]) => {
    if (!settings) return;
    const optimistic = { ...settings, ...patch };
    setPrefs((p) => (p ? { ...p, settings: optimistic } : p));
    try {
      await updateSettings(patch);
    } catch {
      load(true);
    }
  };

  const isMuted = (event: NotificationEvent) => settings?.muted_events.includes(event) ?? false;

  const toggleMute = (event: NotificationEvent, enabled: boolean) => {
    const current = settings?.muted_events ?? [];
    const next = enabled ? current.filter((e) => e !== event) : [...current, event];
    patchSettings({ muted_events: next });
  };

  const toggleRuleEnabled = async (rule: NotificationRule, value: boolean) => {
    setPrefs((p) =>
      p ? { ...p, rules: p.rules.map((r) => (r.id === rule.id ? { ...r, enabled: value } : r)) } : p,
    );
    try {
      await updateRule(rule.id, { enabled: value });
    } catch {
      load(true);
    }
  };

  const confirmDelete = async (rule: NotificationRule) => {
    const ok = await appConfirm(t('notifications.deleteRuleTitle'), t('notifications.deleteRuleMessage'));
    if (!ok) return;
    try {
      await deleteRule(rule.id);
      load(true);
    } catch {
      appAlert(t('error.title', { defaultValue: 'Error' }), t('notifications.saveError', { defaultValue: 'Could not save. Please try again.' }));
    }
  };

  const openEditor = (event: NotificationEvent, rule?: NotificationRule) =>
    router.push({
      pathname: '/notifications/rule',
      params: rule ? { event, id: String(rule.id) } : { event },
    } as never);

  const scopeSummary = (rule: NotificationRule): string => {
    if (rule.scope_property_owners.length) return rule.scope_property_owners.join(', ');
    if (rule.scope_property_ids.length) return t('notifications.scopeCountProperties', { count: rule.scope_property_ids.length });
    if (rule.scope_renter_ids.length) return t('notifications.scopeCountRenters', { count: rule.scope_renter_ids.length });
    return t('notifications.scopeAll');
  };

  if (loading || !settings) {
    return (
      <ScreenContainer>
        {header}
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const cardStyle = [styles.card, { backgroundColor: theme.colors.surface, borderColor: colors.outline }];

  return (
    <ScreenContainer>
      {header}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.subtitle, rtlLabelStyle, { color: colors.textSecondary }]}>
          {t('notifications.subtitle')}
        </Text>

        {/* Master toggle */}
        <View style={cardStyle}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, rtlLabelStyle, { color: colors.textPrimary }]}>{t('notifications.master')}</Text>
              <Text style={[styles.rowHint, rtlLabelStyle, { color: colors.textSecondary }]}>{t('notifications.masterHint')}</Text>
            </View>
            <Switch value={masterOn} onValueChange={(v) => patchSettings({ master_enabled: v })} />
          </View>
        </View>

        {/* Per-event sections */}
        {NOTIFICATION_EVENTS.map((event) => {
          const rules = prefs.rules.filter((r) => r.event_type === event);
          const muted = isMuted(event);
          const dimmed = muted || !masterOn;
          return (
            <View key={event} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, rtlLabelStyle, { color: colors.textPrimary }]}>
                  {t(`notifications.event.${event}`)}
                </Text>
                <Switch value={!muted} onValueChange={(v) => toggleMute(event, v)} />
              </View>

              <View pointerEvents={dimmed ? 'none' : 'auto'} style={{ opacity: dimmed ? 0.5 : 1 }}>
                {rules.length === 0 ? (
                  <View style={cardStyle}>
                    <View style={styles.row}>
                      <View style={styles.rowText}>
                        <Text style={[styles.rowTitle, rtlLabelStyle, { color: colors.textPrimary }]}>{t('notifications.usingDefault')}</Text>
                        <Text style={[styles.rowHint, rtlLabelStyle, { color: colors.textSecondary }]}>{t(`notifications.default.${event}`)}</Text>
                      </View>
                      <TouchableOpacity onPress={() => openEditor(event)} style={[styles.outlineBtn, { borderColor: colors.outline }]}>
                        <Text style={[styles.outlineBtnText, { color: colors.textPrimary }]}>{t('notifications.customize')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    {rules.map((rule) => (
                      <View key={rule.id} style={[cardStyle, styles.ruleRow]}>
                        <View style={styles.ruleInfo}>
                          <Text style={[styles.rowTitle, rtlLabelStyle, { color: colors.textPrimary }]} numberOfLines={1}>
                            {rule.label || t('notifications.untitledRule')}
                          </Text>
                          <Text style={[styles.rowHint, rtlLabelStyle, { color: colors.textSecondary }]} numberOfLines={1}>
                            {t(event === 'lease_expiring' ? 'notifications.summaryBefore' : 'notifications.summaryAfter', { days: rule.offsets.join(', ') })}
                            {' · '}
                            {scopeSummary(rule)}
                          </Text>
                        </View>
                        <Switch value={rule.enabled} onValueChange={(v) => toggleRuleEnabled(rule, v)} />
                        <TouchableOpacity onPress={() => openEditor(event, rule)} hitSlop={8} style={styles.iconBtn}>
                          <Icon name="pencil" size={ICON_SM} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => confirmDelete(rule)} hitSlop={8} style={styles.iconBtn}>
                          <Icon name="trash" size={ICON_SM} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity onPress={() => openEditor(event)} style={styles.addRow}>
                      <Icon name="plus" size={ICON_SM} color={colors.primary} />
                      <Text style={[styles.addText, { color: colors.primary }]}>{t('notifications.addRule')}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { width: 32, alignItems: 'center' },
  pageTitle: { fontWeight: '700', flex: 1, textAlign: 'center' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 14, fontWeight: '600' },
  rowHint: { fontSize: 12 },
  section: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  outlineBtn: {
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  outlineBtnText: { fontSize: 13, fontWeight: '600' },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  ruleInfo: { flex: 1, gap: 2 },
  iconBtn: { padding: 4 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  addText: { fontSize: 13, fontWeight: '600' },
});
