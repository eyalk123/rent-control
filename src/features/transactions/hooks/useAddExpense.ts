import React from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Opens the add-expense form from a detail screen's Expenses tab, and re-fetches that tab's
 * list when the user comes back. The detail lists hold their own state, so the form's save
 * cannot reach them; refreshing only after this button was used keeps every other return
 * (e.g. from a transaction's detail) from costing a fetch.
 */
export function useAddExpense(href: string, refresh: () => void) {
  const router = useRouter();
  const pending = React.useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      if (!pending.current) return;
      pending.current = false;
      refresh();
    }, [refresh]),
  );

  return React.useCallback(() => {
    pending.current = true;
    router.push(href as never);
  }, [router, href]);
}
