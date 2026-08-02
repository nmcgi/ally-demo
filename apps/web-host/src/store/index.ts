import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import entitlementsReducer from './slices/entitlementsSlice';
import featureFlagsReducer from './slices/featureFlagsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    entitlements: entitlementsReducer,
    featureFlags: featureFlagsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
