import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getPropertyById, sharePropertySheet } from '@/src/features/properties/api/properties';
import { getApiErrorMessage } from '@/src/core/api/client';
import type { Property } from '@/src/shared/types';
import { formatFloorApartment } from '@/src/shared/utils/propertyAddress';
import {
  LockedPropertyState,
  isPropertyLockedError,
} from '@/src/features/subscription/components/LockedPropertyState';
import {
  BandButton,
  ColorBand,
  ColorDot,
  Icon,
  LoadingOverlay,
  EmptyState,
  ScreenContainer,
  DetailTabBar,
} from '@/src/shared/components/ui';
import { lightColors, darkColors, spacing, useEntityColor } from '@/src/core/theme';
import { PropertyInfoTab } from '@/src/features/properties/components/PropertyInfoTab';
import { PropertyRentersTab } from '@/src/features/properties/components/PropertyRentersTab';
import { PropertyTransactionsTab } from '@/src/features/properties/components/PropertyTransactionsTab';
import {
  initialTransactionsTabState,
  type TransactionsTabState,
} from '@/src/features/transactions/components/detail/tabState';
import { PropertyDocumentsTab } from '@/src/features/properties/components/PropertyDocumentsTab';
import { useTransactionsList } from '@/src/features/transactions/hooks/useTransactions';
import { usePropertyImageSource } from '@/src/features/properties/hooks/usePropertyImageSource';
import { getPropertyTypeIcon } from '@/src/features/properties/constants/propertyTypeIcons';
import { propertyTypeLabelKey } from '@/src/features/properties/constants/propertyTypeLabel';
import { parseImageUrlKey } from '@/src/features/properties/constants/houseImagePresets';
import { ANCHORS } from '@/src/features/onboarding/anchors';
import { useTourAnchor } from '@/src/features/onboarding/AnchorRegistry';
import { useTour, useTourStep } from '@/src/features/onboarding/TourController';
import { useOnReconnect } from '@/src/core/context';

type TabKey = 'info' | 'renters' | 'transactions' | 'documents';

export function PropertyDetailScreen() {
  useTour('property-detail');
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // The API refuses every read of a property over the plan's limit; that is a state of
  // its own, not a load failure.
  const [locked, setLocked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [sharing, setSharing] = useState(false);
  // Owned here, not in the tab: the tabs render conditionally, so leaving Transactions
  // unmounts the panel and would otherwise discard the section and its filters.
  const [txTabState, setTxTabState] = useState<TransactionsTabState>(initialTransactionsTabState);
  // One fetch for two tabs. Info needs it for the KPI tiles and Transactions for the matrix,
  // and `useTransactionsList` holds local state with no cache - calling it in both would
  // fetch the same rows twice.
  const propertyTransactions = useTransactionsList({
    propertyId: Number.isNaN(Number(id)) ? undefined : Number(id),
  });
  const panelAnchorRef = useTourAnchor(ANCHORS.propertyDetailPanel);
  /**
   * The tab the tour is talking about, or the user's own when no tour is running.
   *
   * Derived, never written: `useTourStep` goes null the moment the tour ends and the screen
   * is back on whichever tab the user had chosen, with nothing to restore. Three steps point
   * at the panel below and each shows a different tab inside it, the way the property form's
   * tour shows page two without moving the user off page one.
   */
  const tourStep = useTourStep('property-detail');
  const shownTab: TabKey =
    tourStep === 'renters' ? 'renters'
    : tourStep === 'payments' ? 'transactions'
    : tourStep === 'documents' ? 'documents'
    : tourStep === null ? activeTab
    : 'info';

  const loadProperty = useCallback(() => {
      async function fetchProperty() {
        const numericId = Number(id);
        if (isNaN(numericId)) {
          setError(t('error.invalidPropertyId'));
          setLoading(false);
          return;
        }
        setLoading(true);
        setError(null);
        setLocked(false);
        try {
          const data = await getPropertyById(numericId);
          setProperty(data);
        } catch (err) {
          if (isPropertyLockedError(err)) setLocked(true);
          else setError(getApiErrorMessage(err, t('error.loadFailed')));
        } finally {
          setLoading(false);
        }
      }
      fetchProperty();
    }, [id, t]);
  useFocusEffect(loadProperty);
  // The gate keeps this screen mounted, so lifting it would otherwise leave the failed load.
  useOnReconnect(loadProperty);

  // Above the early returns: they are hooks.
  const imageSource = usePropertyImageSource(property?.image_url);
  const itemColor = useEntityColor(property?.color);

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/properties/edit/${property!.id}` as any);
  };

  const handleShareSheet = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSharing(true);
    try {
      await sharePropertySheet(property!);
    } catch (err) {
      alert(getApiErrorMessage(err, t('property.renterSheetFailed')));
    } finally {
      setSharing(false);
    }
  };

  // A photo the owner uploaded fills the band; a drawn preset is a whole building and is
  // shown whole.
  const isPhoto = !!imageSource && !(property?.image_url && parseImageUrlKey(property.image_url));

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingOverlay visible={true} />
      </ScreenContainer>
    );
  }

  if (locked) {
    return (
      <ScreenContainer>
        <LockedPropertyState />
      </ScreenContainer>
    );
  }

  if (error || !property) {
    return (
      <ScreenContainer>
        <EmptyState
          message={error ?? t('error.propertyNotFound')}
          icon="alert-circle"
        />
      </ScreenContainer>
    );
  }


  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header: a band in the property's color holding its picture, the way the renter
            screen holds the renter's initials. A drawn preset stands on the band's bottom
            edge; an uploaded photo fills it; with neither, the type icon sits in the middle. */}
        <View>
          <ColorBand
            color={property.color}
            fallbackHref="/properties"
            height={168}
            align={imageSource && !isPhoto ? 'bottom' : 'center'}
            actions={
              <>
                <BandButton
                  icon="share"
                  onPress={handleShareSheet}
                  busy={sharing}
                  accessibilityLabel={t('property.renterSheet')}
                />
                <BandButton
                  icon="pencil"
                  onPress={handleEdit}
                  accessibilityLabel={t('property.editProperty')}
                />
              </>
            }
          >
            {imageSource ? (
              <Image
                source={imageSource}
                style={isPhoto ? StyleSheet.absoluteFill : styles.illustration}
                resizeMode={isPhoto ? 'cover' : 'contain'}
                accessibilityIgnoresInvertColors
              />
            ) : (
              <View style={[styles.medallion, { backgroundColor: colors.surface }]}>
                <Icon name={getPropertyTypeIcon(property.type)} size={36} color={itemColor.fg} />
              </View>
            )}
          </ColorBand>

          <View style={styles.titleBlock}>
            <Text variant="headlineSmall" style={[styles.addressText, { color: colors.textPrimary }]}>
              {property.address}{formatFloorApartment(property, t)}
            </Text>
            <View style={styles.subtitleRow}>
              <ColorDot color={property.color} size={9} />
              <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                {property.city} · {t(propertyTypeLabelKey(property.type))}
              </Text>
            </View>
          </View>

          {/* Tab bar */}
          <DetailTabBar
            anchorId={ANCHORS.propertyDetailTabs}
            value={shownTab}
            onChange={setActiveTab}
            tabs={[
              { value: 'info', label: t('property.tabs.info') },
              { value: 'renters', label: t('property.tabs.renters') },
              { value: 'transactions', label: t('property.tabs.transactions') },
              { value: 'documents', label: t('property.tabs.documents') },
            ]}
          />
        </View>

        {/* Tab content */}
        <View ref={panelAnchorRef} collapsable={false} style={styles.tabContent}>
          {shownTab === 'info' && (
            <PropertyInfoTab
              property={property}
              transactions={propertyTransactions.transactions}
              transactionsLoading={propertyTransactions.loading}
              onPropertyChange={setProperty}
            />
          )}
          {shownTab === 'renters' && <PropertyRentersTab property={property} />}
          {shownTab === 'transactions' && (
            <PropertyTransactionsTab
              property={property}
              state={txTabState}
              onStateChange={setTxTabState}
              transactions={propertyTransactions.transactions}
              loading={propertyTransactions.loading}
              error={propertyTransactions.error}
              retryLoad={propertyTransactions.retryLoad}
              refreshTransactions={propertyTransactions.refreshTransactions}
            />
          )}
          {shownTab === 'documents' && (
            <PropertyDocumentsTab property={property} onPropertyChange={setProperty} />
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // As tall as the band, so the building rises between the round buttons instead of
  // starting below them: the art's own transparent headroom (about a tenth of its height)
  // lands level with the buttons' top. Drawn at 13:8 like the art, so `contain` leaves no
  // letterbox and the base stands on the band's bottom edge.
  illustration: {
    height: 168,
    width: 168 * (13 / 8),
  },
  medallion: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBlock: {
    paddingHorizontal: spacing.lg + spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },
  // Start-aligned, not centred: under a full-width band a centred title floated.
  addressText: {
    fontWeight: '700',
    textAlign: 'left',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabContent: {
    flex: 1,
  },
});
