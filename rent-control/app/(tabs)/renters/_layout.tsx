import { Stack } from 'expo-router';

export default function RentersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Renters' }} />
      <Stack.Screen name="[id]" options={{ title: 'Renter Details' }} />
      <Stack.Screen name="add" options={{ title: 'Add Renter' }} />
      <Stack.Screen name="edit/[id]" options={{ title: 'Edit Renter' }} />
    </Stack>
  );
}
