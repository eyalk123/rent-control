import React from "react";
import { StyleSheet } from "react-native";
import { Button, Dialog, Portal } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import { useThemeContext } from "@/src/core/context/ThemeContext";

interface Props {
  visible: boolean;
  title: string;
  onManual: () => void;
  onScan: () => void;
  onDismiss: () => void;
}

/** Small chooser shown by the "+" action: add by entering details manually, or by scanning a
 *  lease. Scanning is an input method of Add, not a separate button. */
export function AddOptionsDialog({ visible, title, onManual, onScan, onDismiss }: Props) {
  const { t } = useTranslation();
  const { theme } = useThemeContext();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={[styles.dialog, { backgroundColor: colors.inputFilledBackground }]}
      >
        <Dialog.Title style={[styles.title, { color: colors.textPrimary }]}>{title}</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Button
            mode="contained"
            icon="pencil"
            onPress={onManual}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {t("documentScan.addManually")}
          </Button>
          <Button
            mode="contained-tonal"
            icon="file-document-outline"
            onPress={onScan}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {t("documentScan.scanLease")}
          </Button>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  content: {
    gap: spacing.sm,
  },
  button: {
    borderRadius: 12,
  },
  buttonContent: {
    minHeight: 48,
  },
});
