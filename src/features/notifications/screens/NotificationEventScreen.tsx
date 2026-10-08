import React from 'react';
import { currencySymbol } from '@/src/shared/utils/money';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Switch, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/src/shared/components/ui';
import { Icon } from '@/src/shared/components/ui/Icon';
import { useLanguageContext, useRtlInputStyle, useRtlLabelStyle } from '@/src/context';
import { darkColors, ICON_SM, lightColors, spacing } from '@/src/core/theme';
import { NOTIFICATION_EVENTS, isRuleEvent, type NotificationEvent, type NotificationRule } from '../types';
import { ruleScheduleText, ruleScopeText } from '../summary';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';

/**
 * The CPI event's stand-in for a rule editor. Offsets and scope make no sense for it —
 * it fires when the index moves — so the only dial is how big a change has to be before
 * it's worth an alert. Committed on blur so every keystroke isn't a PUT.
 */
function ThresholdField({
  label,
  suffix,
  value,
  onCommit,
  colors,
  surface,
}: {
  label: string;
  suffix: string;
  value: number;
  onCommit: (v: number) => void;
  colors: typeof lightColors | typeof darkColors;
  surface: string;
}) {
  const { t } = useTranslation();
  const [text, setText] = React.useState(String(value));
  const rtlLabelStyle = useRtlLabelStyle();
  const rtlInputStyle = useRtlInputStyle();

  // Re-sync when a failed save rolls the stored value back under us.
  React.useEffect(() => setText(String(value)), [value]);

  const commit = () => {
    const parsed = Number(text);
    if (text.trim() === '' || Number.isNaN(parsed) || parsed < 0) {
      setText(String(value)); // reject nonsense by snapping back to what is stored
      return;
    }
    if (parsed !== value) onCommit(parsed);
  };

  return (
    <View style={styles.thresholdField}>
      <Text style={[styles.fieldLabel, rtlLabelStyle, { color: colors.fieldLabel }]}>{label}</Text>
      <View style={styles.thresholdInputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          onBlur={commit}
          keyboardType="decimal-pad"
          inputAccessoryViewButtonLabel={t("common.keyboardDone")}
          accessibilityLabel={label}
          style={[
            styles.thresholdInput,
            rtlInputStyle,
            { borderColor: colors.outline, color: colors.textPrimary, backgroundColor: surface },
          ]}
        />
        <Text style={{ color: colors.textSecondary }}>{suffix}</Text>
      </View>
    </View>
  );
}

/**
 * One event's settings: its on/off switch, then either its reminder list (with the
 * built-in default shown when no custom reminder is active) or, for CPI, the threshold.
 */
export function NotificationEventScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();
  const rtlLabelStyle = useRtlLabelStyle();
  const { isRtl } = useLanguageContext();
  const { prefs, settings, loading, patchSettings, isMuted, setEventEnabled, setRuleEnabled } =
    useNotificationPreferences();

  const params = useLocalSearchParams<{ event?: string }>();
  const event: NotificationEvent = NOTIFICATION_EVENTS.includes(params.event as NotificationEvent)
    ? (params.event as NotificationEvent)
    : 'overdue';
  const title = t(`notifications.event.${event}`);

  const header = (
    <View style={[styles.pageHeader, { borderBottomColor: colors.outline }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8} accessibilityRole="button">
        <Icon name={isRtl ? 'chevron-right' : 'chevron-left'} size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text variant="titleLarge" style={[styles.pageTitle, { color: colors.textPrimary }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.backButton} />
    </View>
  );

  if (loading || !prefs || !settings) {
    return (
      <ScreenContainer>
        {header}
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const muted = isMuted(event);
  const rules = prefs.rules.filter((r) => r.event_type === event);
  const hasActiveRule = rules.some((r) => r.enabled);
  const cardStyle = [styles.card, { backgroundColor: theme.colors.surface, borderColor: colors.outline }];
  const chevron = isRtl ? 'chevron-left' : 'chevron-right';

  const sectionLabel = (label: string) => (
    <Text style={[styles.sectionLabel, rtlLabelStyle, { color: colors.textSecondary }]}>{label}</Text>
  );

  const openEditor = (rule?: NotificationRule) =>
    router.push({
      pathname: '/notifications/rule',
      params: rule ? { event, id: String(rule.id) } : { event },
    } as never);

  // Shown whenever no custom reminder is active — which is exactly when the backend
  // falls back to it, including when every custom reminder has been switched off.
  const defaultCard = (
    <View style={[...cardStyle, styles.block]}>
      <Text style={[styles.badge, rtlLabelStyle, { color: colors.textSecondary }]}>{t('notifications.defaultLabel')}</Text>
      <Text style={[styles.rowTitle, rtlLabelStyle, { color: colors.textPrimary }]}>{t(`notifications.default.${event}`)}</Text>
    </View>
  );

  const reminders = (
    <View style={styles.section}>
      {sectionLabel(t('notifications.whenTitle'))}
      {!hasActiveRule && defaultCard}
      {rules.length > 0 && (
        <View style={cardStyle}>
          {rules.map((rule, i) => (
            <TouchableOpacity
              key={rule.id}
              style={[styles.ruleRow, i > 0 && [styles.divider, { borderTopColor: colors.outline }]]}
              onPress={() => openEditor(rule)}
              accessibilityRole="button"
            >
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, rtlLabelStyle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {rule.label || ruleScheduleText(rule, t)}
                </Text>
                <Text style={[styles.rowHint, rtlLabelStyle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {rule.label ? `${ruleScheduleText(rule, t)} · ${ruleScopeText(rule, t)}` : ruleScopeText(rule, t)}
                </Text>
              </View>
              <Switch
                value={rule.enabled}
                onValueChange={(v) => setRuleEnabled(rule, v)}
                accessibilityLabel={t('notifications.ruleEnabled')}
              />
              <Icon name={chevron} size={ICON_SM} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      )}
      {!hasActiveRule && (
        <Text style={[styles.hint, rtlLabelStyle, { color: colors.textSecondary }]}>
          {rules.length > 0 ? t('notifications.allPaused') : t('notifications.defaultHint')}
        </Text>
      )}
      <TouchableOpacity onPress={() => openEditor()} style={styles.addRow} accessibilityRole="button">
        <Icon name="plus" size={ICON_SM} color={colors.primary} />
        <Text style={[styles.addText, { color: colors.primary }]}>{t('notifications.addRule')}</Text>
      </TouchableOpacity>
    </View>
  );

  const cpi = (
    <>
      <View style={styles.section}>
        {sectionLabel(t('notifications.cpiWhenTitle'))}
        <View style={[...cardStyle, styles.block]}>
          <Text style={[styles.rowTitle, rtlLabelStyle, { color: colors.textPrimary }]}>{t(`notifications.default.${event}`)}</Text>
        </View>
      </View>
      <View style={styles.section}>
        <View style={[...cardStyle, styles.block]}>
          <Text style={[styles.rowTitle, rtlLabelStyle, { color: colors.textPrimary }]}>{t('notifications.cpiThresholdTitle')}</Text>
          <View style={styles.thresholdFields}>
            <ThresholdField
              label={t('notifications.cpiMinAmount')}
              suffix={currencySymbol()}
              value={settings.cpi_min_change_amount}
              onCommit={(v) => patchSettings({ cpi_min_change_amount: v })}
              colors={colors}
              surface={theme.colors.surface}
            />
            <ThresholdField
              label={t('notifications.cpiMinPercent')}
              suffix="%"
              value={settings.cpi_min_change_percent}
              onCommit={(v) => patchSettings({ cpi_min_change_percent: v })}
              colors={colors}
              surface={theme.colors.surface}
            />
          </View>
          <Text style={[styles.rowHint, rtlLabelStyle, { color: colors.textSecondary }]}>{t('notifications.cpiThresholdHint')}</Text>
        </View>
      </View>
    </>
  );

  return (
    <ScreenContainer>
      {header}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[...cardStyle, styles.switchRow]}>
          <View style={styles.rowText}>
            <Text style={[styles.switchTitle, rtlLabelStyle, { color: colors.textPrimary }]}>{t('notifications.eventSwitch')}</Text>
          </View>
          <Switch value={!muted} onValueChange={(v) => setEventEnabled(event, v)} accessibilityLabel={title} />
        </View>

        {!settings.master_enabled ? (
          <Text style={[styles.hint, rtlLabelStyle, { color: colors.textSecondary }]}>{t('notifications.masterOff')}</Text>
        ) : muted ? (
          <Text style={[styles.hint, rtlLabelStyle, { color: colors.textSecondary }]}>{t('notifications.eventOffHint')}</Text>
        ) : isRuleEvent(event) ? (
          reminders
        ) : (
          cpi
        )}
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
    gap: spacing.lg,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  switchTitle: { fontSize: 16, fontWeight: '600' },
  section: { gap: spacing.sm },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xs,
  },
  block: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  badge: { fontSize: 12, fontWeight: '600' },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 60,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowHint: { fontSize: 13 },
  hint: { fontSize: 13, lineHeight: 18, paddingHorizontal: spacing.xs },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  addText: { fontSize: 14, fontWeight: '600' },
  thresholdFields: {
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  thresholdField: { flex: 1, gap: 4 },
  fieldLabel: { fontSize: 12 },
  thresholdInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  thresholdInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 10,
    fontSize: 15,
  },
});
