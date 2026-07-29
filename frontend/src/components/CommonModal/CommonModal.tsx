import React, { ReactNode, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface SubmitButtonDef {
    label: string;
    onClick: () => void;
    variant?: ButtonVariant;
    disabled?: boolean;
    loading?: boolean;
    icon?: ReactNode;
}

interface CommonModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;         // optional subtitle under the title
    children: ReactNode;
    width?: string;               // e.g. "500px" | "600px" | "80vw"
    maxHeight?: string;           // e.g. "80vh" — caps body scroll area
    submitButton?: SubmitButtonDef;
    extraFooterLeft?: ReactNode;  // badges, notes, links on the left of the footer
    closeOnOverlayClick?: boolean;
    /** Hides the footer entirely — useful for read-only/info modals */
    hideFooter?: boolean;
}

// ─── Variant Styles ───────────────────────────────────────────────────────────

const variantStyles: Record<ButtonVariant, string> = {
    primary:
        "bg-[#10A37F] hover:bg-[#0e8f70] text-white border border-[#10A37F] focus:ring-[#10A37F]/40",
    secondary:
        "bg-transparent hover:bg-[#2A2A2A] text-[#E1E1E1] border border-[#343540] focus:ring-[#343540]",
    danger:
        "bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/40 hover:text-red-300 focus:ring-red-500/30",
    ghost:
        "bg-transparent hover:bg-[#2A2A2A] text-[#E1E1E1]/70 border border-transparent hover:text-[#E1E1E1] focus:ring-[#343540]",
};

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
    return (
        <svg
            className="animate-spin w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
        </svg>
    );
}

// ─── CommonModal ──────────────────────────────────────────────────────────────

const CommonModal: React.FC<CommonModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    width = "500px",
    maxHeight = "85vh",
    submitButton,
    extraFooterLeft,
    closeOnOverlayClick = true,
    hideFooter = false,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Keyboard: Escape to close
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Lock body scroll while open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Focus trap: on open, focus the modal container
    useEffect(() => {
        if (isOpen) {
            modalRef.current?.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const showFooter =
        !hideFooter && (submitButton || extraFooterLeft);

    return (
        // ── Overlay ──
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
            onClick={closeOnOverlayClick ? onClose : undefined}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
        >
            {/* ── Panel ── */}
            <div
                ref={modalRef}
                tabIndex={-1}
                className="
                    flex flex-col w-full
                    bg-[#1E1E1E] rounded-xl border border-[#343540]
                    shadow-2xl outline-none
                    overflow-hidden
                "
                style={{ maxWidth: width, maxHeight }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#343540] bg-[#161616] flex-shrink-0">
                    <div className="min-w-0">
                        {title && (
                            <h2
                                id="modal-title"
                                className="text-base font-semibold text-[#E1E1E1] leading-snug"
                            >
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="mt-0.5 text-xs text-[#E1E1E1]/50 leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Close (✕) button — top-right */}
                    <button
                        onClick={onClose}
                        aria-label="Close modal"
                        className="
                            flex-shrink-0 flex items-center justify-center
                            w-7 h-7 rounded-md
                            text-[#E1E1E1]/50 hover:text-[#E1E1E1]
                            border border-transparent hover:border-[#343540]
                            hover:bg-[#2A2A2A]
                            transition-colors duration-150
                            focus:outline-none focus:ring-2 focus:ring-[#10A37F]/40
                        "
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto px-5 py-5 text-[#E1E1E1]/80 text-sm leading-relaxed">
                    {children}
                </div>

                {/* ── Footer ── */}
                {showFooter && (
                    <div className="
                        flex items-center justify-between gap-3
                        px-5 py-3
                        border-t border-[#343540] bg-[#161616]
                        flex-shrink-0
                    ">
                        {/* Left slot: optional note / badge / secondary action */}
                        <div className="flex items-center gap-2 text-sm text-[#E1E1E1]/50 min-w-0">
                            {extraFooterLeft ?? null}
                        </div>

                        {/* Right: Cancel + Submit */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Cancel always lives next to Submit */}
                            <button
                                onClick={onClose}
                                className="
                                    inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium
                                    bg-transparent hover:bg-[#2A2A2A] text-[#E1E1E1] border border-[#343540]
                                    focus:outline-none focus:ring-2 focus:ring-[#343540]
                                    transition-colors duration-200 cursor-pointer
                                "
                            >
                                Cancel
                            </button>

                            {submitButton && (
                                <button
                                    onClick={submitButton.onClick}
                                    disabled={submitButton.disabled || submitButton.loading}
                                    className={`
                                        inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium
                                        focus:outline-none focus:ring-2 transition-colors duration-200
                                        ${variantStyles[submitButton.variant ?? "primary"]}
                                        ${submitButton.disabled || submitButton.loading
                                            ? "opacity-40 cursor-not-allowed"
                                            : "cursor-pointer"
                                        }
                                    `}
                                >
                                    {submitButton.loading ? (
                                        <Spinner />
                                    ) : submitButton.icon ? (
                                        <span className="w-3.5 h-3.5">{submitButton.icon}</span>
                                    ) : null}
                                    {submitButton.label}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommonModal;

export type { CommonModalProps, SubmitButtonDef, ButtonVariant };