import type { ReactNode } from 'react';
import type { PermissionAction, VendorOSModule } from '../types';

interface PermissionGateProps {
  can: (module: VendorOSModule, action?: PermissionAction) => boolean;
  module: VendorOSModule;
  action?: PermissionAction;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ can, module, action = 'view', children, fallback = null }: PermissionGateProps) {
  return can(module, action) ? <>{children}</> : <>{fallback}</>;
}
