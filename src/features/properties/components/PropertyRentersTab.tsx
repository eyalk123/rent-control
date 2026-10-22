import React from 'react';
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { Property, Renter } from '@/src/shared/types';
import { getCurrentMonthlyRent, getLeaseEndDate } from '@/src/shared/types';
import { billedCadenceLabel } from '@/src/shared/utils/cadence';
import { getEffectiveLeaseEnd, getRenterLifecycle } from '@/src/shared/utils/renterStatus';
import { formatDateFull, parseISODate } from '@/src/shared/utils/dates';
import { EmptyState, Icon, StatusPill } from '@/src/shared/components/ui';
import { RenterAvatar } from '@/src/features/renters/components/RenterAvatar';
import { cardShadow, lightColors, darkColors, radii, spacing, useEntityColor } from '@/src/core/theme';
import { formatMoney } from '@/src/shared/utils/money';
import { useLanguageContext } from '@/src/context';

/** A tenant on the property, in their color, as on the Renters list. */
function RenterRow({ renter, onPress }: { renter: Renter; onPress: () => void }) {
  const { t } = useTranslation();
  const { isRtl, language } = useLanguageContext();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const tint = useEntityColor(renter.color);
  const ended = getRenterLifecycle(renter) === 'ended';
  const cadence = billedCadenceLabel(renter, t);
  const start = renter.lease_start ? parseISODate(renter.lease_start) : null;
  const end = getEffectiveLeaseEnd(renter) ?? getLeaseEndDate(renter);
  // When they came, or when they left: a date, not "Lease: 2025-07-22".
  const dateLine = ended
    ? end
      ? t('property.renterEnded', { date: formatDateFull(end, language) })
      : null
    : start
      ? t('property.renterSince', { date: formatDateFull(start, language) })
      : null;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
    >
      <RenterAvatar renter={renter} size={44} radius={13} backgroundColor={tint.bg} textColor={tint.fg} />
      <View style={styles.info}>
        <Text variant="titleSmall" style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {renter.first_name} {renter.last_name}
        </Text>
        <Text variant="bodySmall" style={{ color: colors.textSecondary }} numberOfLines={1}>
          {/* The rent is stored monthly, so that is what is shown — but the "/month"
              suffix used to be hardcoded, which told a quarterly tenant's landlord
              they were collecting monthly. Name the real cadence instead. */}
          {t('property.rentPerMonth', { amount: formatMoney(getCurrentMonthlyRent(renter)) })}
          {cadence ? ` (${cadence})` : ''}
        </Text>
        {dateLine ? (
          <Text variant="bodySmall" style={{ color: colors.textSecondary }} numberOfLines={1}>
            {dateLine}
          </Text>
        ) : null}
      </View>
      {/* Was hard-coded green "Active" for every renter, including leases that ran out
          years ago. A soft pill now, as on the Renters list. */}
      {/* Wrapped: StatusPill pins itself to the top of a row; here it centres on the card. */}
      <View>
        <StatusPill
          label={t(ended ? 'renter.status.ended' : 'renter.status.active')}
          backgroundColor={ended ? colors.controlFill : colors.revBg}
          color={ended ? colors.textSecondary : colors.revFg}
        />
      </View>
      <Icon name={isRtl ? 'chevron-left' : 'chevron-right'} size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

interface PropertyRentersTabProps {
  property: Property;
}

export function PropertyRentersTab({ property }: PropertyRentersTabProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();

  const allRenters = property.renters ?? [];
  // Past tenants stay on the property — they are the only record of who was here and
  // what they paid — but they sit under their own heading so the tab reads as
  // "who is here now".
  const current = allRenters.filter((r) => getRenterLifecycle(r) !== 'ended');
  const previous = allRenters.filter((r) => getRenterLifecycle(r) === 'ended');

  // The property is carried on the route so the form lands with it already selected — the
  // one field the user would otherwise dig out of the picker. It pre-selects rather than
  // locks, so a mis-tap is still fixable on the form.
  const addRenter = () =>
    router.push(`/renters/add?propertyId=${property.id}` as any);

  if (allRenters.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          message={t('property.noRenters')}
          icon="user-x"
          actionLabel={t('property.addRenterNow')}
          onAction={addRenter}
        />
      </View>
    );
  }

  const renderRenter = (renter: Renter) => (
    <RenterRow key={renter.id} renter={renter} onPress={() => router.push(`/renters/${renter.id}` as any)} />
  );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Headings only earn their space once there is more than one group. */}
      {current.length > 0 && previous.length > 0 && (
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
          {t('property.currentTenants').toUpperCase()}
        </Text>
      )}
      {current.map(renderRenter)}

      {previous.length > 0 && (
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
          {t('renter.previousTenants').toUpperCase()}
        </Text>
      )}
      {previous.map(renderRenter)}

      {/* Under the list rather than floating over it: a property holds a handful of
          tenants at most, so the button stays in reach without a FAB covering a card. */}
      <Pressable
        onPress={addRenter}
        accessibilityRole="button"
        style={[styles.addBox, { borderColor: colors.inputBorder }]}
      >
        <Icon name="plus" size={18} color={colors.primary} />
        <Text style={[styles.addText, { color: colors.primary }]}>{t('property.addRenterNow')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  // Small capitals, as the other detail-tab headings.
  sectionHeading: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.lg,
    ...cardShadow,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: '600',
  },
  // Dashed like the other "add" boxes, rather than a full outlined button.
  addBox: {
    minHeight: 52,
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  addText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
