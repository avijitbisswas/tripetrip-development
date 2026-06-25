import type { ResolvedVendorAccommodationAccess } from './accommodationAccess';
import type { VendorOSModule } from './types';

export function getVendorMutationAccessError(
  module: VendorOSModule,
  access: ResolvedVendorAccommodationAccess | null | undefined,
) {
  if (!access) return null;
  if (access.moduleVisibility[module]) return null;
  return 'This module is not enabled for this vendor account.';
}
