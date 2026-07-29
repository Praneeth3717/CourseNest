// store/slices/authSlice.ts

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { loginUser } from "@/store/thunks/authThunk";

import type { UserRole } from "@/router/roleRoutes";
import type { TeacherProfile, StudentProfile } from "@/types/auth.types";

/* ─── State ──────────────────────────────────── */

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  email: string | null;
  role: UserRole | null;
  isActive: boolean;
  profile: TeacherProfile | StudentProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  userId: null,
  email: null,
  role: null,
  isActive: false,
  profile: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

/* ─── Slice ──────────────────────────────────── */

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    /* Called by apiClient's refreshHandler after a silent token refresh. */
    setToken: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken?: string | null;
      }>,
    ) => {
      state.accessToken = action.payload.accessToken;
      // Only overwrite the refresh token when a new one is explicitly provided.
      if (action.payload.refreshToken != null) {
        state.refreshToken = action.payload.refreshToken;
      }
      state.isAuthenticated = true;
      state.error = null;
    },

    /* Full reset – called by the unauthorizedHandler and logoutUserThunk. */
    logoutUser: () => initialState,
  },

  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        const {
          accessToken,
          refreshToken,
          userId,
          email,
          role,
          isActive,
          profile,
        } = action.payload;

        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.userId = userId;
        state.email = email;
        state.role = role;
        state.isActive = isActive;
        state.profile = profile;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Login failed";
      });
  },
});

export const { setToken, logoutUser } = authSlice.actions;
export default authSlice.reducer;