// pages/login/Login.tsx

import React, { useState } from "react";
import { loginUser } from "@/store/thunks/authThunk";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { authService } from "@/api/services/auth.service";
import AuthLayout from "@/layouts/AuthLayout";

const Login: React.FC = () => {
    const [username, setUsername] = useState("praneethchandupatla@gmail.com");
    const [password, setPassword] = useState("");
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState("");
    const [resetError, setResetError] = useState("");

    const dispatch = useAppDispatch();

    const { loading, error } = useAppSelector(
        (state) => state.auth,
    );

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username.trim() || !password.trim()) {
            alert("Enter username & password");
            return;
        }

        try {
            const result = await dispatch(
                loginUser({
                    username,
                    password,
                }),
            ).unwrap();

            console.log("Login Success:", result);
        } catch (error) {
            console.error("Login Error:", error);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        setResetError("");
        setResetMessage("");

        if (!email.trim()) {
            setResetError("Please enter your email");
            return;
        }

        try {
            setResetLoading(true);

            const response = await authService.requestPasswordReset({
                email,
            });

            setResetMessage(response.message);
            setEmail("");
        } catch (err: any) {
            setResetError(
                err.message || "Failed to send reset link",
            );
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <AuthLayout>
            {!showForgotPassword ? (
                <>
                    <h2 className="text-lg sm:text-xl font-semibold mb-4 text-[#FFFFFF]">
                        Welcome Back, Friend...!
                    </h2>

                    <form
                        onSubmit={handleLogin}
                        className="flex flex-col gap-3"
                    >
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
                            }
                            className="p-2 rounded-md bg-[#0C0C0C] text-[#E1E1E1] border border-[#343540] focus:outline-none focus:ring-2 focus:ring-[#10A37F] transition text-sm"
                            required
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            className="p-2 rounded-md bg-[#0C0C0C] text-[#E1E1E1] border border-[#343540] focus:outline-none focus:ring-2 focus:ring-[#10A37F] transition text-sm"
                            required
                        />

                        {error && (
                            <p className="text-red-500 text-xs mt-1 p-1 text-center">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#10A37F] hover:bg-[#0e8f70] text-white p-2 rounded-md font-medium shadow-md transition duration-300 text-sm flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading
                                ? "Logging in..."
                                : "Sign In"}
                        </button>
                    </form>

                    <p className="mt-4 text-xs text-[#E1E1E1] text-center">
                        Forgot your credentials?
                        <button
                            type="button"
                            onClick={() => {
                                setShowForgotPassword(
                                    true,
                                );
                                setResetError("");
                                setResetMessage("");
                            }}
                            className="text-[#10A37F] hover:underline font-medium ml-1 transition"
                        >
                            Reset Password
                        </button>
                    </p>
                </>
            ) : (
                <>
                    <h2 className="text-lg sm:text-xl font-semibold mb-4 text-[#FFFFFF]">
                        Forgot Password
                    </h2>

                    <form
                        onSubmit={
                            handleForgotPassword
                        }
                        className="flex flex-col gap-3"
                    >
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) =>
                                setEmail(
                                    e.target.value,
                                )
                            }
                            className="p-2 rounded-md bg-[#0C0C0C] text-[#E1E1E1] border border-[#343540] focus:outline-none focus:ring-2 focus:ring-[#10A37F] transition text-sm"
                            required
                        />

                        {resetError && (
                            <p className="text-red-500 text-xs mt-1 p-1 text-center">
                                {resetError}
                            </p>
                        )}

                        {resetMessage && (
                            <p className="text-green-500 text-xs mt-1 p-1 text-center">
                                {resetMessage}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={
                                resetLoading
                            }
                            className="bg-[#10A37F] hover:bg-[#0e8f70] text-white p-2 rounded-md font-medium shadow-md transition duration-300 text-sm flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {resetLoading
                                ? "Sending..."
                                : "Send Reset Link"}
                        </button>
                    </form>

                    <p className="mt-4 text-xs text-[#E1E1E1] text-center">
                        Remembered your account?
                        <button
                            type="button"
                            onClick={() => {
                                setShowForgotPassword(
                                    false,
                                );
                                setResetError("");
                                setResetMessage("");
                            }}
                            className="text-[#10A37F] hover:underline font-medium ml-1 transition"
                        >
                            Back to Login
                        </button>
                    </p>
                </>
            )}
        </AuthLayout>
    );
};

export default Login;