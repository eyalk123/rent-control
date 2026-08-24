import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { spacing } from '@/src/core/theme';
import { useAgentChat } from '../context/AgentChatContext';
import { ChatMessage } from './ChatMessage';
import { StarterPrompts } from './StarterPrompts';
import { ToolActivity } from './ToolActivity';

/** How close to the bottom still counts as "following along", in px. */
const AT_BOTTOM_SLOP = 80;
/**
 * How far up you have to be before the jump button appears, as a fraction of the visible
 * height. Deliberately much larger than AT_BOTTOM_SLOP: auto-follow has to stop the moment
 * you scroll at all, but the button showing up after a flick of the thumb is just noise —
 * it only earns its place once the latest message is properly off screen.
 */
const JUMP_VISIBLE_FRACTION = 1.25;

export function MessageList() {
  const { t } = useTranslation();
  const { messages, status, activity, retry } = useAgentChat();
  const ref = useRef<ScrollView>(null);
  // A ref, not state: onContentSizeChange reads it on every token and must not depend on a
  // re-render having happened first.
  const atBottom = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const distance = contentSize.height - layoutMeasurement.height - contentOffset.y;
    atBottom.current = distance <= AT_BOTTOM_SLOP;
    const far = distance > layoutMeasurement.height * JUMP_VISIBLE_FRACTION;
    setShowJump((prev) => (prev === far ? prev : far));
  }, []);

  const jump = useCallback(() => {
    atBottom.current = true;
    setShowJump(false);
    ref.current?.scrollToEnd({ animated: true });
  }, []);

  if (messages.length === 0) return <StarterPrompts />;

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={ref}
        style={styles.wrap}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScroll={onScroll}
        scrollEventThrottle={64}
        // Only follow the stream while the user is actually at the bottom. This used to fire
        // on every token regardless, so scrolling up to re-read an earlier answer while a new
        // one streamed yanked you back down, once per delta.
        onContentSizeChange={() => {
          if (atBottom.current) ref.current?.scrollToEnd({ animated: true });
        }}
      >
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} onRetry={retry} />
        ))}
        {status === 'streaming' && activity ? <ToolActivity name={activity} /> : null}
      </ScrollView>
      {showJump ? (
        <Button
          mode="contained"
          compact
          icon="chevron-down"
          onPress={jump}
          style={styles.jump}
          accessibilityLabel={t('agent.jumpToLatest')}
        >
          {t('agent.jumpToLatest')}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  jump: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: spacing.md,
  },
});
