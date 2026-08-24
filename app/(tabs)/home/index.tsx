import { HomeScreen } from '@/src/features/home/screens/HomeScreen';
import { DevProfiler } from '@/src/shared/components/dev/DevProfiler';
import { useTour } from '@/src/features/onboarding/TourController';

export default function HomeTab() {
  // The orientation tour. Requesting it here rather than in HomeScreen keeps onboarding
  // out of the screen component; the controller self-suppresses once it has run.
  useTour('first-run');
  return <DevProfiler id="HomeScreen"><HomeScreen /></DevProfiler>;
}
