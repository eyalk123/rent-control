import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Surface, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/src/shared/components/ui';
import { spacing } from '@/src/core/theme';
import type { PropertyMatchStatus } from '../matchProperty';

const WARNING = '#B45309';

interface Props {
  matchStatus?: PropertyMatchStatus;
  /** Whether a property is currently selected in the form. */
  hasSelection: boolean;
  /** The selected property's address differs from the scanned lease. */
  mismatch: boolean;
  onCreateProperty?: () => void;
}

/** Renter-scan property-association feedback: the matched note, the soft mismatch warning, or
 *  the "couldn't match — create from lease" prompt. Rendered above the renter form. */
export function ScanPropertyNotice({ matchStatus, hasSelection, mismatch, onCreateProperty }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (mismatch) {
    return (
      <Notice tone="warning">
        <Text variant="bodySmall" style={{ color: WARNING, flex: 1 }}>
          {t('documentScan.propertyMismatchWarning')}
        </Text>
      </Notice>
    );
  }
  if (matchStatus === 'matched' && hasSelection) {
    return (
      <Notice tone="info" color={theme.colors.onSurfaceVariant}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
          {t('documentScan.matchedFromLease')}
        </Text>
      </Notice>
    );
  }
  if (matchStatus === 'none' && !hasSelection) {
    return (
      <Notice tone="warning">
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="bodySmall" style={{ color: WARNING }}>{t('documentScan.couldntMatch')}</Text>
          {onCreateProperty && (
            <Button compact mode="text" onPress={onCreateProperty} style={styles.createBtn} labelStyle={styles.createLabel}>
              {t('documentScan.createPropertyFromLease')}
            </Button>
          )}
        </View>
      </Notice>
    );
  }
  return null;
}

function Notice({ tone, color, children }: { tone: 'warning' | 'info'; color?: string; children: React.ReactNode }) {
  const theme = useTheme();
  const iconColor = tone === 'warning' ? WARNING : color ?? theme.colors.onSurfaceVariant;
  return (
    <Surface elevation={0} style={[styles.notice, { borderColor: iconColor }]}>
      <Icon name={tone === 'warning' ? 'alert-circle' : 'info'} size={16} color={iconColor} />
      {children}
    </Surface>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: spacing.sm,
    backgroundColor: 'transparent',
  },
  createBtn: {
    alignSelf: 'flex-start',
    marginStart: -8,
  },
  createLabel: {
    marginVertical: 0,
  },
});
