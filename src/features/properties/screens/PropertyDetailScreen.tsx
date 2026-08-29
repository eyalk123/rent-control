import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getPropertyById } from '@/src/features/properties/api/properties';
import { getApiErrorMessage } from '@/src/core/api/client';
import type { Property } from '@/src/shared/types';
import { formatFloorApartment } from '@/src/shared/utils/propertyAddress';
import {
  Icon,
  LoadingOverlay,
  EmptyState,
  ScreenContainer,
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
import { getPropertyImageSource } from '@/src/features/properties/utils/propertyImageSource';
import { ANCHORS } from '@/src/features/onboarding/anchors';
import { TourAnchor, useTourAnchor } from '@/src/features/onboarding/AnchorRegistry';
import { useTour, useTourStep } from '@/src/features/onboarding/TourController';

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
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  // Owned here, not in the tab: the tabs render conditionally, so leaving Transactions
  // unmounts the panel and would otherwise discard the section and its filters.
  const [txTabState, setTxTabState] = useState<TransactionsTabState>(initialTransactionsTabState);
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

  useFocusEffect(
    useCallback(() => {
      async function fetchProperty() {
        const numericId = Number(id);
        if (isNaN(numericId)) {
          setError(t('error.invalidPropertyId'));
          setLoading(false);
          return;
        }
        setLoading(true);
        setError(null);
        try {
          const data = await getPropertyById(numericId);
          setProperty(data);
        } catch (err) {
          setError(getApiErrorMessage(err, t('error.loadFailed')));
        } finally {
          setLoading(false);
        }
      }
      fetchProperty();
    }, [id, t])
  );

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/properties/edit/${property!.id}` as any);
  };

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingOverlay visible={true} />
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

  const imageSource = getPropertyImageSource(property.image_url);

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header: image + address + edit */}
        <View>
          <View style={[styles.imageWrapper, { width }]}>
            {imageSource ? (
              <Image
                source={imageSource}
                style={[styles.image, { width }]}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.imagePlaceholder,
                  { width, backgroundColor: colors.inputBackground },
                ]}
              >
                <Icon
                  name="home"
                  size={48}
                  color={colors.placeholder}
                />
              </View>
            )}
            <IconButton
              icon={() => <Icon name="pencil" size={20} color={colors.onPrimary} />}
              size={20}
              style={[styles.editIcon, { backgroundColor: colors.primary }]}
              onPress={handleEdit}
              accessibilityLabel={t('property.editProperty')}
            />
          </View>

          <View style={styles.addressRow}>
            <Text variant="titleLarge" style={[styles.addressText, { color: colors.textPrimary }]}>
              {property.address}{formatFloorApartment(property, t)}, {property.city}
            </Text>
          </View>

          {/* Tab bar */}
          <TourAnchor
            id={ANCHORS.propertyDetailTabs}
            style={[styles.tabBar, { backgroundColor: colors.inputBackground }]}
          >
            {([
              { value: 'info', label: t('property.tabs.info') },
              { value: 'renters', label: t('property.tabs.renters') },
              { value: 'transactions', label: t('property.tabs.transactions') },
              { value: 'documents', label: t('property.tabs.documents') },
            ] as const).map((tab) => {
              const isActive = shownTab === tab.value;
              return (
                <Pressable
                  key={tab.value}
                  style={[
                    styles.tab,
                    isActive && { borderBottomColor: colors.primary },
                  ]}
                  onPress={() => setActiveTab(tab.value as TabKey)}
                >
                  <Text
                    variant="labelLarge"
                    style={[
                      styles.tabLabel,
                      { color: isActive ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </TourAnchor>
        </View>

        {/* Tab content */}
        <View ref={panelAnchorRef} collapsable={false} style={styles.tabContent}>
          {shownTab === 'info' && <PropertyInfoTab property={property} />}
          {shownTab === 'renters' && <PropertyRentersTab property={property} />}
          {shownTab === 'transactions' && (
            <PropertyTransactionsTab
              property={property}
              state={txTabState}
              onStateChange={setTxTabState}
            />
          )}
          {shownTab === 'documents' && <PropertyDocumentsTab property={property} />}
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
  imagePlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    margin: 0,
  },
  addressRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  addressText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
});
