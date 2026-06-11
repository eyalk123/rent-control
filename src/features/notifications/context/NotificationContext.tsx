import React, { createContext, useContext } from 'react';

import { useAppAuth } from '@/src/core/auth/AuthContext';
import { useNotificationSetup } from '@/src/features/notifications/hooks/useNotificationSetup';

type NotificationContextValue = {
  /** Unregister this device's push token. Call before sign-out, while still authed. */
  unregisterDevice: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue>({
  unregisterDevice: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAppAuth();
  const { unregister } = useNotificationSetup(isSignedIn);

  return (
    <NotificationContext.Provider value={{ unregisterDevice: unregister }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
