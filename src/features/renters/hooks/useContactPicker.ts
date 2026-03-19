import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Contacts from 'expo-contacts';

export type PickedContact = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  contactId: string;
};

export function useContactPicker() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const checkAvailability = useCallback(async () => {
    if (Platform.OS === 'web') return false;
    const available = await Contacts.isAvailableAsync();
    setIsAvailable(available);
    return available;
  }, []);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'web') return 'denied';
    const { status } = await Contacts.requestPermissionsAsync();
    return status;
  }, []);

  const pickContact = useCallback(async (): Promise<PickedContact | null> => {
    if (Platform.OS === 'web') return null;
    const available = await Contacts.isAvailableAsync();
    if (!available) return null;

    const contact = await Contacts.presentContactPickerAsync();
    if (!contact?.id) return null;

    const nameParts = (contact.name ?? '').trim().split(/\s+/);
    const firstName = contact.firstName ?? nameParts[0] ?? '';
    const lastName = contact.lastName ?? nameParts.slice(1).join(' ') ?? '';
    const phone = contact.phoneNumbers?.[0]?.number ?? '';
    const email = contact.emails?.[0]?.email ?? '';

    return {
      firstName,
      lastName,
      phone,
      email,
      contactId: contact.id,
    };
  }, []);

  return {
    isAvailable,
    checkAvailability,
    requestPermission,
    pickContact,
  };
}
