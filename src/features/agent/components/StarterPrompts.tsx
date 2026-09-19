import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Icon, type IconName } from '@/src/shared/components/ui';
import { useLanguageContext } from '@/src/context';
import { darkColors, ICON_MD, ICON_SM, lightColors, spacing } from '@/src/core/theme';
import { useAgentChat } from '../context/AgentChatContext';

/**
 * The quick questions, each owning its icon. Addressed by key rather than by position: an
 * icon array indexed against `t('agent.starters')` meant reordering or adding a question in
 * either locale silently paired it with the wrong icon, and kept the two locale arrays in
 * step by convention alone. A missing key now shows up as a visible `agent.starters.…`
 * string instead.
 */
const STARTERS: { key: string; icon: IconName }[] = [
  { key: 'overdue', icon: 'alert-circle' },
  { key: 'earnings', icon: 'trending-up' },
  { key: 'leaseEnd', icon: 'calendar' },
];

/** Empty-conversation state: a hint + localized quick questions that send on tap. */
export function StarterPrompts() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const { send } = useAgentChat();
  const router = useRouter();
  const accentBg = colors.accentBg;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text
        variant="titleMedium"
        style={[styles.emptyTitle, styles.fullWidth, { color: colors.textPrimary }]}
      >
        {t('agent.emptyTitle')}
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.hint, styles.fullWidth, { color: colors.textSecondary }]}
      >
        {t('agent.emptyHint')}
      </Text>

      <Text
        variant="labelSmall"
        style={[styles.sectionLabel, styles.fullWidth, { color: colors.textSecondary }]}
      >
        {t('agent.startersLabel')}
      </Text>

      <View style={styles.list}>
        {STARTERS.map(({ key, icon }) => {
          const prompt = t(`agent.starters.${key}`);
          return (
            <TouchableOpacity
              key={key}
              activeOpacity={0.7}
              accessibilityRole="button"
              onPress={() => send(prompt)}
              style={[
                styles.card,
                { backgroundColor: theme.colors.surface, borderColor: colors.outline },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: accentBg }]}>
                <Icon name={icon} size={ICON_MD} color={colors.accent} />
              </View>
              <Text style={[styles.prompt, { color: colors.textPrimary }]}>{prompt}</Text>
              <View style={{ transform: [{ scaleX: isRtl ? -1 : 1 }] }}>
                <Icon name="chevron-right" size={ICON_SM} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* The assistant is read-only — it answers and cites, it never files anything.
          People still type "this is broken" into it, and without this those reports
          die here. Deliberately not a card: it must not compete with the starters,
          only be there when a starter is not what someone wanted. */}
      <View style={[styles.feedback, { borderTopColor: colors.outline }]}>
        <Text
          variant="bodySmall"
          style={[styles.feedbackPrompt, styles.fullWidth, { color: colors.textSecondary }]}
        >
          {t('feedback.fromChatPrompt')}
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityRole="button"
          onPress={() => router.push('/settings/feedback' as any)}
          // Plain `row`: React Native already mirrors it under native RTL, so adding
          // `row-reverse` here flipped it a second time and left the icon trailing the
          // Hebrew text instead of leading it.
          style={styles.feedbackRow}
        >
          <Icon name="message-circle" size={ICON_SM} color={colors.accent} />
          <Text style={[styles.feedbackAction, { color: colors.accent }]}>
            {t('feedback.fromChatAction')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Full-width boxes so each line aligns against the column, not against its own
  // longest line.
  //
  // These deliberately carry NO `textAlign`. Under native RTL the platform default
  // already right-aligns them, and the app's `useRtlLabelStyle` — which sets
  // `textAlign: 'right'` explicitly — rendered these Paper <Text> nodes flush LEFT in
  // Hebrew, while the untouched starter-card labels below were correct. Setting nothing
  // is what works here; see the note in the component.
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  emptyTitle: {
    marginBottom: spacing.xs,
  },
  hint: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prompt: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  feedback: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  feedbackPrompt: {
    marginBottom: spacing.xs,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  feedbackAction: {
    fontSize: 14,
    fontWeight: '600',
  },
});
