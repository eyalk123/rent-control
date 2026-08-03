import { WhatsAppTemplatesScreen } from '@/src/features/notifications/screens/WhatsAppTemplatesScreen';
import { DevProfiler } from '@/src/shared/components/dev/DevProfiler';

export default function WhatsAppTemplatesRoute() {
  return (
    <DevProfiler id="WhatsAppTemplatesScreen">
      <WhatsAppTemplatesScreen />
    </DevProfiler>
  );
}
