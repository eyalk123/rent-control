/**
 * Ambient types for Lucide per-icon deep imports.
 *
 * We import icons individually (e.g. `lucide-react-native/icons/pencil`) so Metro only
 * bundles the icons we use instead of the full ~1,700-icon barrel. Those subpaths are
 * resolved to the real `.mjs` files by a custom resolver in `metro.config.js`; TypeScript
 * doesn't know that mapping, so declare the module shape here.
 */
declare module "lucide-react-native/icons/*" {
  import type { LucideIcon } from "lucide-react-native";
  const icon: LucideIcon;
  export default icon;
}
