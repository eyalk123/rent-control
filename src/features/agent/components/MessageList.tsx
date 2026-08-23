import React, { useRef } from 'react';
import { ScrollView } from 'react-native';
import { spacing } from '@/src/core/theme';
import { useAgentChat } from '../context/AgentChatContext';
import { ChatMessage } from './ChatMessage';
import { StarterPrompts } from './StarterPrompts';
import { ToolActivity } from './ToolActivity';

export function MessageList() {
  const { messages, status, activity, retry } = useAgentChat();
  const ref = useRef<ScrollView>(null);

  if (messages.length === 0) return <StarterPrompts />;

  return (
    <ScrollView
      ref={ref}
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.lg,
      }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      onContentSizeChange={() => ref.current?.scrollToEnd({ animated: true })}
    >
      {messages.map((m) => (
        <ChatMessage key={m.id} message={m} onRetry={retry} />
      ))}
      {status === 'streaming' && activity ? <ToolActivity name={activity} /> : null}
    </ScrollView>
  );
}
