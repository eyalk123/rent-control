import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/src/shared/components/ui';
import { useShimmer } from '@/src/shared/hooks/useShimmer';
import { darkColors, ICON_XS, lightColors, spacing } from '@/src/core/theme';
import { useAgentChat } from '../context/AgentChatContext';
import { Markdown } from './Markdown';
import { SourceChips } from './SourceChips';
import type { ChatDisplayMessage } from '../types';

/** Three pulsing dots shown inside the assistant bubble before the first token lands. */
function TypingDots({ color }: { color: string }) {
  const shimmer = useShimmer(true);
  return (
    <Animated.View style={[styles.dots, { opacity: shimmer }]}>
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
export function ChatMessage({ message }: { message: ChatDisplayMessage }) {
  const { t } = useTranslation();
  const { retry } = useAgentChat();
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
      {!isUser && !isError ? (
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
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
          { backgroundColor: bg },
          !isUser && !isError
            ? { borderWidth: 1, borderColor: colors.outline, ...styles.cardShadow }
            : null,
        ]}
      >
        {asMarkdown ? (
          <Markdown>{message.text}</Markdown>
        ) : !isUser && !errorOnly && message.streaming && !hasText ? (
          <TypingDots color={colors.textSecondary} />
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
          <Button mode="text" compact onPress={retry} style={styles.retry}>
            {t('common.tryAgain')}
          </Button>
        ) : null}
      </View>
      {!isUser && !errorOnly ? <SourceChips sources={message.sources} /> : null}
    </View>
  );
}

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
