import { HomeScreen } from '@/src/features/home/screens/HomeScreen';
import { DevProfiler } from '@/src/shared/components/dev/DevProfiler';
import { useTour } from '@/src/features/onboarding/TourController';

export default function HomeTab() {
  // Both halves of the first-login sweep, asked for here rather than in HomeScreen, and in
  // this order — which is the whole point of them being in one component.
  //
  // The controller opens one tour at a time and refuses whatever asks second, and React runs
  // a child's effects before its parent's. With `home` requested from HomeScreen it therefore
  // won every time: the screen sweep ran first and the welcome card and tab-bar steps came
  // afterwards, if the user was still there for them. Two calls in one component fire in
  // declaration order, so first-run leads. Web has always done it this way.
  useTour('first-run');
  // Gated on hasRenters, so it waits until the dashboard has something on it; it opens as
  // soon as first-run closes.
  useTour('home');
  return <DevProfiler id="HomeScreen"><HomeScreen /></DevProfiler>;
}
