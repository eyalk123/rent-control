import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text, useTheme } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAlert } from '@/src/core/context';
import { USE_MOCK_API } from '@/src/core/api/mock';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { Icon } from '@/src/shared/components/ui';
import { useFirebaseUpload } from '@/src/shared/hooks/useFirebaseUpload';
import { useStoredFileUri } from '@/src/shared/hooks/useStoredFile';
import type { PickedFile } from '@/src/features/document-scan/api/extractLease';
import { extractReceipt } from '@/src/features/document-scan/api/extractReceipt';
import type { ReceiptExtraction } from '@/src/features/document-scan/types';
import { useLegalConsent } from '@/src/features/legal/LegalConsentContext';
import { useSubscription } from '@/src/features/subscription/SubscriptionContext';

export interface ScannedReceipt {
  logId: number;
  extraction: ReceiptExtraction;
}

interface Props {
  /** False when the form already has a property — the scan then does not look for one. */
  matchProperty: boolean;
  ownerId: string;
  /** The stored receipt image (the form's `receiptImageUrl`). */
  receiptUrl: string | null;
  onReceiptUrl: (url: string | null) => void;
  onScanned: (result: ScannedReceipt) => void;
}

const isImage = (f: PickedFile) => f.mimeType.startsWith('image/');

/**
 * The one place a new expense takes its receipt: scan it to fill the form, or just attach it.
 * The web form has the same card. Both start by asking where the file comes from — the camera
 * or the phone — because both are how people hold a receipt.
 *
 * Scanning sends the file to the AI and keeps it nowhere; an image is then uploaded as the
 * expense's receipt like any attached photo. A PDF fills the form but is not attached (the
 * receipt field holds images), and the card says so. The remaining monthly allowance is shown
 * before the camera opens, for the reason `ScanQuotaStrip` gives.
 */
export function ReceiptCard({ matchProperty, ownerId, receiptUrl, onReceiptUrl, onScanned }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();
  const { appAlert } = useAlert();
  const { requestAiConsent } = useLegalConsent();
  const { subscription } = useSubscription();
  const { uploadFile } = useFirebaseUpload('transactions', ownerId);
  const thumbUri = useStoredFileUri(receiptUrl);
  const [busy, setBusy] = React.useState<'reading' | 'uploading' | null>(null);
  /** The file the form was filled from, while it is still the one on the card. */
  const [scanned, setScanned] = React.useState<{ name: string; pdf: boolean } | null>(null);

  const allowance = subscription?.enforced ? subscription.monthly_receipt_scans : null;
  const remaining =
    allowance == null ? null : Math.max(0, allowance - (subscription?.receipt_scans_used ?? 0));
  const exhausted = remaining === 0;

  const takePhoto = async (): Promise<PickedFile | null> => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      appAlert(t('error.title'), t('documentScan.cameraPermissionDenied'));
      return null;
    }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    const asset = res.canceled ? null : res.assets?.[0];
    if (!asset) return null;
    return {
      localUri: asset.uri,
      name: asset.fileName ?? `receipt-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
    };
  };

  /** From the phone: images or a PDF when scanning, images only when just attaching. */
  const chooseFile = async (allowPdf: boolean): Promise<PickedFile | null> => {
    const res = await DocumentPicker.getDocumentAsync({
      type: allowPdf ? ['image/*', 'application/pdf'] : ['image/*'],
      copyToCacheDirectory: true,
    });
    const asset = res.canceled ? null : res.assets?.[0];
    if (!asset) return null;
    return {
      localUri: asset.uri,
      name: asset.name ?? 'receipt',
      mimeType: asset.mimeType ?? 'application/octet-stream',
    };
  };

  const askSource = (allowPdf: boolean, then: (file: PickedFile) => void) => {
    const run = (pick: () => Promise<PickedFile | null>) => () => {
      void pick().then((file) => file && then(file));
    };
    appAlert(t('transactions.receiptScan.sourceTitle'), undefined, [
      { text: t('documentScan.takePhoto'), onPress: run(takePhoto) },
      { text: t('documentScan.chooseFile'), onPress: run(() => chooseFile(allowPdf)) },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  /** Keep an image as the expense's receipt. Returns false when the upload failed. */
  const store = async (file: PickedFile): Promise<boolean> => {
    setBusy('uploading');
    try {
      // The dev preview has no Firebase; the local file stands in for the stored one.
      onReceiptUrl(USE_MOCK_API ? file.localUri : await uploadFile(file.localUri, file.name, file.mimeType));
      return true;
    } catch {
      appAlert(t('error.title'), t('documents.uploadFailed'));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const scan = async (file: PickedFile) => {
    // The receipt goes to Anthropic; nothing is uploaded until that is allowed (features/legal/aiConsent.ts).
    if (!(await requestAiConsent())) return;
    setBusy('reading');
    let result: ScannedReceipt;
    try {
      result = await extractReceipt(file, matchProperty);
    } catch (err) {
      setBusy(null);
      const status = isAxiosError(err) ? err.response?.status : undefined;
      appAlert(
        t('error.title'),
        status === 402
          ? t('transactions.receiptScan.limitReached', { limit: allowance ?? 0 })
          : status === 415
            ? t('transactions.receiptScan.unsupported')
            : t('transactions.receiptScan.failed'),
      );
      return;
    }
    setBusy(null);
    onScanned(result);
    setScanned({ name: file.name, pdf: !isImage(file) });
    if (isImage(file)) await store(file);
  };

  const attach = async (file: PickedFile) => {
    if (!isImage(file)) {
      appAlert(t('error.title'), t('transactions.receiptScan.unsupported'));
      return;
    }
    if (await store(file)) setScanned(null);
  };

  const remove = () => {
    setScanned(null);
    onReceiptUrl(null);
  };

  const card = [styles.card, { borderColor: colors.outline, backgroundColor: colors.surface }];

  if (busy) {
    return (
      <View style={[card, styles.busy]} accessibilityLiveRegion="polite">
        <ActivityIndicator size="small" color={colors.primary} />
        <Text variant="bodyMedium" style={{ color: colors.textPrimary }}>
          {busy === 'reading' ? t('transactions.receiptScan.reading') : t('documents.uploading')}
        </Text>
      </View>
    );
  }

  // ── A receipt is on the card ──────────────────────────────────────────────
  if (receiptUrl || scanned) {
    // A photo is named by the camera (a UUID) or by its upload path, neither of which means
    // anything to anyone; only a scanned PDF's own name is worth showing.
    const name = receiptUrl ? t('transactions.receiptScan.photo') : scanned?.name ?? '';
    return (
      <View style={card}>
        <View style={styles.attachedRow}>
          {receiptUrl ? (
            <Image
              source={thumbUri ? { uri: thumbUri } : undefined}
              style={[styles.thumb, { borderColor: colors.outline }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumb, styles.thumbIcon, { backgroundColor: colors.inputFilledBackground }]}>
              <Icon name="file-text" size={22} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.attachedText}>
            <Text variant="bodyMedium" numberOfLines={1} ellipsizeMode="middle" style={{ color: colors.textPrimary }}>
              {name}
            </Text>
            {scanned && (
              <View style={styles.filledRow}>
                <Icon name="check" size={14} color={colors.success} />
                <Text variant="labelMedium" style={{ color: colors.success }}>
                  {t('transactions.receiptScan.filled')}
                </Text>
              </View>
            )}
            {scanned?.pdf && !receiptUrl && (
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                {t('transactions.receiptScan.pdfNotKept')}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.actions}>
          <Button mode="outlined" compact onPress={() => askSource(false, attach)} style={styles.actionButton}>
            {receiptUrl ? t('transactions.receiptScan.replace') : t('transactions.receiptScan.attachPhoto')}
          </Button>
          <Button
            mode="outlined"
            compact
            onPress={remove}
            textColor={colors.error}
            style={styles.actionButton}
            accessibilityLabel={t('transactions.receiptScan.removeReceipt')}
          >
            {t('transactions.receiptScan.remove')}
          </Button>
        </View>
      </View>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  return (
    <View style={card}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primaryBg }]}>
          <Icon name="receipt" size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text variant="titleSmall" style={{ color: colors.textPrimary }}>
            {t('transactions.receiptScan.title')}
          </Text>
          <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
            {t('transactions.receiptScan.subtitle')}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="creation"
          onPress={() => askSource(true, (f) => void scan(f))}
          disabled={exhausted}
          style={[styles.actionButton, styles.grow]}
          contentStyle={styles.buttonContent}
        >
          {t('transactions.receiptScan.scan')}
        </Button>
        <Button
          mode="outlined"
          icon="paperclip"
          onPress={() => askSource(false, (f) => void attach(f))}
          style={[styles.actionButton, styles.grow]}
          contentStyle={styles.buttonContent}
        >
          {t('transactions.receiptScan.attach')}
        </Button>
      </View>
      {remaining != null && (
        <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
          {exhausted
            ? t('transactions.receiptScan.used', { limit: allowance, date: nextMonthLabel(i18n.language) })
            : t('transactions.receiptScan.remaining', { count: remaining })}
          {exhausted && (
            <Text
              variant="bodySmall"
              style={[styles.link, { color: colors.primary }]}
              onPress={() => router.push('/settings/plans' as never)}
            >
              {' '}
              {t('subscription.scanLimit.upgrade')}
            </Text>
          )}
        </Text>
      )}
    </View>
  );
}

/** The first of next month — the server resets the allowance on the same calendar boundary. */
function nextMonthLabel(language: string): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString(language, {
    month: 'long',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  busy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 72,
  },
  header: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionButton: { borderRadius: 10 },
  grow: { flexGrow: 1 },
  buttonContent: { minHeight: 44 },
  attachedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  thumb: { width: 56, height: 56, borderRadius: 8, borderWidth: 1 },
  thumbIcon: { alignItems: 'center', justifyContent: 'center', borderWidth: 0 },
  attachedText: { flex: 1, gap: 2 },
  filledRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  link: { fontWeight: '700' },
});
