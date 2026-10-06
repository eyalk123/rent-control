import { useState } from 'react';
import storage from '@react-native-firebase/storage';
import * as Crypto from 'expo-crypto';

type EntityType = 'properties' | 'renters' | 'transactions';

export function useFirebaseUpload(entityType: EntityType, ownerId: string) {
  const [uploading, setUploading] = useState(false);

  /** Upload a file and return its storage path, which is what the API stores. Never a
   *  download URL: its token would open the file for anyone holding the link (PLATFORM.md §18). */
  async function uploadFile(uri: string, filename: string, mimeType: string): Promise<string> {
    setUploading(true);
    try {
      const uuid = Crypto.randomUUID();
      const storagePath = `${entityType}/${ownerId}/${uuid}/${filename}`;
      await storage().ref(storagePath).putFile(uri, { contentType: mimeType });
      return storagePath;
    } finally {
      setUploading(false);
    }
  }

  return { uploadFile, uploading };
}
