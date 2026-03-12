import { LoadingOverlay, ScreenContainer } from "@/src/components";
import { useLanguageContext, usePropertyContext } from "@/src/context";
import { usePropertyForm } from "@/src/hooks/usePropertyForm";
import { BasicInfoCard } from "@/src/screens/components/BasicInfoCard";
import { LeaseInfoCard } from "@/src/screens/components/LeaseInfoCard";
import { darkColors, lightColors, spacing } from "@/src/theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { Button, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function AddEditPropertyScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshProperties } = usePropertyContext();
  const isEdit = Boolean(id);
  const submitBarHeight = 64;
  const bottomPadding = submitBarHeight + insets.bottom;

  const navigation = useNavigation();

  const {
    formMethods,
    onSubmit,
    isSubmitting,
    isFetching,
    imageUri,
    setImageUri,
  } = usePropertyForm({
    id,
    t,
    refreshProperties,
    onSuccess: () => router.back(),
  });

  const { formState, control } = formMethods;

  React.useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (!formState.isDirty) return;
      e.preventDefault();
      Alert.alert(
        t("common.discardChanges"),
        t("common.discardChangesMessage"),
        [
          { text: t("common.cancel"), style: "cancel", onPress: () => {} },
          {
            text: t("common.discard"),
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
        ],
      );
    });
    return unsub;
  }, [navigation, formState.isDirty, t]);

  const onPressSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSubmit();
  };

  if (isEdit && isFetching) {
    return (
      <ScreenContainer>
        <LoadingOverlay visible={true} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View
        style={[
          styles.topRow,
          {
            paddingTop: insets.top + spacing.xs,
            paddingBottom: spacing.sm,
            paddingHorizontal: spacing.formPaddingHorizontal,
            backgroundColor: theme.colors.background,
            flexDirection: isRtl ? "row-reverse" : "row",
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backButton}
          accessibilityLabel={t("common.back")}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name={isRtl ? "chevron-right" : "chevron-left"}
            size={28}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <ScrollView
          style={[styles.scroll, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={true}
        >
          <BasicInfoCard
            control={control}
            t={t}
            imageUri={imageUri}
            setImageUri={setImageUri}
          />

          <LeaseInfoCard control={control} t={t} />
        </ScrollView>
        <View
          style={[
            styles.submitBar,
            {
              paddingBottom: 1,
              backgroundColor: theme.colors.background,
              borderBottomWidth: 1,
              borderTopWidth: 1,
              borderTopColor: colors.outline,
            },
          ]}
        >
          <Button
            mode="contained"
            onPress={onPressSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={[styles.submitButton, { minHeight: 48 }]}
            contentStyle={styles.submitButtonContent}
            accessibilityLabel={
              isEdit ? t("property.updateProperty") : t("property.addProperty")
            }
            accessibilityRole="button"
          >
            {isEdit ? t("property.updateProperty") : t("property.addProperty")}
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topRow: {
    alignItems: "center",
  },
  backButton: {
    padding: spacing.xs,
  },
  imagePickerWrap: {
    flex: 1,
    minWidth: 0,
  },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.formPaddingHorizontal,
    paddingTop: spacing.lg,
  },
  submitBar: {
    paddingHorizontal: spacing.formPaddingHorizontal,
    paddingTop: spacing.md,
  },
  submitButton: {
    borderRadius: 12,
  },
  submitButtonContent: {
    minHeight: 48,
  },
});
