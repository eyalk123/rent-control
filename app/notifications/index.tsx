import { NotificationsSettingsScreen } from '@/src/features/notifications/screens/NotificationsSettingsScreen';
import { DevProfiler } from '@/src/shared/components/dev/DevProfiler';

export default function NotificationsRoute() {
  return (
    <DevProfiler id="NotificationsSettingsScreen">
      <NotificationsSettingsScreen />
    </DevProfiler>
  );
}
