import { useState } from 'react';
import storage from '@react-native-firebase/storage';
import * as Crypto from 'expo-crypto';

type EntityType = 'properties' | 'renters';

export function useFirebaseUpload(entityType: EntityType, ownerId: string) {
  const [uploading, setUploading] = useState(false);

  async function uploadFile(uri: string, filename: string, mimeType: string): Promise<string> {
    setUploading(true);
    try {
      const uuid = Crypto.randomUUID();
      const storagePath = `${entityType}/${ownerId}/${uuid}/${filename}`;
      const ref = storage().ref(storagePath);

      const response = await fetch(uri);
      const blob = await response.blob();
      await ref.put(blob, { contentType: mimeType });
      return await ref.getDownloadURL();
    } finally {
      setUploading(false);
    }
  }

  return { uploadFile, uploading };
}
