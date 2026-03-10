import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { createRenter, updateRenter, getRenterById } from '@/src/api/renters';
import { getApiErrorMessage } from '@/src/api/client';
import { useRenterContext, useRtlInputStyle, useRtlPlaceholder } from '@/src/context';
import { PropertyPicker, ScreenContainer } from '@/src/components';
import { useTheme } from 'react-native-paper';
import type { Renter, RenterCreate, RenterUpdate } from '@/src/types';
import { spacing } from '@/src/theme';
import { lightColors, darkColors } from '@/src/theme';

export function AddEditRenterScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { refreshRenters } = useRenterContext();
  const isEdit = Boolean(id);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [leaseStart, setLeaseStart] = useState('');
  const [leaseEnd, setLeaseEnd] = useState('');
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isEdit && id) {
      const numericId = Number(id);
      if (!isNaN(numericId)) {
        getRenterById(numericId).then((renter) => {
          setFirstName(renter.first_name);
          setLastName(renter.last_name);
          setPhone(renter.phone);
          setEmail(renter.email);
          setMonthlyRent(renter.monthly_rent.toString());
          setLeaseStart(renter.lease_start);
          setLeaseEnd(renter.lease_end);
          setPropertyId(renter.property_id);
        });
      }
    }
  }, [isEdit, id]);

  const handleSubmit = async () => {
    const rentNum = parseFloat(monthlyRent);

    if (!firstName.trim()) {
      Alert.alert(t('validation.title'), t('validation.firstNameRequired'));
      return;
    }
    if (!lastName.trim()) {
      Alert.alert(t('validation.title'), t('validation.lastNameRequired'));
      return;
    }
    if (!phone.trim()) {
      Alert.alert(t('validation.title'), t('validation.phoneRequired'));
      return;
    }
    if (!email.trim()) {
      Alert.alert(t('validation.title'), t('validation.emailRequired'));
      return;
    }
    if (isNaN(rentNum) || rentNum < 0) {
      Alert.alert(t('validation.title'), t('validation.rentRequired'));
      return;
    }
    if (!leaseStart.trim()) {
      Alert.alert(t('validation.title'), t('validation.leaseStartRequired'));
      return;
    }
    if (!leaseEnd.trim()) {
      Alert.alert(t('validation.title'), t('validation.leaseEndRequired'));
      return;
    }

    setLoading(true);
    try {
      if (isEdit && id) {
        const numericId = Number(id);
        const updateData: RenterUpdate = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          monthly_rent: rentNum,
          lease_start: leaseStart.trim(),
          lease_end: leaseEnd.trim(),
          property_id: propertyId,
        };
        await updateRenter(numericId, updateData);
      } else {
        const createData: RenterCreate = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          monthly_rent: rentNum,
          lease_start: leaseStart.trim(),
          lease_end: leaseEnd.trim(),
          property_id: propertyId ?? undefined,
        };
        await createRenter(createData);
      }

      await refreshRenters();
      router.back();
    } catch (err) {
      Alert.alert(
        t('error.title'),
        getApiErrorMessage(err, t('error.saveRenterFailed'))
      );
    } finally {
      setLoading(false);
    }
  };

  const onPressSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleSubmit();
  };

  return (
    <ScreenContainer>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={[styles.avatarPlaceholder, { backgroundColor: colors.inputFilledBackground }]}
            onPress={() => {}}
          >
            <MaterialCommunityIcons name="plus" size={28} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text variant="bodySmall" style={[styles.uploadLabel, { color: colors.textSecondary }]}>
            {t('property.uploadProfilePicture')}
          </Text>
        </View>

        <Text variant="titleSmall" style={styles.sectionHeader}>
          {t('renter.basicInfo')}
        </Text>
        <TextInput
          label={t('renter.firstName')}
          value={firstName}
          onChangeText={setFirstName}
          mode="outlined"
          dense
          style={[styles.input, { backgroundColor: colors.inputFilledBackground }, rtlInputStyle]}
          contentStyle={rtlInputStyle}
        />
        <TextInput
          label={t('renter.lastName')}
          value={lastName}
          onChangeText={setLastName}
          mode="outlined"
          dense
          style={[styles.input, { backgroundColor: colors.inputFilledBackground }, rtlInputStyle]}
          contentStyle={rtlInputStyle}
        />
        <TextInput
          label={t('renter.phone')}
          value={phone}
          onChangeText={setPhone}
          mode="outlined"
          keyboardType="phone-pad"
          dense
          style={[styles.input, { backgroundColor: colors.inputFilledBackground }, rtlInputStyle]}
          contentStyle={rtlInputStyle}
        />
        <TextInput
          label={t('renter.email')}
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          dense
          style={[styles.input, { backgroundColor: colors.inputFilledBackground }, rtlInputStyle]}
          contentStyle={rtlInputStyle}
        />
        <TextInput
          label={t('renter.monthlyRent')}
          value={monthlyRent}
          onChangeText={setMonthlyRent}
          mode="outlined"
          keyboardType="decimal-pad"
          dense
          style={[styles.input, { backgroundColor: colors.inputFilledBackground }, rtlInputStyle]}
          contentStyle={rtlInputStyle}
        />
        <Text variant="titleSmall" style={styles.sectionHeader}>
          {t('renter.leaseInfo')}
        </Text>
        <TextInput
          label={t('renter.leaseStart')}
          value={leaseStart}
          onChangeText={setLeaseStart}
          mode="outlined"
          placeholder={useRtlPlaceholder(t('renter.leaseStartPlaceholder'))}
          dense
          style={[styles.input, { backgroundColor: colors.inputFilledBackground }, rtlInputStyle]}
          contentStyle={rtlInputStyle}
        />
        <TextInput
          label={t('renter.leaseEnd')}
          value={leaseEnd}
          onChangeText={setLeaseEnd}
          mode="outlined"
          placeholder={useRtlPlaceholder(t('renter.leaseEndPlaceholder'))}
          dense
          style={[styles.input, { backgroundColor: colors.inputFilledBackground }, rtlInputStyle]}
          contentStyle={rtlInputStyle}
        />

        <PropertyPicker
          value={propertyId}
          onChange={setPropertyId}
          inputStyle={{ backgroundColor: colors.inputFilledBackground }}
        />

        <Button
          mode="contained"
          onPress={onPressSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
          accessibilityLabel={
            isEdit ? t('renter.updateRenter') : t('renter.addRenter')
          }
          accessibilityRole="button"
        >
          {isEdit ? t('renter.updateRenter') : t('renter.addRenter')}
        </Button>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadLabel: {
    marginTop: spacing.sm,
    fontSize: 12,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  input: {
    marginBottom: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
});
