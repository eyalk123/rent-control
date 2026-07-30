import { View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { ThreadList } from '@/src/features/agent/components/ThreadList';

export default function ChatHistory() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThreadList />
    </View>
  );
}
