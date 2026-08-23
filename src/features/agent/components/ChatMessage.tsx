import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/src/shared/components/ui';
import { useShimmer } from '@/src/shared/hooks/useShimmer';
import { darkColors, ICON_XS, lightColors, spacing } from '@/src/core/theme';
import { Markdown } from './Markdown';
import { SourceChips } from './SourceChips';
import type { ChatDisplayMessage } from '../types';

/**
 * Strip the Markdown syntax out of an answer before handing it to a screen reader — otherwise
 * `**Sarah Johnson**` is read out with its asterisks, and every list item starts with "dash".
 * Only the emphasis, heading, code and bullet markers the assistant actually emits.
 */
function speakable(text: string): string {
  return text
    .replace(/^[ \t]*[-*+][ \t]+/gm, '')
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Three pulsing dots shown inside the assistant bubble before the first token lands. */
function TypingDots({ color, label }: { color: string; label: string }) {
  const shimmer = useShimmer(true);
  return (
    <Animated.View
      style={[styles.dots, { opacity: shimmer }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.dot, { backgroundColor: color }]} />
      ))}
    </Animated.View>
  );
}

/**
 * A chat bubble. Assistant answers render as Markdown (tables, bold, lists); user input and
 * errors stay plain text — we never Markdown-render what the user typed. `writingDirection:
 * 'auto'` lets each message pick its own script direction (Hebrew RTL, English LTR).
 */
export const ChatMessage = React.memo(function ChatMessage({
  message,
  onRetry,
}: {
  message: ChatDisplayMessage;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.colors;
  const colors = theme.dark ? darkColors : lightColors;
  const isUser = message.role === 'user';
  const isError = !!message.error;
  const hasText = !!message.text;
  const asMarkdown = !isUser && hasText;
  // Error styling only when there is nothing but the error to show.
  const errorOnly = isError && !hasText;

  // Assistant answers read as cards — surface + hairline outline, like every other card in
  // the app. Dark mode needs the elevated surface to separate from the near-black background.
  const assistantBg = theme.dark ? darkColors.surfaceElevated : lightColors.surface;
  const bg = isUser ? c.primary : errorOnly ? c.errorContainer : assistantBg;
  const fg = isUser ? c.onPrimary : errorOnly ? c.onErrorContainer : c.onSurface;
  const accentBg = theme.dark ? 'rgba(194,149,67,0.15)' : 'rgba(212,162,76,0.12)';

  return (
    // Assistant/error bubbles stretch so wide Markdown tables keep their scroll width.
    <View style={[styles.row, { alignItems: isUser ? 'flex-end' : 'stretch' }]}>
      {!isUser && !errorOnly ? (
        <View style={styles.identity}>
          <View style={[styles.mark, { backgroundColor: accentBg }]}>
            <Icon name="sparkles" size={ICON_XS} color={colors.accent} />
          </View>
          <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
            {t('agent.assistantName')}
          </Text>
        </View>
      ) : null}
      <View
        // The identity row is a separate node, so without this the bubble never said who was
        // speaking. `polite` announces the answer as it lands instead of leaving it silent.
        accessible
        accessibilityLabel={`${isUser ? t('agent.you') : t('agent.assistantName')}: ${speakable(
          message.text || message.errorText || '',
        )}`}
        accessibilityLiveRegion={message.streaming ? 'polite' : 'none'}
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
          { backgroundColor: bg },
          !isUser && !errorOnly
            ? { borderWidth: 1, borderColor: colors.outline, ...styles.cardShadow }
            : null,
        ]}
      >
        {asMarkdown ? (
          <Markdown>{message.text}</Markdown>
        ) : !isUser && !errorOnly && message.streaming && !hasText ? (
          <TypingDots color={colors.textSecondary} label={t('agent.typing')} />
        ) : message.text ? (
          <Text style={{ color: fg, writingDirection: 'auto' }}>{message.text}</Text>
        ) : null}
        {/* The reason sits below whatever streamed, instead of replacing it. */}
        {message.errorText ? (
          <Text
            style={[
              { color: c.error, writingDirection: 'auto' },
              message.text ? styles.errorBelow : null,
            ]}
          >
            {message.errorText}
          </Text>
        ) : null}
        {message.retryable ? (
          <Button mode="text" compact onPress={onRetry} style={styles.retry}>
            {t('common.tryAgain')}
          </Button>
        ) : null}
      </View>
      {!isUser && !errorOnly ? <SourceChips sources={message.sources} /> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.md,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  mark: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    maxWidth: '85%',
    borderBottomEndRadius: 6,
  },
  bubbleAssistant: {
    maxWidth: '100%',
    borderBottomStartRadius: 6,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  errorBelow: {
    marginTop: spacing.sm,
  },
  retry: {
    alignSelf: 'flex-start',
    marginTop: 2,
    marginLeft: -8,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
