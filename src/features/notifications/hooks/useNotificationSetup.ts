import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import i18n from 'i18next';

import {
  DevicePlatform,
  registerDeviceToken,
  unregisterDeviceToken,
} from '@/src/features/notifications/api/notifications';

const ANDROID_CHANNEL_ID = 'default';

// Show notifications while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function devicePlatform(): DevicePlatform {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

/** Follow a `data.route` payload (e.g. "/renters/12") when a notification is tapped. */
function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const route = response.notification.request.content.data?.route;
  if (typeof route === 'string' && route.length > 0) {
    try {
      router.push(route as never);
    } catch {
      // Route may not exist on this build — ignore rather than crash.
    }
  }
}

/**
 * Registers this device for push when signed in and wires up tap-to-navigate.
 * Returns an `unregister` callback to call before sign-out (while still authed).
 */
export function useNotificationSetup(isSignedIn: boolean) {
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;

    async function register() {
      // Remote push requires a physical device; emulators can't receive it.
      if (!Device.isDevice) return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
          name: 'Default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      const { status: existing } = await Notifications.getPermissionsAsync();
      let status = existing;
      if (status !== 'granted') {
        status = (await Notifications.requestPermissionsAsync()).status;
      }
      if (status !== 'granted') return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) return;

      try {
        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        if (cancelled) return;
        registeredTokenRef.current = token;
        await registerDeviceToken(token, devicePlatform(), i18n.language);
      } catch {
        // Token fetch / registration is best-effort; never block app startup.
      }
    }

    register();

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    // Keep the stored locale in sync when the user switches app language, so
    // notifications keep arriving in the right language without re-signing-in.
    async function onLanguageChanged(lng: string) {
      const token = registeredTokenRef.current;
      if (!token) return;
      try {
        await registerDeviceToken(token, devicePlatform(), lng);
      } catch {
        // Best-effort; the locale will be refreshed on the next registration.
      }
    }
    i18n.on('languageChanged', onLanguageChanged);

    return () => {
      cancelled = true;
      responseSub.remove();
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, [isSignedIn]);

  const unregister = useCallback(async () => {
    const token = registeredTokenRef.current;
    if (!token) return;
    try {
      await unregisterDeviceToken(token);
    } catch {
      // Best-effort; the token will be pruned server-side once Expo reports it dead.
    } finally {
      registeredTokenRef.current = null;
    }
  }, []);

  return { unregister };
}
