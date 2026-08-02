import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserRole } from '@ally/shared-types';

export interface EntitlementsState {
  role: UserRole | null;
  permissions: string[];
}

const initialState: EntitlementsState = {
  role: null,
  permissions: [],
};

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  customer: ['accounts:read', 'accounts:transfer', 'payments:read', 'payments:write', 'loans:read', 'loans:apply'],
  support: ['accounts:read', 'payments:read', 'loans:read', 'admin:users', 'admin:loans:read'],
  admin: ['accounts:read', 'payments:read', 'loans:read', 'loans:approve', 'admin:users', 'admin:loans:read', 'admin:loans:review'],
};

const entitlementsSlice = createSlice({
  name: 'entitlements',
  initialState,
  reducers: {
    setEntitlements(state, action: PayloadAction<UserRole>) {
      state.role = action.payload;
      state.permissions = ROLE_PERMISSIONS[action.payload] ?? [];
    },
    clearEntitlements(state) {
      state.role = null;
      state.permissions = [];
    },
  },
});

export const { setEntitlements, clearEntitlements } = entitlementsSlice.actions;

export const selectHasPermission = (permissions: string[], permission: string) =>
  permissions.includes(permission);

export default entitlementsSlice.reducer;
