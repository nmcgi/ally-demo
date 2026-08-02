import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FeatureFlags {
  loanOrigination: boolean;
  achPayments: boolean;
  wireTransfers: boolean;
  adminPortal: boolean;
}

export interface FeatureFlagsState {
  flags: FeatureFlags;
  loaded: boolean;
}

const initialState: FeatureFlagsState = {
  flags: {
    loanOrigination: true,
    achPayments: true,
    wireTransfers: false,
    adminPortal: true,
  },
  loaded: false,
};

const featureFlagsSlice = createSlice({
  name: 'featureFlags',
  initialState,
  reducers: {
    setFlags(state, action: PayloadAction<Partial<FeatureFlags>>) {
      state.flags = { ...state.flags, ...action.payload };
      state.loaded = true;
    },
  },
});

export const { setFlags } = featureFlagsSlice.actions;
export default featureFlagsSlice.reducer;
