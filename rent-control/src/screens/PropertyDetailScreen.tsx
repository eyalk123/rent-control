import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Image,
  useWindowDimensions,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Card, Text, useTheme, IconButton } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getPropertyById } from '@/src/api/properties';
import { getApiErrorMessage } from '@/src/api/client';
import type { Property } from '@/src/types';
import {
  LoadingOverlay,
  EmptyState,
  ScreenContainer,
} from '@/src/components';
import { lightColors, darkColors } from '@/src/theme';
import { spacing } from '@/src/theme';

export function PropertyDetailScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperty() {
      const numericId = Number(id);
      if (isNaN(numericId)) {
        setError(t('error.invalidPropertyId'));
        setLoading(false);
        return;
      }
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
  }, [id, t]);

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(tabs)/properties/edit/${property!.id}` as any);
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
          icon="home-alert"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['left', 'right']}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.imageWrapper, { width }]}>
          {property.image_url ? (
            <Image
              source={{ uri: property.image_url }}
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
              <MaterialCommunityIcons
                name="home"
                size={48}
                color={colors.placeholder}
              />
            </View>
          )}
        </View>
        <View style={styles.body}>
          <Card style={styles.card} mode="outlined">
            <View style={[styles.atGlanceHeader, { backgroundColor: colors.primary }]}>
              <Text variant="titleSmall" style={styles.atGlanceTitle}>
                {t('property.atAGlance')}
              </Text>
            </View>
            <Card.Content style={styles.atGlanceContent}>
              <View style={styles.atGlanceRow}>
                <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                  {t('property.typeLabel')}
                </Text>
                <Text variant="bodyMedium">{property.type}</Text>
              </View>
              <View style={styles.atGlanceRow}>
                <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                  {t('property.sqFtLabel')}
                </Text>
                <Text variant="bodyMedium">
                  {property.sq_ft.toLocaleString()}
                </Text>
              </View>
              <View style={styles.atGlanceRow}>
                <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                  {t('property.purchasePrice')}
                </Text>
                <Text variant="bodyMedium">
                  ${property.purchase_price.toLocaleString()}
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <Text variant="titleSmall" style={styles.sectionLabel}>
                {t('property.address')}
              </Text>
              <Text variant="bodyMedium" style={styles.address}>
                {property.address}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                {property.city}, {property.zip_code}
              </Text>
            </Card.Content>
          </Card>

          {property.renters && property.renters.length > 0 ? (
            <Card style={styles.card} mode="outlined">
              <View style={[styles.sectionHeader, { backgroundColor: colors.primary }]}>
                <Text variant="titleSmall" style={styles.sectionHeaderText}>
                  {t('property.renters')}
                </Text>
              </View>
              <Card.Content>
                {property.renters.map((renter) => (
                  <View key={renter.id} style={styles.renterRow}>
                    <View
                      style={[
                        styles.renterAvatar,
                        { backgroundColor: colors.inputBackground },
                      ]}
                    >
                      <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                        {renter.first_name[0]}
                        {renter.last_name[0]}
                      </Text>
                    </View>
                    <View style={styles.renterInfo}>
                      <Text variant="bodyMedium">
                        {renter.first_name} {renter.last_name}
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: colors.textSecondary }}
                      >
                        {t('property.lease')}: {renter.lease_start} – {renter.lease_end}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: colors.success },
                      ]}
                    >
                      <Text variant="labelSmall" style={styles.statusPillText}>
                        {t('renter.status.active')}
                      </Text>
                    </View>
                  </View>
                ))}
              </Card.Content>
            </Card>
          ) : (
            <Card style={styles.card} mode="outlined">
              <Card.Content>
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                  {t('property.noRenters')}
                </Text>
              </Card.Content>
            </Card>
          )}

          <Pressable
            onPress={handleEdit}
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            accessibilityLabel={t('property.editProperty')}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#FFF" />
            <Text variant="labelLarge" style={styles.editButtonText}>
              {t('property.editProperty')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  imageWrapper: {
    alignSelf: 'stretch',
  },
  image: {
    height: 200,
  },
  imagePlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: spacing.lg,
    marginTop: -spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: 10,
    overflow: 'hidden',
  },
  atGlanceHeader: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  atGlanceTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  atGlanceContent: {
    padding: spacing.md,
  },
  atGlanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  address: {
    marginBottom: spacing.xs,
  },
  sectionHeader: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sectionHeaderText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  renterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  renterAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  renterInfo: {
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 10,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
