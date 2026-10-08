import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  useWindowDimensions,
} from 'react-native';
import { ActivityIndicator, IconButton, Text, useTheme } from 'react-native-paper';
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
  Icon,
  LoadingOverlay,
  EmptyState,
  ScreenContainer,
  DetailTabBar,
  DetailBackButton,
} from '@/src/shared/components/ui';
import { lightColors, darkColors, spacing } from '@/src/core/theme';
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
  const { width } = useWindowDimensions();
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

  // Above the early returns: it is a hook.
  const imageSource = usePropertyImageSource(property?.image_url);

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

  // Mirrors the edit button on the opposite corner: a filled circle over a photo, where a
  // plain glyph would be illegible, and a plain glyph otherwise.
  const renderShareButton = (overPhoto: boolean) => {
    const glyphColor = overPhoto ? colors.onPrimary : colors.textPrimary;
    return (
      <IconButton
        icon={() =>
          sharing ? (
            <ActivityIndicator size={18} color={glyphColor} />
          ) : (
            <Icon name="share" size={22} color={glyphColor} />
          )
        }
        size={22}
        style={[styles.shareIcon, overPhoto && { backgroundColor: colors.primary }]}
        onPress={handleShareSheet}
        disabled={sharing}
        accessibilityLabel={t('property.renterSheet')}
      />
    );
  };

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
        {/* Header: image + address + edit */}
        <View>
          {/* With a photo this is a hero. Without one it used to stay 200px tall and hold a
              grey glyph floating in empty space, which read as a broken image.
              It now shows a type medallion in the same slot the renter screen gives the
              avatar, so both detail screens open on an identity mark rather than a void. The
              edit button sits where the renter's does, and keeps its filled circle only over
              a photo, where a plain glyph would be illegible. */}
          <DetailBackButton
            fallbackHref="/properties"
            top={spacing.xs}
            color={colors.textPrimary}
          />
          {imageSource ? (
            <View style={[styles.imageWrapper, { width }]}>
              <Image
                source={imageSource}
                style={[styles.image, { width }]}
                resizeMode="cover"
              />
              <IconButton
                icon={() => (
                  <Icon
                    name="pencil"
                    size={22}
                    color={colors.onPrimary}
                  />
                )}
                size={22}
                style={[styles.editIcon, { backgroundColor: colors.primary }]}
                onPress={handleEdit}
                accessibilityLabel={t('property.editProperty')}
              />
              {renderShareButton(true)}
            </View>
          ) : (
            <View
              style={[styles.medallionSection, { width }]}
            >
              <View style={[styles.medallion, { backgroundColor: colors.primary }]}>
                <Icon
                  name={getPropertyTypeIcon(property.type)}
                  size={36}
                  color={colors.onPrimary}
                />
              </View>
              <IconButton
                icon={() => (
                  <Icon
                    name="pencil"
                    size={22}
                    color={colors.textPrimary}
                  />
                )}
                size={22}
                style={styles.editIcon}
                onPress={handleEdit}
                accessibilityLabel={t('property.editProperty')}
              />
              {renderShareButton(false)}
            </View>
          )}

          <View style={styles.addressRow}>
            <Text variant="titleLarge" style={[styles.addressText, { color: colors.textPrimary }]}>
              {property.address}{formatFloorApartment(property, t)}, {property.city}
            </Text>
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
  imageWrapper: {
    alignSelf: 'stretch',
    position: 'relative',
  },
  image: {
    height: 200,
  },
  // No photo: the medallion slot. Mirrors the renter screen's avatar section - centred mark,
  // actions absolutely positioned around it - so the two detail screens share a silhouette.
  medallionSection: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    position: 'relative',
  },
  medallion: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    margin: 0,
  },
  shareIcon: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    margin: 0,
  },
  addressRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  addressText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  tabContent: {
    flex: 1,
  },
});
