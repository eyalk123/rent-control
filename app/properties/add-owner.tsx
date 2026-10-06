import { AddEditPropertyOwnerScreen } from '@/src/features/property-owners/screens/AddEditPropertyOwnerScreen';

/**
 * The "New owner" shortcut from the property form. A root-stack route, not the one in the
 * Properties tab: pushed here it lands on top of the property form, which stays mounted
 * underneath with everything already typed into it.
 */
export default function AddOwnerFromPropertyRoute() {
  return <AddEditPropertyOwnerScreen />;
}
