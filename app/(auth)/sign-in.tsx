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
import auth from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type Step = 'login' | 'register';

export default function SignInScreen() {
  const router = useRouter();
  const theme = useTheme();
  const colors = theme.colors;

  const [step, setStep] = useState<Step>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  function firebaseErrorMessage(err: any): string {
    const code: string = err?.code ?? '';
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') return 'No account found with this email.';
    if (code === 'auth/wrong-password') return 'Incorrect password.';
    if (code === 'auth/email-already-in-use') return 'An account with this email already exists.';
    if (code === 'auth/weak-password') return 'Password must be at least 6 characters.';
    if (code === 'auth/invalid-email') return 'Invalid email address.';
    if (code === 'auth/too-many-requests') return 'Too many attempts. Please try again later.';
    return err?.message ?? 'Something went wrong.';
  }

  async function signIn() {
    if (!email.trim() || !password.trim()) return;
    setError('');
    setLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email.trim(), password);
      router.replace('/(tabs)/properties' as any);
    } catch (err: any) {
      setError(firebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function register() {
    if (!email.trim() || !password.trim()) return;
    setError('');
    setLoading(true);
    try {
      await auth().createUserWithEmailAndPassword(email.trim(), password);
      router.replace('/(tabs)/properties' as any);
    } catch (err: any) {
      setError(firebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setError('');
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const { data } = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(data!.idToken);
      await auth().signInWithCredential(googleCredential);
      router.replace('/(tabs)/properties' as any);
    } catch (err: any) {
      if (err?.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled — no error shown
      } else {
        setError(firebaseErrorMessage(err));
      }
    } finally {
      setGoogleLoading(false);
    }
  }

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
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text variant="headlineMedium" style={[styles.appName, { color: colors.onBackground }]}>
            Rent Control
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
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
            returnKeyType="next"
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            returnKeyType="done"
            onSubmitEditing={isLogin ? signIn : register}
            style={styles.input}
          />

          {error ? (
            <Text variant="bodySmall" style={[styles.error, { color: colors.error }]}>
              {error}
            </Text>
          ) : null}

          <Button
            mode="contained"
            onPress={isLogin ? signIn : register}
            loading={loading}
            disabled={loading || !email.trim() || !password.trim()}
            style={styles.submitBtn}
            contentStyle={styles.submitBtnContent}
          >
            {isLogin ? 'Sign in' : 'Create account'}
          </Button>

          <Button
            mode="text"
            onPress={() => { setStep(isLogin ? 'register' : 'login'); setError(''); }}
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {isLogin ? 'New here? Create an account' : 'Already have an account? Sign in'}
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
