import React, { useState } from "react";

import CommonModal from "@/components/CommonModal/CommonModal";

import { teacherService } from "@/api/services/teacher.service";
import type { CreateTeacherPayload } from "@/types/teacher.types";

interface CreateTeacherModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#E1E1E1]/50">
                {label}
            </label>
            {children}
        </div>
    );
}

// ─── Input styles ─────────────────────────────────────────────────────────────

const inputCls =
    "w-full h-9 rounded-md border border-[#343540] bg-[#0C0C0C] text-sm text-[#E1E1E1] " +
    "placeholder-[#E1E1E1]/30 px-3 focus:outline-none focus:ring-2 focus:ring-[#10A37F] transition";

// ─── Component ────────────────────────────────────────────────────────────────

const CreateTeacherModal: React.FC<CreateTeacherModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState<CreateTeacherPayload>({
        email: "",
        full_name: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleClose = () => {
        if (loading) return;
        setFormData({ email: "", full_name: "" });
        setError("");
        onClose();
    };

    const handleSubmit = async () => {
        setError("");

        if (!formData.full_name.trim()) {
            setError("Full name is required.");
            return;
        }
        if (!formData.email.trim()) {
            setError("Email is required.");
            return;
        }

        try {
            setLoading(true);
            await teacherService.createTeacher(formData);
            setFormData({ email: "", full_name: "" });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(
                err?.response?.detail || "Failed to create teacher."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <CommonModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Create Teacher"
            description="Add a new teacher account. An invite will be sent to their email."
            width="480px"
            submitButton={{
                label: "Create Teacher",
                onClick: handleSubmit,
                loading,
                disabled: loading,
                variant: "primary",
            }}
        >
            <div className="flex flex-col gap-4">
                {/* ── Error banner ── */}
                {error && (
                    <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        <svg
                            className="w-4 h-4 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path
                                strokeLinecap="round"
                                d="M12 8v4m0 4h.01"
                            />
                        </svg>
                        {error}
                    </div>
                )}

                {/* ── Full Name ── */}
                <Field label="Full Name">
                    <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="e.g. Jane Smith"
                        autoComplete="name"
                        disabled={loading}
                        className={`${inputCls} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    />
                </Field>

                {/* ── Email ── */}
                <Field label="Email">
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g. jane@school.edu"
                        autoComplete="email"
                        disabled={loading}
                        className={`${inputCls} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    />
                </Field>
            </div>
        </CommonModal>
    );
};

export default CreateTeacherModal;