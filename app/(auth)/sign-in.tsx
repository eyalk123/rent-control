import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput, Button, useTheme, Divider } from 'react-native-paper';
import { useSignIn, useSSO } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type Step = 'email' | 'code';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const theme = useTheme();
  const colors = theme.colors;

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendCode() {
    if (!isLoaded) return;
    setError('');
    setLoading(true);
    try {
      await signIn.create({ identifier: email });
      const factor = signIn.supportedFirstFactors?.find(
        (f) => f.strategy === 'email_code'
      );
      if (!factor || factor.strategy !== 'email_code') throw new Error('Email code not supported');
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: factor.emailAddressId,
      });
      setStep('code');
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage ?? err?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    if (!isLoaded) return;
    setError('');
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({ strategy: 'email_code', code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)/properties' as any);
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage ?? err?.message ?? 'Invalid code.');
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setError('');
    setGoogleLoading(true);
    try {
      const redirectUrl = Linking.createURL('/');
      console.log('[Clerk] OAuth redirect URL:', redirectUrl);
      const { createdSessionId, setActive: ssoSetActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });
      if (createdSessionId) {
        await ssoSetActive!({ session: createdSessionId });
        router.replace('/(tabs)/properties' as any);
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage ?? err?.message ?? 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  }

  const isDark = theme.dark;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        {/* Logo + title */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text variant="headlineMedium" style={[styles.appName, { color: colors.onBackground }]}>
            Rent Control
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
            {step === 'email' ? 'Sign in to your account' : `Enter the code sent to\n${email}`}
          </Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
          {step === 'email' ? (
            <>
              {/* Google button */}
              <TouchableOpacity
                style={[styles.googleBtn, { borderColor: colors.outline, backgroundColor: isDark ? colors.surfaceVariant : '#fff' }]}
                onPress={signInWithGoogle}
                disabled={googleLoading}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
                <Text variant="labelLarge" style={[styles.googleBtnText, { color: colors.onSurface }]}>
                  {googleLoading ? 'Connecting…' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <Divider style={styles.dividerLine} />
                <Text variant="bodySmall" style={[styles.dividerText, { color: colors.onSurfaceVariant }]}>
                  or
                </Text>
                <Divider style={styles.dividerLine} />
              </View>

              <TextInput
                mode="outlined"
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="done"
                onSubmitEditing={sendCode}
                style={styles.input}
              />

              {error ? (
                <Text variant="bodySmall" style={[styles.error, { color: colors.error }]}>
                  {error}
                </Text>
              ) : null}

              <Button
                mode="contained"
                onPress={sendCode}
                loading={loading}
                disabled={loading || !email.trim()}
                style={styles.submitBtn}
                contentStyle={styles.submitBtnContent}
              >
                Send code
              </Button>
            </>
          ) : (
            <>
              <TextInput
                mode="outlined"
                label="One-time code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                returnKeyType="done"
                onSubmitEditing={verifyCode}
                style={styles.input}
                autoFocus
              />

              {error ? (
                <Text variant="bodySmall" style={[styles.error, { color: colors.error }]}>
                  {error}
                </Text>
              ) : null}

              <Button
                mode="contained"
                onPress={verifyCode}
                loading={loading}
                disabled={loading || !code.trim()}
                style={styles.submitBtn}
                contentStyle={styles.submitBtnContent}
              >
                Verify
              </Button>

              <Button
                mode="text"
                onPress={() => { setStep('email'); setCode(''); setError(''); }}
                disabled={loading}
                style={{ marginTop: 4 }}
              >
                Use a different email
              </Button>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 28,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginBottom: 4,
  },
  appName: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  googleBtnText: {
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
  },
  dividerText: {
    opacity: 0.6,
  },
  input: {
    marginBottom: 2,
  },
  error: {
    marginTop: -4,
  },
  submitBtn: {
    marginTop: 4,
    borderRadius: 10,
  },
  submitBtnContent: {
    paddingVertical: 4,
  },
});
