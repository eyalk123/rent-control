import { AddEditSupplierScreen } from '@/src/features/suppliers/screens/AddEditSupplierScreen';

/**
 * The "New supplier" shortcut from the expense form. A root-stack route, not the one in the
 * Transactions tab: pushed here it lands on top of the add-transaction screen, which stays
 * mounted underneath with everything already typed into it.
 */
export default function AddSupplierFromExpenseRoute() {
  return <AddEditSupplierScreen />;
}
