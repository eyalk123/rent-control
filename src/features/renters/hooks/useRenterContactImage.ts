import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Contacts from 'expo-contacts';

/**
 * Fetches the contact image URI for a renter linked to a device contact.
 * Returns null on web, when contact_id is missing, or when the contact has no image.
 */
export function useRenterContactImage(contactId: string | null | undefined): string | null {
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (!contactId || Platform.OS === 'web') {
      setImageUri(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const available = await Contacts.isAvailableAsync();
        if (!available || cancelled) return;

        const contact = await Contacts.getContactByIdAsync(contactId, [
          Contacts.Fields.Image,
        ]);
        if (!cancelled && contact?.image?.uri) {
          setImageUri(contact.image.uri);
        } else if (!cancelled) {
          setImageUri(null);
        }
      } catch {
        if (!cancelled) setImageUri(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contactId]);

  return imageUri;
}
