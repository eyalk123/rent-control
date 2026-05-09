import { Stack } from 'expo-router';

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
