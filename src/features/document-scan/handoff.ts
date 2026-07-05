// In-memory handoff for carrying a scanned-document draft from the scan screen through the
// summary screen to the property/renter add screens across Expo Router navigation (params
// can't hold objects). The screens only read it when navigated with ?fromScan=1, so a stale
// entry never leaks into a manual "Add property" / "Add renter".
import type { PropertyFormValues } from '@/src/features/properties/validation/propertyValidation';
import type { ProvenanceItem, ReviewItem } from './types';
import type { MappedRenter } from './mapExtraction';
import type { PickedFile } from './api/extractLease';
import type { PropertyMatchStatus } from './matchProperty';

interface ScanHandoff {
  logId?: number;
  property?: Partial<PropertyFormValues>;
  propertyReview?: ReviewItem[];
  propertyProvenance?: ProvenanceItem[];
  /** Debug hint: the verbatim clause the scan based the property address on. */
  addressEvidence?: string | null;
  /** One entry per co-tenant on the lease, verified in sequence on the renter screen. On the
   *  summary screen these carry the raw extraction; after the user confirms the joint-rent
   *  split they are replaced with the finalised per-renter amounts. */
  renters?: MappedRenter[];
  /** When true the lease had one joint rent (`jointMonthlyRent`) for all renters — the summary
   *  screen offers an equal/custom split before continuing. */
  rentIsJoint?: boolean;
  jointMonthlyRent?: number | null;
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

/** Read the current handoff without consuming it (used by the summary screen). */
export function peekScanHandoff(): ScanHandoff | null {
  return _handoff;
}

/** Property add screen: take the property part, leave the renter queue + file for the renter
 *  screen. `logId` is kept so the renter screen can report against the same log. */
export function consumePropertyPrefill(): {
  logId?: number;
  property?: Partial<PropertyFormValues>;
  propertyReview?: ReviewItem[];
  propertyProvenance?: ProvenanceItem[];
  addressEvidence?: string | null;
} | null {
  if (!_handoff) return null;
  const out = {
    logId: _handoff.logId,
    property: _handoff.property,
    propertyReview: _handoff.propertyReview,
    propertyProvenance: _handoff.propertyProvenance,
    addressEvidence: _handoff.addressEvidence,
  };
  _handoff = {
    logId: _handoff.logId,
    property: _handoff.property,
    propertyReview: _handoff.propertyReview,
    propertyProvenance: _handoff.propertyProvenance,
    renters: _handoff.renters,
    rentIsJoint: _handoff.rentIsJoint,
    jointMonthlyRent: _handoff.jointMonthlyRent,
    file: _handoff.file,
  };
  return out;
}

/** Renter add screen: take the whole renter queue + the scanned file, the property match info,
 *  and the property draft (kept so the screen can pivot to "create property from lease"), then
 *  clear. The screen verifies each renter in `renters` in turn. */
export function consumeRenterPrefill(): {
  logId?: number;
  renters?: MappedRenter[];
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
    renters: _handoff.renters,
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
