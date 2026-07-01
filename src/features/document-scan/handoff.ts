// In-memory handoff for carrying a scanned-document draft from the scan screen to the
// property/renter add screens across Expo Router navigation (params can't hold objects).
// The screens only read it when navigated with ?fromScan=1, so a stale entry never leaks
// into a manual "Add property" / "Add renter".
import type { PropertyFormValues } from '@/src/features/properties/validation/propertyValidation';
import type { RenterFormValues } from '@/src/features/renters/validation/renterValidation';
import type { ProvenanceItem, ReviewItem } from './types';
import type { PickedFile } from './api/extractLease';
import type { PropertyMatchStatus } from './matchProperty';

interface ScanHandoff {
  logId?: number;
  property?: Partial<PropertyFormValues>;
  propertyReview?: ReviewItem[];
  propertyProvenance?: ProvenanceItem[];
  renter?: Partial<RenterFormValues>;
  renterReview?: ReviewItem[];
  renterProvenance?: ProvenanceItem[];
  file?: PickedFile | null;
  /** Renter-target scans: the existing property the lease matched (or null), for preselect
   *  and the soft mismatch warning on the renter form. */
  matchedPropertyId?: number | null;
  propertyMatchStatus?: PropertyMatchStatus;
}

let _handoff: ScanHandoff | null = null;

export function setScanHandoff(h: ScanHandoff): void {
  _handoff = h;
}

/** Property add screen: take the property part, leave renter + file for the renter screen.
 *  `logId` is kept in the handoff so the renter screen can report against the same log. */
export function consumePropertyPrefill(): {
  logId?: number;
  property?: Partial<PropertyFormValues>;
  propertyReview?: ReviewItem[];
  propertyProvenance?: ProvenanceItem[];
} | null {
  if (!_handoff) return null;
  const out = {
    logId: _handoff.logId,
    property: _handoff.property,
    propertyReview: _handoff.propertyReview,
    propertyProvenance: _handoff.propertyProvenance,
  };
  _handoff = {
    logId: _handoff.logId,
    renter: _handoff.renter,
    renterReview: _handoff.renterReview,
    renterProvenance: _handoff.renterProvenance,
    file: _handoff.file,
  };
  return out;
}

/** Renter add screen: take the renter part + the scanned file, the property match info, and
 *  the property draft (kept so the screen can pivot to "create property from lease"), then clear. */
export function consumeRenterPrefill(): {
  logId?: number;
  renter?: Partial<RenterFormValues>;
  renterReview?: ReviewItem[];
  renterProvenance?: ProvenanceItem[];
  file?: PickedFile | null;
  matchedPropertyId?: number | null;
  propertyMatchStatus?: PropertyMatchStatus;
  property?: Partial<PropertyFormValues>;
  propertyReview?: ReviewItem[];
  propertyProvenance?: ProvenanceItem[];
} | null {
  if (!_handoff) return null;
  const out = {
    logId: _handoff.logId,
    renter: _handoff.renter,
    renterReview: _handoff.renterReview,
    renterProvenance: _handoff.renterProvenance,
    file: _handoff.file,
    matchedPropertyId: _handoff.matchedPropertyId,
    propertyMatchStatus: _handoff.propertyMatchStatus,
    property: _handoff.property,
    propertyReview: _handoff.propertyReview,
    propertyProvenance: _handoff.propertyProvenance,
  };
  _handoff = null;
  return out;
}

export function clearScanHandoff(): void {
  _handoff = null;
}
