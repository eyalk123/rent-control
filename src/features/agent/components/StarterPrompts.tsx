import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/src/shared/components/ui';
import { useLanguageContext, useRtlLabelStyle } from '@/src/context';
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
  const rtlLabelStyle = useRtlLabelStyle();
  const { send } = useAgentChat();
  const accentBg = theme.dark ? 'rgba(194,149,67,0.15)' : 'rgba(212,162,76,0.12)';

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text
        variant="titleMedium"
        style={[styles.emptyTitle, rtlLabelStyle, styles.fullWidth, { color: colors.textPrimary }]}
      >
        {t('agent.emptyTitle')}
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.hint, rtlLabelStyle, styles.fullWidth, { color: colors.textSecondary }]}
      >
        {t('agent.emptyHint')}
      </Text>

      <Text
        variant="labelSmall"
        style={[styles.sectionLabel, rtlLabelStyle, styles.fullWidth, { color: colors.textSecondary }]}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // `useRtlLabelStyle` sets `alignSelf: 'flex-start'`, which shrinks the Text box to its
  // longest line — fine for a one-liner, but it left the two-line Hebrew hint in a box
  // narrower than the column and pinned to the left edge, so `textAlign: 'right'` had nothing
  // to align against and the paragraph read as LTR. Stretching the box back to full width
  // (applied after the hook's style, so it wins) is what makes the right alignment visible.
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
});
