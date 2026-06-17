import { RuleEditorScreen } from '@/src/features/notifications/screens/RuleEditorScreen';
import { DevProfiler } from '@/src/shared/components/dev/DevProfiler';

export default function NotificationRuleRoute() {
  return (
    <DevProfiler id="RuleEditorScreen">
      <RuleEditorScreen />
    </DevProfiler>
  );
}
