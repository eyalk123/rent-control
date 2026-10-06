import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAlert } from '@/src/core/context';
import { localCopyOf, openStoredFile, readsThroughSdk, storagePathOf } from '@/src/shared/utils/storedFile';

/** A displayable URI for a stored file value: our files are fetched as the signed-in user
 *  and shown from a local copy; anything else passes through unchanged. Null while loading. */
export function useStoredFileUri(value: string | null | undefined): string | null {
  const viaSdk = readsThroughSdk(value);
  const path = viaSdk ? storagePathOf(value) : null;
  const [result, setResult] = useState<{ path: string; uri: string | null } | null>(null);

  useEffect(() => {
    if (!path) return;
    let live = true;
    localCopyOf(path)
      .then((uri) => live && setResult({ path, uri }))
      .catch(() => {
        if (live) setResult({ path, uri: null });
      });
    return () => {
      live = false;
    };
  }, [path]);

  if (!viaSdk) return value ?? null;
  return result?.path === path ? result.uri : null;
}

/** `openStoredFile` with the failure shown to the user. */
export function useOpenStoredFile(): (value: string) => void {
  const { t } = useTranslation();
  const { appAlert } = useAlert();
  return useCallback(
    (value: string) => {
      openStoredFile(value).catch(() => appAlert(t('error.title'), t('common.fileOpenFailed')));
    },
    [appAlert, t],
  );
}
