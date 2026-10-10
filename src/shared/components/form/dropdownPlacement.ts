import { Platform, type ViewStyle } from "react-native";

const IS_IOS = Platform.OS === "ios";

/**
 * Where react-native-element-dropdown opens its option list.
 *
 * The library's default mode anchors the list under the field using `measureInWindow`, and on
 * iOS with the New Architecture that measurement comes back wrong inside scroll views
 * (react-native#48425), so every list opened at the top of the screen. "modal" mode skips the
 * measurement and centers the list over a dim backdrop. Android measures correctly and keeps
 * the anchored list. The library ignores "modal" on tablets, so iPads still anchor.
 */
export const dropdownPlacement = IS_IOS
  ? { mode: "modal" as const, backgroundColor: "rgba(0,0,0,0.45)" }
  : { mode: "default" as const };

/** "modal" mode drops the library's `maxHeight`, so a long list would fill the screen. */
export const dropdownListStyle: ViewStyle | undefined = IS_IOS
  ? { maxHeight: "70%" }
  : undefined;
