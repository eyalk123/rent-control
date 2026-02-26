import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { PropertyProvider, RenterProvider } from '@/src/context';

export default function RootLayout() {
  return (
    <PaperProvider>
      <PropertyProvider>
        <RenterProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </RenterProvider>
      </PropertyProvider>
    </PaperProvider>
  );
}
