import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { ActivityIndicator, IconButton, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
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
  const { enabled, statusLoading, statusFailed, refreshStatus, newChat } = useAgentChat();
  // Android needs a KeyboardAvoidingView behavior too, not just iOS: `edgeToEdgeEnabled`
  // (app.json) stops the window resizing for the keyboard, so the manifest's `adjustResize`
  // no longer moves anything and the composer ends up hidden behind the keyboard. `padding`
  // on both platforms, not `height` on Android: `height` pins an explicit height captured at
  // the first layout and drops `flex`, so once the keyboard had been opened and closed the
  // view kept that stale height and hung below the tab bar, clipping the composer row. With
  // the window not resizing, the situation is the same on both platforms anyway. The iOS
  // offset is the tab bar, which sits below this screen and would otherwise be double-counted;
  // on Android the keyboard's screen coordinates already account for it.
  const tabBarHeight = useBottomTabBarHeight();

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
              hitSlop={8}
              accessibilityLabel={t('agent.newChat')}
              onPress={newChat}
            />
            <IconButton
              icon="history"
              size={ICON_MD}
              style={styles.action}
              hitSlop={8}
              accessibilityLabel={t('agent.history')}
              onPress={() => router.push('/(tabs)/chat/history' as any)}
            />
            <SettingsGearButton style={styles.action} />
          </View>
        </View>
      </View>

      {statusLoading ? (
        <View style={styles.filler}>
          <ActivityIndicator style={styles.spinner} />
        </View>
      ) : statusFailed ? (
        <EmptyState
          message={t('agent.statusFailed')}
          icon="alert-circle"
          actionLabel={t('common.tryAgain')}
          onAction={refreshStatus}
        />
      ) : !enabled ? (
        <EmptyState message={t('agent.disabled')} icon="message-square" />
      ) : (
        <KeyboardAvoidingView
          style={styles.filler}
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === 'ios' ? tabBarHeight : 0}
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
    // Sized explicitly rather than left at Paper's `size + 16` (36dp at ICON_MD). hitSlop
    // widens where a finger lands but not the view's bounds, which is what accessibility
    // services read — so the target has to actually be 48dp. `margin: 0` also butted the
    // three of them together with no gap.
    width: 48,
    height: 48,
    marginHorizontal: 0,
    marginVertical: 0,
  },
  filler: {
    flex: 1,
  },
  spinner: {
    marginTop: spacing.xl,
  },
});
