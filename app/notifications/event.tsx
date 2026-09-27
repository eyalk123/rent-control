import { NotificationEventScreen } from '@/src/features/notifications/screens/NotificationEventScreen';
import { DevProfiler } from '@/src/shared/components/dev/DevProfiler';

export default function NotificationEventRoute() {
  return (
    <DevProfiler id="NotificationEventScreen">
      <NotificationEventScreen />
    </DevProfiler>
  );
}
