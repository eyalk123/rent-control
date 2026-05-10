import { HomeScreen } from '@/src/features/home/screens/HomeScreen';
import { DevProfiler } from '@/src/shared/components/dev/DevProfiler';

export default function HomeTab() {
  return <DevProfiler id="HomeScreen"><HomeScreen /></DevProfiler>;
}
