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
import { useRouter } from 'expo-router';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  sendPasswordResetEmail,
  GoogleAuthProvider,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRtlInputStyle, useRtlPlaceholder } from '@/src/core/context';
import { loginSchema, type LoginFormValues } from '@/src/core/auth/authFormSchema';

type Step = 'login' | 'register';

export default function SignInScreen() {
  const router = useRouter();
  const theme = useTheme();
  const colors = theme.colors;
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>('login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const { control, handleSubmit, getValues, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  function firebaseErrorMessage(err: any): string {
    const code: string = err?.code ?? '';
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') return t('auth.errorUserNotFound');
    if (code === 'auth/wrong-password') return t('auth.errorWrongPassword');
    if (code === 'auth/email-already-in-use') return t('auth.errorEmailInUse');
    if (code === 'auth/weak-password') return t('auth.errorWeakPassword');
    if (code === 'auth/invalid-email') return t('auth.errorInvalidEmail');
    if (code === 'auth/too-many-requests') return t('auth.errorTooManyRequests');
    return err?.message ?? t('auth.errorGeneric');
  }

  async function forgotPassword() {
    const email = getValues('email');
    if (!email.trim()) {
      setError(t('auth.enterEmailFirst'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(getAuth(), email.trim());
      setResetSent(true);
    } catch (err: any) {
      setError(firebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const signIn = handleSubmit(async ({ email, password }) => {
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(getAuth(), email.trim(), password);
      router.replace('/(tabs)/properties');
    } catch (err: any) {
      setError(firebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  });

  const register = handleSubmit(async ({ email, password }) => {
    setError('');
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(getAuth(), email.trim(), password);
      router.replace('/(tabs)/properties');
    } catch (err: any) {
      setError(firebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  });

  async function signInWithGoogle() {
    setError('');
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();
      if (signInResult.type === 'cancelled') return;
      const { idToken } = await GoogleSignin.getTokens();
      const googleCredential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(getAuth(), googleCredential);
      router.replace('/(tabs)/properties');
    } catch (err: any) {
      setError(firebaseErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  }

  const rtlInputStyle = useRtlInputStyle();
  const rtlPlaceholder = useRtlPlaceholder();

  const isDark = theme.dark;
  const isLogin = step === 'login';

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        {/* Logo + title */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/rent-control-icon-no-text.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text variant="headlineMedium" style={[styles.appName, { color: colors.onBackground }]}>
            Rent Control
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
            {isLogin ? t('auth.signInSubtitle') : t('auth.createAccountSubtitle')}
          </Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
          {/* Google button */}
          <TouchableOpacity
            style={[styles.googleBtn, { borderColor: colors.outline, backgroundColor: isDark ? colors.surfaceVariant : '#fff' }]}
            onPress={signInWithGoogle}
            disabled={googleLoading}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
            <Text variant="labelLarge" style={[styles.googleBtnText, { color: colors.onSurface }]}>
              {googleLoading ? t('auth.connecting') : t('auth.continueWithGoogle')}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <Divider style={styles.dividerLine} />
            <Text variant="bodySmall" style={[styles.dividerText, { color: colors.onSurfaceVariant }]}>
              {t('auth.or')}
            </Text>
            <Divider style={styles.dividerLine} />
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <>
                <TextInput
                  mode="outlined"
                  label={rtlPlaceholder(t('auth.email'))}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  style={styles.input}
                  contentStyle={rtlInputStyle}
                  error={!!errors.email}
                />
                {errors.email ? (
                  <Text variant="bodySmall" style={[styles.fieldError, { color: colors.error }]}>
                    {errors.email.message}
                  </Text>
                ) : null}
              </>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <>
                <TextInput
                  mode="outlined"
                  label={rtlPlaceholder(t('auth.password'))}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  returnKeyType="done"
                  onSubmitEditing={isLogin ? signIn : register}
                  style={styles.input}
                  contentStyle={rtlInputStyle}
                  error={!!errors.password}
                />
                {errors.password ? (
                  <Text variant="bodySmall" style={[styles.fieldError, { color: colors.error }]}>
                    {errors.password.message}
                  </Text>
                ) : null}
              </>
            )}
          />

          {error ? (
            <Text variant="bodySmall" style={[styles.error, { color: colors.error }]}>
              {error}
            </Text>
          ) : null}

          {resetSent ? (
            <Text variant="bodySmall" style={[styles.error, { color: colors.primary }]}>
              {t('auth.resetEmailSent')}
            </Text>
          ) : null}

          <Button
            mode="contained"
            onPress={isLogin ? signIn : register}
            loading={loading}
            disabled={loading}
            style={styles.submitBtn}
            contentStyle={styles.submitBtnContent}
          >
            {isLogin ? t('auth.signIn') : t('auth.createAccount')}
          </Button>

          {isLogin ? (
            <Button
              mode="text"
              onPress={forgotPassword}
              disabled={loading}
              style={{ marginTop: 0 }}
            >
              {t('auth.forgotPassword')}
            </Button>
          ) : null}

          <Button
            mode="text"
            onPress={() => { setStep(isLogin ? 'register' : 'login'); setError(''); setResetSent(false); }}
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {isLogin ? t('auth.newHere') : t('auth.alreadyHaveAccount')}
          </Button>
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
  fieldError: {
    marginTop: -8,
    marginBottom: 4,
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
