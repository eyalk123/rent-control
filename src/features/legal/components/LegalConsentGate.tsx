/**
 * The blocking consent screen.
 *
 * It exists because the checkbox on the sign-up form cannot be the enforcement point.
 * **Continue with Google** creates the Firebase account the moment the native sheet
 * resolves — there is no point in that flow where a checkbox could be required. A gate
 * that runs *after* authentication is the only thing that covers every way in, and it
 * covers three other cases for free: accounts predating this feature, an acceptance write
 * that was lost, and a future revision of either document.
 *
 * An absolutely-positioned sibling of the navigator, like OfflineGate, not a Modal and not
 * a route — see that file's header for the argument against Modal on Android. It sits
 * *below* OfflineGate, so a device with no connection is told about the connection rather
 * than shown a consent prompt it could not submit anyway.
 *
 * Because it covers the whole navigator, the documents cannot be opened as routes from
 * here — `app/legal/*` would render underneath it. So it shows them itself, in place, and
 * a Back control returns to the prompt.
 *
 * Declining signs out. The account and its data are untouched and they can return and
 * accept whenever they like; no navigation call is needed, since the root redirect sends a
 * signed-out user to the sign-in screen.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Checkbox, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { useLanguageContext } from '@/src/core/context';
import { spacing } from '@/src/core/theme';
import { useLegalConsent } from '../LegalConsentContext';
import { privacyContent, termsContent } from '../legalContent';
import { LegalDocumentView } from './LegalDocumentView';

type Reading = 'terms' | 'privacy' | null;

/** Split a translated sentence on `<name>` slots — see the twin in `app/(auth)/sign-in.tsx`. */
function withLinks(sentence: string, nodes: Record<string, React.ReactNode>) {
  return sentence.split(/(<\w+>)/g).map((part, i) => {
    const key = part.match(/^<(\w+)>$/)?.[1];
    return <React.Fragment key={i}>{key ? nodes[key] : part}</React.Fragment>;
  });
}

export function LegalConsentGate() {
  const { blocked, accept } = useLegalConsent();
  const { signOut } = useAppAuth();
  const { language } = useLanguageContext();
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.colors;

  const [checked, setChecked] = useState(false);
  const [reading, setReading] = useState<Reading>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Swallow the hardware back button while blocked, so the user cannot navigate around
  // behind a screen they cannot see. Same approach as OfflineGate — except while a
  // document is open, where back is the natural way to close it again.
  useEffect(() => {
    if (!blocked) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (reading) {
        setReading(null);
        return true;
      }
      return true;
    });
    return () => sub.remove();
  }, [blocked, reading]);

  const onAccept = useCallback(async () => {
    setSaving(true);
    setError('');
    try {
      await accept();
    } catch {
      setError(t('legal.gateError'));
    } finally {
      setSaving(false);
    }
  }, [accept, t]);

  if (!blocked) return null;

  if (reading) {
    const doc = (reading === 'terms' ? termsContent : privacyContent)[language];
    return (
      <View style={[styles.overlay, { backgroundColor: theme.colors.background }]} accessibilityViewIsModal>
        <LegalDocumentView doc={doc} />
        <View style={styles.docFooter}>
          <Button mode="contained" onPress={() => setReading(null)}>
            {t('common.back')}
          </Button>
        </View>
      </View>
    );
  }

  const documentLink = (target: Exclude<Reading, null>, label: string) => (
    <Text style={{ color: colors.primary }} onPress={() => setReading(target)}>
      {label}
    </Text>
  );

  return (
    <View
      style={[styles.overlay, { backgroundColor: theme.colors.background }]}
      accessibilityViewIsModal
      accessibilityLabel={t('legal.gateTitle')}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
          {t('legal.gateTitle')}
        </Text>
        <Text variant="bodyMedium" style={[styles.body, { color: colors.onSurfaceVariant }]}>
          {t('legal.gateDescription')}
        </Text>

        <View style={styles.acceptRow}>
          <Checkbox
            status={checked ? 'checked' : 'unchecked'}
            onPress={() => { setChecked((v) => !v); setError(''); }}
          />
          <Text variant="bodySmall" style={[styles.acceptText, { color: colors.onSurfaceVariant }]}>
            {withLinks(t('auth.acceptTerms'), {
              terms: documentLink('terms', t('legal.termsOfService')),
              privacy: documentLink('privacy', t('legal.privacyPolicy')),
            })}
          </Text>
        </View>

        {error ? (
          <Text variant="bodySmall" style={[styles.error, { color: theme.colors.error }]}>
            {error}
          </Text>
        ) : null}

        <Button
          mode="contained"
          onPress={onAccept}
          loading={saving}
          disabled={!checked || saving}
          style={styles.button}
        >
          {t('legal.gateAccept')}
        </Button>
        <Button mode="text" onPress={() => void signOut()} style={styles.decline}>
          {t('legal.gateDecline')}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // Above the tour overlay, below OfflineGate (2000) — a device with no connection has a
    // more immediate problem, and accepting would fail anyway.
    zIndex: 1500,
    elevation: 1500,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
  },
  body: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  acceptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  acceptText: {
    flex: 1,
    flexShrink: 1,
  },
  error: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.lg,
  },
  decline: {
    marginTop: spacing.sm,
  },
  docFooter: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
