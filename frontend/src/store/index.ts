// store/index.ts

import { configureStore, combineReducers } from "@reduxjs/toolkit";

import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

import storageRaw from "redux-persist/lib/storage";

import authReducer from "@/store/slices/authSlice";

import {
  setAuthToken,
  setRefreshHandler,
  setUnauthorizedHandler,
} from "@/api/requestInstance";

import { authService } from "@/api/services/auth.service";

const storage = (storageRaw as any).default ?? storageRaw;

const rootReducer = combineReducers({
  auth: authReducer,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

const { accessToken } = store.getState().auth;
if (accessToken) {
  setAuthToken(accessToken);
}

store.subscribe(() => {
  const token = store.getState().auth.accessToken;
  setAuthToken(token);
});

setRefreshHandler(async (): Promise<string | null> => {
  const { refreshToken } = store.getState().auth;
  if (!refreshToken) return null;

  const response = await authService.refreshToken({
    refresh_token: refreshToken,
  });

  const { access_token } = response;

  store.dispatch(
    (await import("@/store/slices/authSlice")).setToken({
      accessToken: access_token,
    }),
  );

  return access_token;
});

setUnauthorizedHandler(async () => {
  const { logoutUser } = await import("@/store/slices/authSlice");
  store.dispatch(logoutUser());
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;