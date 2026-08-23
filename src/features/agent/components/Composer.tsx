import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguageContext, useRtlInputStyle, useRtlPlaceholder } from '@/src/context';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useAgentChat } from '../context/AgentChatContext';

export function Composer() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const rtlInputStyle = useRtlInputStyle();
  const rtlPlaceholder = useRtlPlaceholder();
  const { send, stop, status } = useAgentChat();
  // ChatScreen's ScreenContainer omits the bottom edge (like every other tab screen), so the
  // bar has to add the gesture-bar inset itself or it sits flush against it — but only while
  // the keyboard is down, since the keyboard covers the gesture bar and the inset would
  // otherwise leave a gap between the two. Same listener pattern as FilterBottomSheet.
  const insets = useSafeAreaInsets();
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
        styles.bar,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: colors.outline,
          paddingBottom: spacing.sm + (keyboardUp ? 0 : insets.bottom),
        },
      ]}
    >
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
      />
      {streaming ? (
        <IconButton
          mode="contained"
          icon="stop"
          containerColor={colors.accent}
          iconColor={colors.accentFg}
          accessibilityLabel={t('agent.stop')}
          onPress={stop}
        />
      ) : (
        <IconButton
          mode="contained"
          icon="send"
          containerColor={canSend ? colors.accent : theme.colors.surfaceVariant}
          iconColor={canSend ? colors.accentFg : colors.placeholder}
          accessibilityLabel={t('agent.send')}
          disabled={!canSend}
          onPress={submit}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
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
