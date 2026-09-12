import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';

import { darkColors, lightColors } from '@/src/core/theme';
import { formatMoney } from '@/src/shared/utils/money';
import type { MonthCell, MonthStatus } from '@/src/features/transactions/utils/rentSchedule';

interface Props {
  cell: MonthCell;
  monthLabel: string;
  statusLabel: string;
  extraLabel?: string;
  /** Appended to the spoken label when the payment landed after the due day. */
  lateLabel?: string;
  /**
   * Spoken label for an off-month of a non-monthly cycle — the month, and why nothing is
   * owed in it. Falls back to the bare status when the caller has no cadence to name.
   */
  notDueLabel?: string;
  onSelect: (cell: MonthCell) => void;
  saving?: boolean;
}

/** Either theme's palette. `typeof lightColors` alone is a literal type the dark set can't satisfy. */
type Palette = typeof lightColors | typeof darkColors;

/**
 * Visual treatment per status.
 *
 * Colour is never the only signal: `paid` also carries a check glyph and `overdue` an
 * exclamation — so the grid still reads for a colour-blind user.
 *
 * `not-due` and `outside-lease` have no entry — they are not drawn (see below).
 */
function styleFor(status: MonthStatus, colors: Palette) {
  switch (status) {
    case 'paid':
      return { backgroundColor: colors.revBg, borderColor: colors.revFg, color: colors.revFg, glyph: '✓' };
    case 'overdue':
      return { backgroundColor: colors.expBg, borderColor: colors.expFg, color: colors.expFg, glyph: '!' };
    case 'due':
      return {
        backgroundColor: colors.subtleOutline,
        borderColor: colors.outline,
        color: colors.textSecondary,
        glyph: '',
      };
    // `future`: a month that has not arrived yet. Present, so the year reads as a year, but
    // plainly inert — flat and dimmed, with no glyph suggesting something is pending.
    default:
      return {
        backgroundColor: colors.subtleOutline,
        borderColor: colors.subtleOutline,
        color: colors.textSecondary,
        glyph: '',
      };
  }
}

export function RentMonthBox({
  cell,
  monthLabel,
  statusLabel,
  extraLabel,
  lateLabel,
  notDueLabel,
  onSelect,
  saving,
}: Props) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  // Months the lease never covered. Nothing to say about them, so they are not drawn — they
  // only hold their slot so the months stay aligned between years and between renters.
  if (cell.status === 'outside-lease') {
    return <View style={styles.box} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
  }

  // An off-month of a quarterly or yearly cycle. Drawn, but visibly inert.
  //
  // These used to be blank like `outside-lease`, which read as missing data rather than as a
  // deliberate gap: a yearly lease showed eleven holes and looked broken. So the cell keeps
  // its outline and its month name, drops the fill, and carries a dash — present, plainly
  // empty, and plainly not something to act on.
  //
  // A plain `View`, never a disabled `Pressable`: there is no payment to record against a
  // month the lease does not bill for, so the cell should not be pressable at all rather
  // than swallow the press. It stays readable to a screen reader, which is the one way the
  // gap would otherwise go unexplained.
  if (cell.status === 'not-due') {
    return (
      <View
        accessibilityRole="image"
        accessibilityLabel={notDueLabel ?? statusLabel}
        style={[
          styles.box,
          styles.filled,
          {
            // No fill: every actionable state in this grid is a tinted block, so an untinted
            // outline is the one treatment that cannot be mistaken for one of them.
            backgroundColor: 'transparent',
            borderColor: colors.subtleOutline,
            borderStyle: 'dashed',
            opacity: 0.55,
          },
        ]}
      >
        <Text style={[styles.month, { color: colors.textSecondary }]} numberOfLines={1}>
          {monthLabel}
        </Text>
        <Text style={[styles.glyph, { color: colors.textSecondary }]}>–</Text>
      </View>
    );
  }

  const s = styleFor(cell.status, colors);
  const interactive = cell.isPayable || cell.transactions.length > 0;
  const amount = cell.status === 'paid' ? cell.paidSum : cell.expected;

  // Screen readers get the full story in one string — the visual grid conveys it through
  // position and colour, neither of which survives linearisation. The two corner markers
  // have no other spoken form at all, so both belong here.
  const accessibilityLabel = [
    monthLabel,
    statusLabel,
    amount > 0 ? formatMoney(amount) : null,
    extraLabel,
    cell.isLate ? lateLabel : null,
  ]
    .filter(Boolean)
    .join(', ');

  const handlePress = () => {
    if (!interactive || saving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(cell);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!interactive || saving}
      accessibilityRole="button"
      accessibilityState={{ disabled: !interactive || saving }}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.box,
        {
          backgroundColor: s.backgroundColor,
          borderColor: s.borderColor,
          borderStyle: cell.status === 'due' ? 'dashed' : 'solid',
          opacity: saving ? 0.5 : cell.status === 'future' ? 0.65 : 1,
        },
        styles.filled,
      ]}
    >
      <Text style={[styles.month, { color: s.color }]} numberOfLines={1}>
        {monthLabel}
      </Text>
      {s.glyph ? <Text style={[styles.glyph, { color: s.color }]}>{s.glyph}</Text> : null}

      {/* Paid, but not the amount that was being asked for at the time — a shortfall or an
          overpayment, and something to chase. */}
      {cell.hasAmountMismatch ? (
        <View style={[styles.dot, { backgroundColor: colors.warning }]} />
      ) : null}
      {/* Paid exactly what was asked, and the lease has moved since. Deliberately *not* the
          amber dot: nothing went wrong and nobody owes anything, so this is a note rather
          than a warning. Still shown, because an owner who changed the base rent without
          realising it re-priced three settled years has no other way to find out. A hollow
          ring in the muted text colour reads as "look here" without reading as "something
          is broken", and the two markers never coexist on one cell. */}
      {cell.leaseChangedSince ? (
        <View style={[styles.dot, styles.dotHollow, { borderColor: colors.textSecondary }]} />
      ) : null}
      {/* Paid after the due day. */}
      {cell.isLate ? <View style={[styles.lateTick, { backgroundColor: colors.warning }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    // Six per row on a phone. Capped so a tablet or landscape doesn't inflate each month
    // into a huge square — `aspectRatio` alone would let them grow without limit.
    flexBasis: '15%',
    flexGrow: 1,
    maxWidth: 72,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  // Only drawn cells carry a border; the placeholder is invisible but still takes its slot.
  filled: {
    borderWidth: 1,
    borderRadius: 10,
  },
  month: {
    fontSize: 13,
    fontWeight: '600',
  },
  glyph: {
    fontSize: 16,
    fontWeight: '700',
  },
  dot: {
    position: 'absolute',
    top: 4,
    insetInlineEnd: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // The neutral variant: an outline, not a fill, so it never competes with the amber dot.
  dotHollow: {
    borderWidth: 1,
    opacity: 0.75,
  },
  lateTick: {
    position: 'absolute',
    bottom: 4,
    insetInlineStart: 4,
    width: 10,
    height: 5,
    borderRadius: 1,
  },
});
