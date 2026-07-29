// types/auth.types.ts

export interface LoginPayload {
    username: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: "bearer";
}

export interface LogoutResponse {
    message: string;
}

export interface SetupPasswordPayload {
    token: string;
    password: string;
}

export interface SetupPasswordResponse {
    message: string;
}

export interface RequestPasswordResetPayload {
    email: string;
}

export interface RequestPasswordResetResponse {
    message: string;
}

export interface ResetPasswordPayload {
    token: string;
    password: string;
}

export interface ResetPasswordResponse {
    message: string;
}

export interface ChangePasswordPayload {
    current_password: string;
    new_password: string;
}

export interface ChangePasswordResponse {
    message: string;
}

export interface ResendSetupEmailResponse {
    message: string;
}

export type Gender =
    | "MALE"
    | "FEMALE"
    | "OTHER";

export interface TeacherProfile {
    id: string;
    user_id: string;
    full_name: string;
    phone: string | null;
    dob: string | null;
    gender: Gender | null;
    specialization: string | null;
    qualification: string | null;
    experience_years: number | null;
    address: string | null;
    profile_image: string | null;
    created_at: string;
}

export interface StudentProfile {
    id: string;
    user_id: string;
    full_name: string;
    phone: string | null;
    dob: string | null;
    gender: Gender | null;
    address: string | null;
    profile_image: string | null;
    created_at: string;
}

/* Matches CurrentUserResponse in app/schemas/auth.py — flat, no wrapper. */
export interface CurrentUserResponse {
    id: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
    profile: TeacherProfile | StudentProfile | null;
}

export interface RefreshTokenPayload {
    refresh_token: string;
}

export interface RefreshTokenResponse {
    access_token: string;
    token_type: "bearer";
}