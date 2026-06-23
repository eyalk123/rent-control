import React from "react";
import { StyleSheet } from "react-native";
import { Button, Dialog, Portal, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import { useThemeContext } from "@/src/core/context/ThemeContext";

interface PropertyCreatedPromptProps {
  visible: boolean;
  onAddRenter: () => void;
  onSkip: () => void;
}

export function PropertyCreatedPrompt({
  visible,
  onAddRenter,
  onSkip,
}: PropertyCreatedPromptProps) {
  const { t } = useTranslation();
  const { theme } = useThemeContext();
  const colors = theme.dark ? darkColors : lightColors;
  const bgColor = colors.inputFilledBackground;

  return (
    <Portal>
      <Dialog
        visible={visible}
        dismissable={false}
        style={[styles.dialog, { backgroundColor: bgColor }]}
      >
        <Dialog.Icon icon="check-circle" color={colors.primary} size={48} />
        <Dialog.Title style={[styles.title, { color: colors.textPrimary }]}>
          {t("property.renterPromptTitle")}
        </Dialog.Title>
        <Dialog.Content>
          <Text
            variant="bodyMedium"
            style={[styles.message, { color: colors.textSecondary }]}
          >
            {t("property.renterPromptMessage")}
          </Text>
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          <Button
            mode="contained"
            onPress={onAddRenter}
            style={styles.primaryButton}
            contentStyle={styles.primaryButtonContent}
          >
            {t("property.addRenterNow")}
          </Button>
          <Button onPress={onSkip} textColor={colors.textSecondary}>
            {t("property.maybeLater")}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 16,
    elevation: 8,
    shadowColor: "#1E3A5F",
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    lineHeight: 22,
    textAlign: "center",
  },
  actions: {
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  primaryButton: {
    borderRadius: 12,
  },
  primaryButtonContent: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
});
