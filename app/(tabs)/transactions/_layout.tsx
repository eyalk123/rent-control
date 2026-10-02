import { Stack } from 'expo-router';

// A detail opened from another tab (Home's "Needs attention", a notification) would otherwise
// be the only screen in this stack, so back left the tab and tapping the tab did nothing.
// This puts the list underneath it.
export const unstable_settings = { initialRouteName: 'index' };

export default function TransactionsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="suppliers/index" />
      <Stack.Screen name="suppliers/add" />
      <Stack.Screen name="suppliers/[id]" />
    </Stack>
  );
}
