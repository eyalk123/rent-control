import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguageContext, useRtlInputStyle, useRtlPlaceholder } from '@/src/context';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useAgentChat } from '../context/AgentChatContext';
import { ANCHORS } from '@/src/features/onboarding/anchors';
import { TourAnchor } from '@/src/features/onboarding/AnchorRegistry';
import { useTour } from '@/src/features/onboarding/TourController';

/** Matches `message` max_length in the backend's AgentChatRequest schema. */
const MAX_MESSAGE_CHARS = 4000;
/** Only start counting once it's close enough to matter. */
const COUNTER_VISIBLE_FROM = 200;

export function Composer() {
  // Asked from here rather than from ChatScreen: the composer is the tour's only anchor and
  // the screen renders it only once the agent's status has come back enabled.
  useTour('chat');
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const rtlInputStyle = useRtlInputStyle();
  const rtlPlaceholder = useRtlPlaceholder();
  const { send, stop, status } = useAgentChat();
  // The bar adds the gesture-bar inset itself only when nothing else already covers it. On the
  // chat tab the tab bar sits below and applies that inset already, so adding it here just left
  // a band of empty background between the bar and the tabs — hence `tabBarHeight` in the sum
  // below. With the keyboard up the keyboard covers the gesture bar, so the inset is dropped
  // then too. Same listener pattern as FilterBottomSheet.
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [keyboardUp, setKeyboardUp] = useState(false);
  useEffect(() => {
    const shown = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardUp(true),
    );
    const hidden = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardUp(false),
    );
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);
  const [text, setText] = useState('');
  const streaming = status === 'streaming';
  // The backend rejects anything longer (schemas/agent.py), and PLATFORM.md §9 treats the cap
  // as user-facing. Without this the turn failed as a 422 after the message was already sent.
  const remaining = MAX_MESSAGE_CHARS - text.length;
  const canSend = !!text.trim();

  const submit = () => {
    const value = text.trim();
    if (!value || streaming) return;
    send(value);
    setText('');
  };

  return (
    <View
      style={[
        styles.barWrap,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: colors.outline,
          paddingBottom: spacing.sm + (keyboardUp || tabBarHeight > 0 ? 0 : insets.bottom),
        },
      ]}
    >
      {remaining <= COUNTER_VISIBLE_FROM ? (
        <Text
          variant="labelSmall"
          style={[styles.counter, { color: remaining <= 0 ? theme.colors.error : colors.textSecondary }]}
        >
          {`‎${text.length} / ${MAX_MESSAGE_CHARS}`}
        </Text>
      ) : null}
      <TourAnchor id={ANCHORS.chatInput} style={styles.bar}>
      {/* Plain RN TextInput, like every other input in the app (src/shared/components/form) —
          Paper's TextInput brings its own MD3 typography, which reads foreign here. */}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputFilledBackground,
            borderColor: colors.inputBorder,
            color: colors.textPrimary,
          },
          rtlInputStyle,
        ]}
        placeholderTextColor={colors.textSecondary}
        textAlign={isRtl ? 'right' : 'left'}
        value={text}
        onChangeText={setText}
        placeholder={rtlPlaceholder(t('agent.placeholder'))}
        multiline
        maxLength={MAX_MESSAGE_CHARS}
        accessibilityLabel={t('agent.placeholder')}
      />
      {streaming ? (
        <IconButton
          mode="contained"
          icon="stop"
          hitSlop={8}
          style={styles.action}
          containerColor={colors.accent}
          iconColor={colors.accentFg}
          accessibilityLabel={t('agent.stop')}
          onPress={stop}
        />
      ) : (
        <IconButton
          mode="contained"
          icon="send"
          hitSlop={8}
          style={styles.action}
          containerColor={canSend ? colors.accent : theme.colors.surfaceVariant}
          iconColor={canSend ? colors.accentFg : colors.placeholder}
          accessibilityLabel={t('agent.send')}
          disabled={!canSend}
          onPress={submit}
        />
      )}
      </TourAnchor>
    </View>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  counter: {
    alignSelf: 'flex-end',
    marginBottom: 2,
    // "3853 / 4000" is entirely bidi-neutral — digits, a slash, spaces — so in Hebrew it
    // inherits the RTL paragraph direction and renders as "4000 / 3853", reading as though
    // the count and the limit had swapped places. Pin it LTR.
    writingDirection: 'ltr',
  },
  action: {
    // 48dp for real: hitSlop alone leaves the view's bounds — what accessibility services
    // report — at Paper's default 40dp.
    width: 48,
    height: 48,
    margin: 0,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    fontSize: 16,
  },
});
