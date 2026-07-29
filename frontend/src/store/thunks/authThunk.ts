// store/thunks/authThunk.ts

import { createAsyncThunk } from "@reduxjs/toolkit";

import { authService } from "@/api/services/auth.service";
import { logoutUser } from "@/store/slices/authSlice";
import { ApiError } from "@/api/requestInstance";

import type {
  LoginPayload,
  TeacherProfile,
  StudentProfile,
} from "@/types/auth.types";

import type { UserRole } from "@/router/roleRoutes";

interface LoginUserResult {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  profile: TeacherProfile | StudentProfile | null;
}

export const loginUser = createAsyncThunk<
  LoginUserResult,
  LoginPayload,
  { rejectValue: string }
>("auth/loginUser", async (payload, { rejectWithValue }) => {
  try {
    const loginResponse = await authService.login(payload);

    const { access_token, refresh_token } = loginResponse;

    const meResponse = await authService.getMe(access_token);
    const { id, email, role, is_active, profile } = meResponse;

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      userId: id,
      email,
      role: role as UserRole,
      isActive: is_active,
      profile,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue(error.message);
    }
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue("Login failed. Please try again.");
  }
});

/* ─── logoutUserThunk ────────────────────────── */

export const logoutUserThunk = createAsyncThunk(
  "auth/logoutUser",
  async (_, { dispatch }) => {
    try {
      await authService.logout();
    } catch {
      // Ignore – the session may already be invalid server-side.
    } finally {
      dispatch(logoutUser());
    }
  },
);