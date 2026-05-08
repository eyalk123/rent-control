import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { Button, Dialog, Portal, Text } from "react-native-paper";
import { darkColors, lightColors } from "@/src/core/theme";
import { spacing } from "@/src/core/theme";
import { useThemeContext } from "@/src/core/context/ThemeContext";

export type AlertButtonStyle = "default" | "cancel" | "destructive";

export interface AlertButton {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  resolveConfirm?: (value: boolean) => void;
}

interface AlertContextType {
  appAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  appConfirm: (title: string, message?: string) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const DEFAULT_BUTTONS: AlertButton[] = [{ text: "OK", style: "default" }];

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeContext();
  const colors = theme.dark ? darkColors : lightColors;

  const [state, setState] = useState<AlertState>({
    visible: false,
    title: "",
    message: "",
    buttons: DEFAULT_BUTTONS,
  });

  const resolveRef = useRef<((value: boolean) => void) | undefined>(undefined);

  const dismiss = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
    resolveRef.current = undefined;
  }, []);

  const appAlert = useCallback(
    (title: string, message = "", buttons: AlertButton[] = DEFAULT_BUTTONS) => {
      resolveRef.current = undefined;
      setState({ visible: true, title, message, buttons });
    },
    []
  );

  const appConfirm = useCallback(
    (title: string, message = ""): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setState({
          visible: true,
          title,
          message,
          buttons: [],
        });
      });
    },
    []
  );

  const bgColor = theme.dark
    ? darkColors.inputFilledBackground
    : lightColors.inputFilledBackground;

  const handleButtonPress = (btn: AlertButton) => {
    dismiss();
    if (resolveRef.current) {
      resolveRef.current(btn.style !== "cancel");
    }
    btn.onPress?.();
  };

  const buttons: React.ReactElement[] = [];

  if (state.buttons.length === 0 && resolveRef.current) {
    buttons.push(
      <Button
        key="cancel"
        onPress={() => handleButtonPress({ text: "", style: "cancel" })}
        textColor={colors.textSecondary}
      >
        Cancel
      </Button>,
      <Button
        key="ok"
        mode="contained"
        onPress={() => handleButtonPress({ text: "", style: "default" })}
        style={styles.confirmButton}
      >
        OK
      </Button>,
    );
  } else {
    const cancelBtn = state.buttons.find((b) => b.style === "cancel");
    const actionBtns = state.buttons.filter((b) => b.style !== "cancel");

    if (cancelBtn) {
      buttons.push(
        <Button
          key="cancel"
          onPress={() => handleButtonPress(cancelBtn)}
          textColor={colors.textSecondary}
        >
          {cancelBtn.text}
        </Button>,
      );
    }

    actionBtns.forEach((btn, i) => {
      buttons.push(
        <Button
          key={i}
          mode={btn.style === "destructive" ? "text" : "contained"}
          onPress={() => handleButtonPress(btn)}
          textColor={btn.style === "destructive" ? colors.error : undefined}
          style={btn.style !== "destructive" ? styles.confirmButton : undefined}
        >
          {btn.text}
        </Button>,
      );
    });
  }

  return (
    <AlertContext.Provider value={{ appAlert, appConfirm }}>
      {children}
      <Portal>
        <Dialog
          visible={state.visible}
          onDismiss={dismiss}
          style={[styles.dialog, { backgroundColor: bgColor }]}
        >
          {state.title ? (
            <Dialog.Title style={[styles.title, { color: colors.textPrimary }]}>
              {state.title}
            </Dialog.Title>
          ) : null}
          {state.message ? (
            <Dialog.Content>
              <Text
                variant="bodyMedium"
                style={[styles.message, { color: colors.textSecondary }]}
              >
                {state.message}
              </Text>
            </Dialog.Content>
          ) : null}
          <Dialog.Actions style={styles.actions}>
            {buttons}
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </AlertContext.Provider>
  );
}

export function useAlert(): AlertContextType {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return ctx;
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
  },
  message: {
    lineHeight: 22,
  },
  actions: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  confirmButton: {
    marginLeft: spacing.xs,
  },
});
