import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { createRenter, updateRenter, getRenterById } from '@/src/api/renters';
import { useRenterContext } from '@/src/context';
import { PropertyPicker } from '@/src/components';
import type { Renter } from '@/src/types';

export function AddEditRenterScreen() {
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
      Alert.alert('Validation', 'First name is required.');
      return;
    }
    if (!lastName.trim()) {
      Alert.alert('Validation', 'Last name is required.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Validation', 'Phone is required.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Validation', 'Email is required.');
      return;
    }
    if (isNaN(rentNum) || rentNum < 0) {
      Alert.alert('Validation', 'Valid monthly rent is required.');
      return;
    }
    if (!leaseStart.trim()) {
      Alert.alert('Validation', 'Lease start date is required.');
      return;
    }
    if (!leaseEnd.trim()) {
      Alert.alert('Validation', 'Lease end date is required.');
      return;
    }

    setLoading(true);
    try {
      const data: Partial<Renter> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        monthly_rent: rentNum,
        lease_start: leaseStart.trim(),
        lease_end: leaseEnd.trim(),
        property_id: propertyId,
      };

      if (isEdit && id) {
        const numericId = Number(id);
        await updateRenter(numericId, data);
      } else {
        await createRenter(data);
      }

      await refreshRenters();
      router.back();
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to save renter'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput
        label="First Name"
        value={firstName}
        onChangeText={setFirstName}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Last Name"
        value={lastName}
        onChangeText={setLastName}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        mode="outlined"
        keyboardType="phone-pad"
        style={styles.input}
      />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        label="Monthly Rent"
        value={monthlyRent}
        onChangeText={setMonthlyRent}
        mode="outlined"
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <TextInput
        label="Lease Start (YYYY-MM-DD)"
        value={leaseStart}
        onChangeText={setLeaseStart}
        mode="outlined"
        placeholder="e.g. 2024-01-01"
        style={styles.input}
      />
      <TextInput
        label="Lease End (YYYY-MM-DD)"
        value={leaseEnd}
        onChangeText={setLeaseEnd}
        mode="outlined"
        placeholder="e.g. 2025-01-01"
        style={styles.input}
      />

      <PropertyPicker
        value={propertyId}
        onChange={setPropertyId}
        label="Property"
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.submitButton}
      >
        {isEdit ? 'Update Renter' : 'Add Renter'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  input: {
    marginBottom: 12,
  },
  submitButton: {
    marginTop: 8,
  },
});
