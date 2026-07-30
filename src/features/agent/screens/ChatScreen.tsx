import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { EmptyState, ScreenContainer } from '@/src/shared/components/ui';
import { SettingsGearButton } from '@/src/shared/components/ui/SettingsGearButton';
import { useRtlLabelStyle } from '@/src/context';
import { ICON_MD, spacing } from '@/src/core/theme';
import { useAgentChat } from '../context/AgentChatContext';
import { MessageList } from '../components/MessageList';
import { Composer } from '../components/Composer';

export function ChatScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const rtlLabelStyle = useRtlLabelStyle();
  const { enabled, statusLoading, newChat } = useAgentChat();

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text
            variant="headlineLarge"
            style={[styles.screenTitle, rtlLabelStyle]}
            numberOfLines={1}
          >
            {t('agent.title')}
          </Text>
          <View style={styles.actions}>
            <IconButton
              icon="plus"
              size={ICON_MD}
              style={styles.action}
              accessibilityLabel={t('agent.newChat')}
              onPress={newChat}
            />
            <IconButton
              icon="history"
              size={ICON_MD}
              style={styles.action}
              accessibilityLabel={t('agent.history')}
              onPress={() => router.push('/(tabs)/chat/history' as any)}
            />
            <SettingsGearButton />
          </View>
        </View>
      </View>

      {statusLoading ? (
        <View style={styles.filler} />
      ) : !enabled ? (
        <EmptyState message={t('agent.disabled')} icon="message-square" />
      ) : (
        <KeyboardAvoidingView
          style={styles.filler}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <MessageList />
          <Composer />
        </KeyboardAvoidingView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontWeight: '700',
    fontSize: 28,
    marginBottom: spacing.sm,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  action: {
    margin: 0,
  },
  filler: {
    flex: 1,
  },
});
