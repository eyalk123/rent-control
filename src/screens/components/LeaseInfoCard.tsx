import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import type { Control, FieldValues } from 'react-hook-form';
import { FormInput } from '@/src/components/form/FormInput';
import { spacing, lightColors, darkColors } from '@/src/theme';
import { useSectionHeaderStyle, useLanguageContext, useRtlPlaceholder } from '@/src/context';
import type { TFunction } from 'i18next';

type LeaseInfoCardProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
};

export function LeaseInfoCard<TFieldValues extends FieldValues>({
  control,
  t,
}: LeaseInfoCardProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const sectionHeaderStyle = useSectionHeaderStyle();
  const { isRtl } = useLanguageContext();
  const rtlPlaceholder = useRtlPlaceholder();

  return (
    <Card
      style={[styles.sectionCard, { backgroundColor: colors.cardBackground, elevation: theme.dark ? 4 : 2 }]}
      mode="outlined"
    >
      <Card.Content style={styles.cardContent}>
        <View
          style={[
            sectionHeaderStyle.containerStyle,
            { flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center' },
          ]}
        >
          <View
            style={[
              styles.sectionAccent,
              {
                backgroundColor: colors.sectionAccent,
                marginRight: isRtl ? 0 : spacing.sm,
                marginLeft: isRtl ? spacing.sm : 0,
              },
            ]}
          />
          <Text
            variant="titleLarge"
            style={[styles.sectionHeader, sectionHeaderStyle.textStyle]}
            numberOfLines={1}
          >
            {t('property.leaseInfo')}
          </Text>
        </View>
        <View
          style={[
            sectionHeaderStyle.containerStyle,
            {
              marginTop: spacing.sm,
              flexDirection: isRtl ? 'row-reverse' : 'row',
              alignItems: 'center',
            },
          ]}
        >
          <View
            style={[
              styles.sectionAccent,
              styles.sectionAccentSmall,
              {
                backgroundColor: colors.sectionAccent,
                marginRight: isRtl ? 0 : spacing.sm,
                marginLeft: isRtl ? spacing.sm : 0,
              },
            ]}
          />
          <Text
            variant="titleSmall"
            style={[styles.subSectionHeader, sectionHeaderStyle.textStyle]}
            numberOfLines={1}
          >
            {t('property.additionalDetails')}
          </Text>
        </View>

        <FormInput
          control={control}
          name={'numberOfRooms' as any}
          label={t('property.numberOfRooms')}
          keyboardType="numeric"
        />
        <FormInput
          control={control}
          name={'parkingNumbersStr' as any}
          label={t('property.parkingNumbers')}
          placeholder={rtlPlaceholder(t('property.parkingNumbersPlaceholder'))}
        />
        <FormInput
          control={control}
          name={'electricityMeterNumber' as any}
          label={t('property.electricityMeterNumber')}
        />
        <FormInput
          control={control}
          name={'waterMeterTax' as any}
          label={t('property.waterMeterTax')}
          keyboardType="decimal-pad"
        />
        <FormInput
          control={control}
          name={'propertyTax' as any}
          label={t('property.propertyTax')}
          keyboardType="decimal-pad"
        />
        <FormInput
          control={control}
          name={'houseCommittee' as any}
          label={t('property.houseCommittee')}
          keyboardType="decimal-pad"
        />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    marginBottom: spacing.xl,
    borderRadius: 16,
  },
  cardContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sectionHeader: {
    flex: 1,
    fontWeight: '700',
  },
  subSectionHeader: {
    flex: 1,
    fontWeight: '600',
    opacity: 0.9,
  },
  sectionAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
  },
  sectionAccentSmall: {
    height: 18,
  },
});

