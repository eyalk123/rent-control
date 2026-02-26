import { Stack } from 'expo-router';

export default function PropertiesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Properties' }} />
      <Stack.Screen name="[id]" options={{ title: 'Property Details' }} />
      <Stack.Screen name="add" options={{ title: 'Add Property' }} />
      <Stack.Screen name="edit/[id]" options={{ title: 'Edit Property' }} />
    </Stack>
  );
}
