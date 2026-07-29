// pages/password/PasswordFormPage.tsx

import React, { useMemo, useState } from "react";

import {
    useLocation,
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import { authService } from "@/api/services/auth.service";
import {
    SetupPasswordResponse,
    ResetPasswordResponse,
} from "@/types/auth.types";

import AuthLayout from "@/layouts/AuthLayout";

const PasswordFormPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    const isSetupPassword = location.pathname === "/setup-password";
    const isResetPassword = location.pathname === "/reset-password";

    const config = useMemo(() => {
        if (isSetupPassword) {
            return {
                title: "Setup Password",
                subtitle:
                    "Create your account password",
                buttonText: "Set Password",
                loadingText: "Setting Password...",
            };
        }

        return {
            title: "Reset Password",
            subtitle:
                "Create a new password for your account",
            buttonText: "Reset Password",
            loadingText: "Resetting Password...",
        };
    }, [isSetupPassword]);

    const [password, setPassword] = useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    const handleSubmit = async (
        e: React.FormEvent,
    ) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!token) {
            setError("Invalid password link");
            return;
        }

        if (password.length < 6) {
            setError(
                "Password must be at least 6 characters",
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            setLoading(true);

            let response:
                | SetupPasswordResponse
                | ResetPasswordResponse;

            if (isSetupPassword) {
                response =
                    await authService.setupPassword({
                        token,
                        password,
                    });
            } else {
                response =
                    await authService.resetPassword({
                        token,
                        password,
                    });
            }

            setSuccess(
                response.message ||
                "Password updated successfully",
            );

            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (err: any) {
            setError(
                err?.message ||
                "Something went wrong",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 text-[#FFFFFF]">
                {config.title}
            </h2>

            <p className="text-sm text-[#A0A0A0] mb-6">
                {config.subtitle}
            </p>

            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-3"
            >
                <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                    className="p-2 rounded-md bg-[#0C0C0C] text-[#E1E1E1] border border-[#343540] focus:outline-none focus:ring-2 focus:ring-[#10A37F] transition text-sm"
                    required
                />

                <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) =>
                        setConfirmPassword(
                            e.target.value,
                        )
                    }
                    className="p-2 rounded-md bg-[#0C0C0C] text-[#E1E1E1] border border-[#343540] focus:outline-none focus:ring-2 focus:ring-[#10A37F] transition text-sm"
                    required
                />

                {error && (
                    <p className="text-red-500 text-xs mt-1 p-1 text-center">
                        {error}
                    </p>
                )}

                {success && (
                    <p className="text-green-500 text-xs mt-1 p-1 text-center">
                        {success}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#10A37F] hover:bg-[#0e8f70] text-white p-2 rounded-md font-medium shadow-md transition duration-300 text-sm flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading
                        ? config.loadingText
                        : config.buttonText}
                </button>
            </form>
        </AuthLayout>
    );
};

export default PasswordFormPage;