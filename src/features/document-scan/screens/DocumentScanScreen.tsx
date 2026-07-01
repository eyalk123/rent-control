import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, IconButton, Text, useTheme } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon, ScreenContainer, StepHeader } from '@/src/shared/components/ui';
import { useAlert } from '@/src/core/context';
import { usePropertyContext } from '@/src/context';
import { spacing } from '@/src/core/theme';
import { getApiErrorMessage } from '@/src/core/api/client';
import { extractLease, type PickedFile } from '@/src/features/document-scan/api/extractLease';
import { mapExtraction } from '@/src/features/document-scan/mapExtraction';
import { matchProperty } from '@/src/features/document-scan/matchProperty';
import { mergeImagesToPdf } from '@/src/features/document-scan/mergeImagesToPdf';
import { setScanHandoff } from '@/src/features/document-scan/handoff';

/** Which "Add" flow this scan feeds. `property` creates a property (chaining to a renter);
 *  `renter` fills a renter for an existing/matched property. */
type ScanTarget = 'property' | 'renter';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const isImage = (f: PickedFile) => f.mimeType.startsWith('image/');

/** Multiple images are allowed (they merge into one PDF); a PDF/DOCX must stand alone. */
function validate(pages: PickedFile[]): string | null {
  if (pages.length <= 1) return null;
  if (pages.some((p) => !isImage(p))) return 'documentScan.mixedFilesError';
  return null;
}

const PROGRESS_STAGES = [
  'documentScan.progress.uploading',
  'documentScan.progress.reading',
  'documentScan.progress.extracting',
];

export function DocumentScanScreen({ target = 'property' }: { target?: ScanTarget } = {}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { appAlert } = useAlert();
  const { properties } = usePropertyContext();
  const { propertyId } = useLocalSearchParams<{ propertyId?: string }>();
  const [pages, setPages] = React.useState<PickedFile[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [merging, setMerging] = React.useState(false);
  const [stageIndex, setStageIndex] = React.useState(0);

  // Cycle the progress message while the (slow) extraction runs.
  React.useEffect(() => {
    if (!busy) {
      setStageIndex(0);
      return;
    }
    const id = setInterval(
      () => setStageIndex((p) => Math.min(p + 1, PROGRESS_STAGES.length - 1)),
      3500,
    );
    return () => clearInterval(id);
  }, [busy]);

  const addPages = (incoming: PickedFile[]) => {
    if (incoming.length === 0) return;
    const next = [...pages, ...incoming];
    const err = validate(next);
    if (err) {
      appAlert(t('error.title'), t(err));
      return;
    }
    setPages(next);
  };

  const removePage = (index: number) => setPages((prev) => prev.filter((_, i) => i !== index));

  const handleCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      appAlert(t('error.title'), t('documentScan.cameraPermissionDenied'));
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    addPages([
      {
        localUri: asset.uri,
        name: asset.fileName ?? `page-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
      },
    ]);
  };

  const handlePickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', DOCX_MIME, 'image/*'],
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (res.canceled || !res.assets?.length) return;
    addPages(
      res.assets.map((asset) => ({
        localUri: asset.uri,
        name: asset.name ?? 'document',
        mimeType: asset.mimeType ?? 'application/octet-stream',
      })),
    );
  };

  const handleExtract = async () => {
    if (pages.length === 0 || validate(pages)) return;
    setBusy(true);
    try {
      let file = pages[0];
      if (pages.length > 1 && pages.every(isImage)) {
        setMerging(true);
        try {
          file = await mergeImagesToPdf(pages);
        } finally {
          setMerging(false);
        }
      }
      const { logId, extraction } = await extractLease(file);
      const mapped = mapExtraction(extraction);
      const base = {
        logId,
        property: mapped.propertyPrefill,
        propertyReview: mapped.propertyReview,
        propertyProvenance: mapped.propertyProvenance,
        renter: mapped.renterPrefill,
        renterReview: mapped.renterReview,
        renterProvenance: mapped.renterProvenance,
        file,
      };
      if (target === 'renter') {
        // Fixed property (scanned from a property) → matched; otherwise auto-match by address.
        const fixedId = propertyId ? Number(propertyId) : null;
        const m =
          fixedId != null
            ? { propertyId: fixedId, status: 'matched' as const }
            : matchProperty(mapped.propertyPrefill, properties);
        setScanHandoff({ ...base, matchedPropertyId: m.propertyId, propertyMatchStatus: m.status });
        router.replace('/renters/add?fromScan=1' as never);
      } else {
        setScanHandoff(base);
        router.replace('/properties/add?fromScan=1' as never);
      }
    } catch (err) {
      appAlert(t('error.title'), getApiErrorMessage(err, t('error.extractionFailed')));
    } finally {
      setBusy(false);
    }
  };

  const stageKey = merging ? 'documentScan.progress.merging' : PROGRESS_STAGES[stageIndex];
  const allImages = pages.length > 0 && pages.every(isImage);

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <StepHeader title={t('documentScan.title')} currentStep={1} totalSteps={1} onBack={() => router.back()} />
        {busy ? (
          <View style={styles.center}>
            <ActivityIndicator animating size="large" color={theme.colors.primary} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t(stageKey)}
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.body}>
            <Text variant="bodyMedium" style={[styles.prompt, { color: theme.colors.onSurfaceVariant }]}>
              {t('documentScan.uploadPrompt')}
            </Text>

            <View style={styles.sourceRow}>
              <Button mode="contained-tonal" icon="camera" onPress={handleCamera} style={styles.sourceButton} contentStyle={styles.sourceButtonContent}>
                {t('documentScan.takePhoto')}
              </Button>
              <Button mode="contained-tonal" icon="file-upload-outline" onPress={handlePickFile} style={styles.sourceButton} contentStyle={styles.sourceButtonContent}>
                {t('documentScan.chooseFile')}
              </Button>
            </View>

            {pages.map((page, i) => (
              <View
                key={`${page.name}-${i}`}
                style={[styles.pageRow, { borderColor: theme.colors.outline }]}
              >
                <Icon name="file-text" size={18} color={theme.colors.primary} />
                <Text variant="bodyMedium" numberOfLines={1} style={[styles.pageName, { color: theme.colors.onSurface }]}>
                  {page.name}
                </Text>
                <Icon name="check" size={16} color={theme.colors.primary} />
                <IconButton
                  icon="close"
                  size={16}
                  onPress={() => removePage(i)}
                  accessibilityLabel={t('documentScan.removePage')}
                />
              </View>
            ))}

            {allImages && pages.length > 1 && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('documentScan.selectedPages', { count: pages.length })}
              </Text>
            )}
          </ScrollView>
        )}
      </View>

      {!busy && (
        <View style={styles.fixedButtonBar}>
          <Button
            mode="contained"
            onPress={handleExtract}
            disabled={pages.length === 0}
            style={styles.extractButton}
            contentStyle={styles.extractButtonContent}
          >
            {t('documentScan.extractAction')}
          </Button>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.formPaddingHorizontal },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  body: { gap: spacing.md, paddingBottom: spacing.md },
  prompt: { textAlign: 'center', paddingHorizontal: spacing.md },
  sourceRow: { flexDirection: 'row', gap: spacing.sm },
  sourceButton: { flex: 1, borderRadius: 12 },
  sourceButtonContent: { minHeight: 48 },
  pageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
  },
  pageName: { flex: 1 },
  fixedButtonBar: {
    paddingHorizontal: spacing.formPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: 24,
  },
  extractButton: { borderRadius: 12 },
  extractButtonContent: { minHeight: 48 },
});
