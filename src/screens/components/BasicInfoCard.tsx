import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import type { Control, FieldValues } from 'react-hook-form';
import { FormInput } from '@/src/components/form/FormInput';
import { FormDropdown } from '@/src/components/form/FormDropdown';
import { ImagePickerSection } from '@/src/screens/components/ImagePickerSection';
import { spacing, lightColors, darkColors } from '@/src/theme';
import { useSectionHeaderStyle } from '@/src/context';
import type { PropertyType } from '@/src/types';
import type { TFunction } from 'i18next';

type BasicInfoCardProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
  imageUri: string | null;
  setImageUri: (uri: string | null) => void;
};

export function BasicInfoCard<TFieldValues extends FieldValues>({
  control,
  t,
  imageUri,
  setImageUri,
}: BasicInfoCardProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const sectionHeaderStyle = useSectionHeaderStyle();

  const translateTypeLabel = (type: PropertyType) =>
    t(`property.type${type.charAt(0).toUpperCase() + type.slice(1)}`);

  return (
    <Card
      style={[styles.sectionCard, { backgroundColor: colors.cardBackground, elevation: theme.dark ? 4 : 2 }]}
      mode="outlined"
    >
      <Card.Content style={styles.cardContent}>
        <View
          style={[
            sectionHeaderStyle.containerStyle,
            { flexDirection: 'row', alignItems: 'center' },
          ]}
        >
          <View
            style={[
              styles.sectionAccent,
              {
                backgroundColor: colors.sectionAccent,
                marginEnd: spacing.sm,
              },
            ]}
          />
          <Text
            variant="titleLarge"
            style={[styles.sectionHeader, sectionHeaderStyle.textStyle]}
            numberOfLines={1}
          >
            {t('property.basicInfo')}
          </Text>
        </View>

        <FormInput
          control={control}
          name={'address' as any}
          label={`${t('property.address')} *`}
        />
        <FormInput
          control={control}
          name={'city' as any}
          label={`${t('property.city')} *`}
        />
        <FormInput
          control={control}
          name={'zipCode' as any}
          label={`${t('property.zipCode')} *`}
          keyboardType="numeric"
        />
        <FormDropdown
          control={control}
          name={'type' as any}
          label={`${t('property.type')} *`}
          translateTypeLabel={translateTypeLabel}
          placeholderKey={t('property.typePlaceholder')}
        />
        <FormInput
          control={control}
          name={'sqFt' as any}
          label={`${t('property.sqFt')} *`}
          keyboardType="numeric"
        />
        <FormInput
          control={control}
          name={'purchasePrice' as any}
          label={`${t('property.purchasePrice')} *`}
          keyboardType="decimal-pad"
        />

        <ImagePickerSection
          imageUri={imageUri}
          setImageUri={setImageUri}
          t={t}
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
    flexShrink: 1,
    fontWeight: '700',
  },
  sectionAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
  },
});

