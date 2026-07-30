import { SettingsScreen } from '@/src/features/settings/screens/SettingsScreen';
import { DevProfiler } from '@/src/shared/components/dev/DevProfiler';

export default function SettingsTab() {
  return <DevProfiler id="SettingsScreen"><SettingsScreen /></DevProfiler>;
}
