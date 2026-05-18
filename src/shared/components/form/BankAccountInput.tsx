/*
 * Usage:
 *   const [bankAccount, setBankAccount] = useState({ bank: '', branch: '', account: '' });
 *   <BankAccountInput value={bankAccount} onChange={setBankAccount} />
 *   // on submit: isValidBankAccount(bankAccount) && serialize as "bank/branch/account"
 */
import React, { useRef, useState } from 'react';
import { I18nManager, Platform, StyleSheet, TextInput, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useLanguageContext } from '@/src/core/context';

const ISRAELI_BANKS_EN: Record<string, string> = {
  '4': 'Bank Yahav',
  '9': 'Israel Postal Bank',
  '10': 'Bank Leumi',
  '11': 'Discount Bank',
  '12': 'Bank Hapoalim',
  '13': 'Igud Bank',
  '14': 'Bank Otsar Ha-Hayal',
  '17': 'Mercantile Discount',
  '20': 'Mizrahi Tefahot',
  '26': 'Union Bank',
  '31': 'HaBenleumi (FIBI)',
  '46': 'Bank Massad',
  '52': 'Poalei Agudat Israel',
  '54': 'Bank of Jerusalem',
  '59': 'ONE ZERO',
  '68': 'Bank Esh',
};

const ISRAELI_BANKS_HE: Record<string, string> = {
  '4': 'בנק יהב',
  '9': 'בנק הדואר',
  '10': 'בנק לאומי',
  '11': 'בנק דיסקונט',
  '12': 'בנק הפועלים',
  '13': 'בנק אגוד',
  '14': 'בנק אוצר החייל',
  '17': 'מרכנתיל דיסקונט',
  '20': 'בנק מזרחי טפחות',
  '26': 'יובנק',
  '31': 'הבנק הבינלאומי הראשון',
  '46': 'בנק מסד',
  '52': 'בנק פועלי אגודת ישראל',
  '54': 'בנק ירושלים',
  '59': 'וואן זירו',
  '68': 'בנק אש',
};

export type BankAccountValue = { bank: string; branch: string; account: string };

export type BankAccountInputProps = {
  value: BankAccountValue;
  onChange: (value: BankAccountValue) => void;
  onValidChange?: (isValid: boolean) => void;
  autoFocus?: boolean;
  editable?: boolean;
  error?: string;
};

export function isValidBankAccount(v: BankAccountValue): boolean {
  return (
    /^\d{1,2}$/.test(v.bank) &&
    /^\d{3}$/.test(v.branch) &&
    /^\d{4,9}$/.test(v.account)
  );
}

export default function BankAccountInput({
  value,
  onChange,
  onValidChange,
  autoFocus = false,
  editable = true,
  error,
}: BankAccountInputProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { language } = useLanguageContext();
  const { t } = useTranslation();
  const ISRAELI_BANKS = language === 'he' ? ISRAELI_BANKS_HE : ISRAELI_BANKS_EN;

  const bankRef = useRef<TextInput>(null);
  const branchRef = useRef<TextInput>(null);
  const accountRef = useRef<TextInput>(null);

  const [isFocused, setIsFocused] = useState(false);
  const focusCount = useRef(0);

  const isValid = isValidBankAccount(value);
  const prevValid = useRef(false);
  React.useEffect(() => {
    if (onValidChange && prevValid.current !== isValid) {
      prevValid.current = isValid;
      onValidChange(isValid);
    }
  }, [isValid, onValidChange]);

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.outline;
  const borderWidth = isFocused ? 2 : 1;
  const backgroundColor = isFocused ? colors.inputBackground : colors.inputFilledBackground;

  const handleFocus = () => {
    focusCount.current += 1;
    setIsFocused(true);
  };

  const handleBlur = () => {
    focusCount.current -= 1;
    setTimeout(() => {
      if (focusCount.current <= 0) {
        focusCount.current = 0;
        setIsFocused(false);
      }
    }, 50);
  };

  const handleBankChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    onChange({ ...value, bank: digits });
    if (digits.length === 2) branchRef.current?.focus();
  };

  const handleBranchChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    onChange({ ...value, branch: digits });
    if (digits.length === 3) accountRef.current?.focus();
  };

  const handleAccountChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    onChange({ ...value, account: digits });
  };

  const handleBranchKeyPress = (e: { nativeEvent: { key: string } }) => {
    if (e.nativeEvent.key === 'Backspace' && value.branch === '') {
      bankRef.current?.focus();
      onChange({ ...value, bank: value.bank.slice(0, -1) });
    }
  };

  const handleAccountKeyPress = (e: { nativeEvent: { key: string } }) => {
    if (e.nativeEvent.key === 'Backspace' && value.account === '') {
      branchRef.current?.focus();
      onChange({ ...value, branch: value.branch.slice(0, -1) });
    }
  };

  const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: undefined });

  return (
    <View style={styles.wrap}>
      <Text
        variant="bodyMedium"
        style={[styles.label, { color: error ? colors.error : colors.textPrimary }]}
        numberOfLines={1}
      >
        {t('suppliers.bankAccount')}
      </Text>

      {/* Always LTR — numeric fields are directionally independent of UI language */}
      <View style={styles.ltrWrapper}>
      <View
        style={[
          styles.container,
          { borderColor, borderWidth, backgroundColor },
          isFocused && styles.focusShadow,
        ]}
      >
        <TextInput
          ref={bankRef}
          style={[styles.input, styles.bankInput, { fontFamily: monoFont, color: colors.textPrimary }]}
          value={value.bank}
          onChangeText={handleBankChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType="number-pad"
          maxLength={2}
          editable={editable}
          autoFocus={autoFocus}
          accessibilityLabel="Bank code"
          textAlign="center"
          placeholderTextColor={colors.textSecondary}
        />
        <View style={[styles.divider, { backgroundColor: colors.outline }]} />
        <TextInput
          ref={branchRef}
          style={[styles.input, styles.branchInput, { fontFamily: monoFont, color: colors.textPrimary }]}
          value={value.branch}
          onChangeText={handleBranchChange}
          onKeyPress={handleBranchKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType="number-pad"
          maxLength={3}
          editable={editable}
          accessibilityLabel="Branch code"
          textAlign="center"
          placeholderTextColor={colors.textSecondary}
        />
        <View style={[styles.divider, { backgroundColor: colors.outline }]} />
        <TextInput
          ref={accountRef}
          style={[styles.input, styles.accountInput, { fontFamily: monoFont, color: colors.textPrimary }]}
          value={value.account}
          onChangeText={handleAccountChange}
          onKeyPress={handleAccountKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType="number-pad"
          maxLength={9}
          editable={editable}
          accessibilityLabel="Account number"
          textAlign="center"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.labelsRow}>
        <Text variant="bodySmall" style={[styles.segmentLabel, styles.bankLabel, { color: colors.textSecondary }]}>
          {t('suppliers.bankCode').toUpperCase()}
        </Text>
        <Text variant="bodySmall" style={[styles.segmentLabel, styles.branchLabel, { color: colors.textSecondary }]}>
          {t('suppliers.branchCode').toUpperCase()}
        </Text>
        <Text variant="bodySmall" style={[styles.segmentLabel, styles.accountLabel, { color: colors.textSecondary }]}>
          {t('suppliers.accountNumber').toUpperCase()}
        </Text>
      </View>
      </View>{/* end ltrWrapper */}

      {value.bank.length >= 1 && (
        <Text
          variant="bodySmall"
          style={[styles.bankName, { color: colors.textSecondary }]}
          accessibilityLiveRegion="polite"
        >
          {ISRAELI_BANKS[value.bank] ?? t('suppliers.unknownBank')}
        </Text>
      )}

      {error ? (
        <Text variant="bodySmall" style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: 4,
    fontWeight: '500',
  },
  ltrWrapper: {
    // Force LTR layout regardless of app language — numeric bank fields are always left-to-right
    direction: I18nManager.isRTL ? 'ltr' : undefined,
  } as object,
  container: {
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    minHeight: 48,
  },
  focusShadow: {
    shadowColor: 'rgba(30,58,95,1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  bankInput: {
    width: 56,
  },
  branchInput: {
    width: 64,
  },
  accountInput: {
    flex: 1,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
  },
  labelsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  segmentLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  bankLabel: {
    width: 58,
    textAlign: 'center',
  },
  branchLabel: {
    width: 66,
    textAlign: 'center',
  },
  accountLabel: {
    flex: 1,
    textAlign: 'center',
  },
  bankName: {
    marginTop: 2,
  },
  errorText: {
    marginTop: 4,
  },
});
