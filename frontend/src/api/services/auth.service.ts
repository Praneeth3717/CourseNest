import requestInstance from "@/api/requestInstance";
import { API_ENDPOINTS } from "@/api/apiEndpoints";

import type {
    LoginPayload,
    LoginResponse,
    LogoutResponse,
    SetupPasswordPayload,
    SetupPasswordResponse,
    RequestPasswordResetPayload,
    RequestPasswordResetResponse,
    ResetPasswordPayload,
    ResetPasswordResponse,
    ChangePasswordPayload,
    ChangePasswordResponse,
    ResendSetupEmailResponse,
    CurrentUserResponse,
    RefreshTokenPayload,
    RefreshTokenResponse,
} from "@/types/auth.types";

class AuthService {
    login(payload: LoginPayload): Promise<LoginResponse> {
        const body = new URLSearchParams({
            username: payload.username,
            password: payload.password,
        });

        return requestInstance.post<LoginResponse>(
            API_ENDPOINTS.Auth.login,
            body,
            { skipAuthRefresh: true },
        );
    }

    logout(): Promise<LogoutResponse> {
        return requestInstance.post<LogoutResponse>(API_ENDPOINTS.Auth.logout);
    }

    setupPassword(payload: SetupPasswordPayload): Promise<SetupPasswordResponse> {
        return requestInstance.post<SetupPasswordResponse>(
            API_ENDPOINTS.Auth.setupPassword,
            payload,
            { skipAuthRefresh: true },
        );
    }

    requestPasswordReset(
        payload: RequestPasswordResetPayload,
    ): Promise<RequestPasswordResetResponse> {
        return requestInstance.post<RequestPasswordResetResponse>(
            API_ENDPOINTS.Auth.requestPasswordReset,
            payload,
            { skipAuthRefresh: true },
        );
    }

    resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResponse> {
        return requestInstance.post<ResetPasswordResponse>(
            API_ENDPOINTS.Auth.resetPassword,
            payload,
            { skipAuthRefresh: true },
        );
    }

    changePassword(
        payload: ChangePasswordPayload,
    ): Promise<ChangePasswordResponse> {
        return requestInstance.post<ChangePasswordResponse>(
            API_ENDPOINTS.Auth.changePassword,
            payload,
        );
    }

    resendSetupEmail(userId: string): Promise<ResendSetupEmailResponse> {
        return requestInstance.post<ResendSetupEmailResponse>(
            API_ENDPOINTS.Auth.resendSetupEmail(userId),
        );
    }

    getMe(accessToken: string): Promise<CurrentUserResponse> {
        return requestInstance.get<CurrentUserResponse>(API_ENDPOINTS.Auth.getMe, {
            headers: { Authorization: `Bearer ${accessToken}` },
            skipAuthRefresh: true,
        });
    }

    refreshToken(payload: RefreshTokenPayload): Promise<RefreshTokenResponse> {
        return requestInstance.post<RefreshTokenResponse>(
            API_ENDPOINTS.Auth.refresh,
            payload,
            { skipAuthRefresh: true },
        );
    }
}

export const authService = new AuthService();