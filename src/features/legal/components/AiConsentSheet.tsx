/**
 * The AI consent prompt — see `aiConsent.ts` for why it exists and when it is asked.
 *
 * An absolutely-positioned sibling of the navigator, like LegalConsentGate and for the same
 * reason (Modal misbehaves on Android). It sits below the gate: a user who has not accepted
 * the Terms cannot reach a scan or the assistant anyway.
 *
 * "Not now" is a real answer, not a dismissal to nag about: nothing is sent, the scan or
 * message simply doesn't happen, and the question comes back the next time they try.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/src/core/theme';
import { useLegalConsent } from '../LegalConsentContext';

export function AiConsentSheet() {
  const { aiPromptOpen, answerAiPrompt } = useLegalConsent();
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.colors;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const decline = useCallback(() => {
    setError('');
    void answerAiPrompt(false);
  }, [answerAiPrompt]);

  // Hardware back means "not now", never "navigate underneath the prompt".
  useEffect(() => {
    if (!aiPromptOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      decline();
      return true;
    });
    return () => sub.remove();
  }, [aiPromptOpen, decline]);

  const allow = useCallback(async () => {
    setSaving(true);
    setError('');
    try {
      await answerAiPrompt(true);
    } catch {
      setError(t('aiConsent.error'));
    } finally {
      setSaving(false);
    }
  }, [answerAiPrompt, t]);

  const openPrivacy = useCallback(() => {
    // The policy is a route, and this prompt covers the navigator — so reading it is a "not
    // now" for this attempt. The question is asked again on the next scan or message.
    decline();
    router.push('/legal/privacy' as any);
  }, [decline, router]);

  if (!aiPromptOpen) return null;

  const bullet = (text: string) => (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletDot, { color: colors.onSurfaceVariant }]}>•</Text>
      <Text variant="bodyMedium" style={[styles.bulletText, { color: colors.onSurfaceVariant }]}>
        {text}
      </Text>
    </View>
  );

  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <Pressable style={styles.backdrop} onPress={decline} accessibilityLabel={t('aiConsent.notNow')} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <ScrollView contentContainerStyle={styles.content} bounces={false}>
          <Text variant="titleLarge" style={[styles.title, { color: colors.onSurface }]}>
            {t('aiConsent.title')}
          </Text>
          <Text variant="bodyMedium" style={[styles.body, { color: colors.onSurfaceVariant }]}>
            {t('aiConsent.intro')}
          </Text>
          {bullet(t('aiConsent.sendsLease'))}
          {bullet(t('aiConsent.sendsQuestions'))}
          <Text variant="bodyMedium" style={[styles.body, { color: colors.onSurfaceVariant }]}>
            {t('aiConsent.handling')}
          </Text>
          <Text variant="bodyMedium" style={[styles.body, { color: colors.onSurfaceVariant }]}>
            {t('aiConsent.optional')}
          </Text>
          <Text variant="bodyMedium" style={[styles.link, { color: colors.primary }]} onPress={openPrivacy}>
            {t('legal.privacyPolicy')}
          </Text>

          {error ? (
            <Text variant="bodySmall" style={[styles.error, { color: colors.error }]}>
              {error}
            </Text>
          ) : null}

          <Button mode="contained" onPress={allow} loading={saving} disabled={saving} style={styles.allow}>
            {t('aiConsent.allow')}
          </Button>
          <Button mode="text" onPress={decline} disabled={saving}>
            {t('aiConsent.notNow')}
          </Button>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // Below LegalConsentGate (1500), above the tour overlay.
    zIndex: 1400,
    elevation: 1400,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  title: {
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  body: {
    marginTop: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    paddingStart: spacing.sm,
  },
  bulletDot: {
    marginEnd: spacing.sm,
  },
  bulletText: {
    flex: 1,
  },
  link: {
    marginTop: spacing.md,
    fontWeight: '600',
  },
  error: {
    marginTop: spacing.md,
  },
  allow: {
    marginTop: spacing.lg,
  },
});
