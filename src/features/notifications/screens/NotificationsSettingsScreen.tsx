import React from 'react';
import { allowedModes } from '@/src/shared/utils/capabilities';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Switch, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/src/shared/components/ui';
import { Icon, type IconName } from '@/src/shared/components/ui/Icon';
import { useLanguageContext, useRtlLabelStyle } from '@/src/context';
import { darkColors, ICON_SM, lightColors, spacing } from '@/src/core/theme';
import { NOTIFICATION_EVENTS, EVENT_REQUIREMENTS, isRuleEvent, type NotificationEvent } from '../types';
import { EVENT_ICONS, eventSummary } from '../summary';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import { ANCHORS } from '@/src/features/onboarding/anchors';
import { TourAnchor } from '@/src/features/onboarding/AnchorRegistry';
import { useTour } from '@/src/features/onboarding/TourController';

/**
 * Asks for the tour from inside the loaded tree — the screen renders a spinner until the
 * preferences arrive, and none of the three anchors exist before then.
 */
function NotificationsTourRequest() {
  useTour('notifications');
  return null;
}

/**
 * The overview: the master switch, then one row per event saying when it fires (or that
 * it is off). The master is the only switch here — an event's own on/off, its custom
 * rules and the CPI threshold all live a tap deeper on NotificationEventScreen, so no
 * control appears in two places.
 */
export function NotificationsSettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();
  const rtlLabelStyle = useRtlLabelStyle();
  const { isRtl } = useLanguageContext();
  const { prefs, settings, loading, patchSettings, isMuted } = useNotificationPreferences();

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

  const masterOn = settings.master_enabled;
  const cardStyle = [styles.card, { backgroundColor: theme.colors.surface, borderColor: colors.outline }];
  const chevron = isRtl ? 'chevron-left' : 'chevron-right';
  // Only the events this country can actually receive — see EVENT_REQUIREMENTS.
  const availableEvents = allowedModes(NOTIFICATION_EVENTS, EVENT_REQUIREMENTS);
  const firstRuleEvent = availableEvents.find(isRuleEvent);

  const sectionLabel = (label: string) => (
    <Text style={[styles.sectionLabel, rtlLabelStyle, { color: colors.textSecondary }]}>{label}</Text>
  );

  const iconBubble = (name: IconName, dim = false) => (
    <View style={[styles.iconBubble, { backgroundColor: colors.primaryBg, opacity: dim ? 0.5 : 1 }]}>
      <Icon name={name} size={ICON_SM} color={colors.primary} />
    </View>
  );

  const openEvent = (event: NotificationEvent) =>
    router.push({ pathname: '/notifications/event', params: { event } } as never);

  return (
    <ScreenContainer>
      {header}
      <NotificationsTourRequest />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Master switch — the page's one top-level control, set larger than the rows under it. */}
        <View style={[...cardStyle, styles.masterRow]}>
          <View style={styles.rowText}>
            <Text style={[styles.masterTitle, rtlLabelStyle, { color: colors.textPrimary }]}>{t('notifications.master')}</Text>
            <Text style={[styles.rowHint, rtlLabelStyle, { color: colors.textSecondary }]}>{t('notifications.masterHint')}</Text>
          </View>
          <Switch
            value={masterOn}
            onValueChange={(v) => patchSettings({ master_enabled: v })}
            accessibilityLabel={t('notifications.master')}
          />
        </View>

        {masterOn ? (
          <View style={styles.section}>
            {sectionLabel(t('notifications.sectionAlerts'))}
            <TourAnchor id={ANCHORS.notificationsEventList} style={cardStyle}>
              {availableEvents.map((event, i) => {
                const muted = isMuted(event);
                const rules = prefs.rules.filter((r) => r.event_type === event);
                const title = t(`notifications.event.${event}`);
                return (
                  // Only the first rule-bearing event carries the rules anchor: it is the
                  // row that leads to the reminder editor.
                  <TourAnchor
                    key={event}
                    id={event === firstRuleEvent ? ANCHORS.notificationsRulesEntry : undefined}
                    style={i > 0 ? [styles.divider, { borderTopColor: colors.outline }] : undefined}
                  >
                    <TouchableOpacity
                      style={styles.eventRow}
                      onPress={() => openEvent(event)}
                      accessibilityRole="button"
                      accessibilityLabel={title}
                    >
                      {iconBubble(EVENT_ICONS[event], muted)}
                      <View style={styles.rowText}>
                        <Text style={[styles.rowTitle, rtlLabelStyle, { color: colors.textPrimary }]}>{title}</Text>
                        <Text style={[styles.rowHint, rtlLabelStyle, { color: colors.textSecondary }]} numberOfLines={2}>
                          {muted ? t('notifications.eventOff') : eventSummary(event, rules, settings, t)}
                        </Text>
                      </View>
                      <Icon name={chevron} size={ICON_SM} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </TourAnchor>
                );
              })}
            </TourAnchor>
          </View>
        ) : (
          <View style={styles.offNote}>
            <Icon name="info" size={ICON_SM} color={colors.textSecondary} />
            <View style={styles.rowText}>
              <Text style={[styles.offNoteText, rtlLabelStyle, { color: colors.textSecondary }]}>{t('notifications.masterOff')}</Text>
            </View>
          </View>
        )}

        {/* The WhatsApp copy behind each alert's Message button. Not gated on the
            master switch: these messages are sent by hand from a feed row, so they
            still work for someone who has turned push off entirely. */}
        <View style={styles.section}>
          {sectionLabel(t('notifications.sectionMessages'))}
          <TourAnchor id={ANCHORS.notificationsTemplatesEntry}>
            <TouchableOpacity
              style={[...cardStyle, styles.eventRow]}
              onPress={() => router.push('/notifications/templates' as never)}
              accessibilityRole="button"
            >
              {iconBubble('message-circle')}
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, rtlLabelStyle, { color: colors.textPrimary }]}>
                  {t('notifications.messagesRow')}
                </Text>
                <Text style={[styles.rowHint, rtlLabelStyle, { color: colors.textSecondary }]}>
                  {t('notifications.messagesRowHint')}
                </Text>
              </View>
              <Icon name={chevron} size={ICON_SM} color={colors.textSecondary} />
            </TouchableOpacity>
          </TourAnchor>
        </View>
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
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  masterTitle: { fontSize: 17, fontWeight: '700' },
  section: { gap: spacing.sm },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xs,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowHint: { fontSize: 13 },
  offNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  offNoteText: { fontSize: 13, lineHeight: 18 },
});
