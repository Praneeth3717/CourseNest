import { useEffect, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";

import CommonModal from "@/components/CommonModal/CommonModal";
import { sessionService } from "@/api/services/session.service";

import type { Session, CreateSessionPayload } from "@/types/session.types";

interface SessionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
    onSuccess: () => void;
    session?: Session | null;
}

function toDatetimeLocal(iso: string): string {
    return iso.slice(0, 16);
}

const EMPTY_FORM: CreateSessionPayload = {
    title: "",
    description: "",
    scheduled_start: "",
    duration_hours: 1,
};

const inputCls =
    "w-full h-9 rounded-md border border-[#343540] bg-[#0C0C0C] px-3 text-sm text-[#E1E1E1] placeholder-[#E1E1E1]/30 focus:outline-none focus:ring-2 focus:ring-[#10A37F] transition";

const labelCls =
    "block mb-1.5 text-xs font-medium uppercase tracking-wide text-[#E1E1E1]/50";

export default function SessionFormModal({
    isOpen,
    onClose,
    courseId,
    onSuccess,
    session = null,
}: SessionFormModalProps) {
    const isEdit = !!session;

    const [formData, setFormData] = useState<CreateSessionPayload>(EMPTY_FORM);
    const [errors, setErrors] = useState<Partial<Record<keyof CreateSessionPayload, string>>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (session) {
                setFormData({
                    title: session.title,
                    description: session.description ?? "",
                    scheduled_start: toDatetimeLocal(session.scheduled_start),
                    duration_hours: session.duration_hours,
                });
            } else {
                setFormData(EMPTY_FORM);
            }
            setErrors({});
        }
    }, [isOpen, session]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "duration_hours" ? Number(value) : value,
        }));
        if (errors[name as keyof CreateSessionPayload]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    }

    function validate(): boolean {
        const next: Partial<Record<keyof CreateSessionPayload, string>> = {};
        if (!formData.title.trim())
            next.title = "Title is required.";
        if (!formData.scheduled_start)
            next.scheduled_start = "Start time is required.";
        if (!formData.duration_hours || formData.duration_hours <= 0)
            next.duration_hours = "Duration must be greater than 0.";
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    function resetAndClose() {
        setFormData(EMPTY_FORM);
        setErrors({});
        onClose();
    }

    async function handleSubmit() {
        if (!validate()) return;
        try {
            setLoading(true);
            if (isEdit && session) {
                await sessionService.updateSession(session.id, {
                    title: formData.title.trim(),
                    description: formData.description?.trim() || null,
                    scheduled_start: formData.scheduled_start,
                    duration_hours: formData.duration_hours,
                });
            } else {
                await sessionService.createSession(courseId, {
                    title: formData.title.trim(),
                    description: formData.description?.trim() || null,
                    scheduled_start: formData.scheduled_start,
                    duration_hours: formData.duration_hours,
                });
            }
            onSuccess();
            resetAndClose();
        } catch (error) {
            console.error(`Failed to ${isEdit ? "update" : "create"} session`, error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <CommonModal
            isOpen={isOpen}
            onClose={resetAndClose}
            title={isEdit ? "Edit Class" : "Add Class"}
            description={
                isEdit
                    ? "Update the details for this class session."
                    : "Schedule a new class session for this course."
            }
            width="600px"
            submitButton={{
                label: loading ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save Changes" : "Create Class"),
                variant: "primary",
                loading: loading,
                disabled: loading,
                onClick: handleSubmit,
            }}
        >
            <div className="flex flex-col gap-5">

                {/* Title */}
                <div>
                    <label className={labelCls}>
                        Class Title <span className="text-red-400 normal-case">*</span>
                    </label>
                    <input
                        name="title"
                        placeholder="e.g. Introduction to Algebra"
                        value={formData.title}
                        onChange={handleChange}
                        className={inputCls}
                    />
                    {errors.title && (
                        <p className="mt-1 text-xs text-red-400">{errors.title}</p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className={labelCls}>
                        Description{" "}
                        <span className="normal-case text-[#E1E1E1]/30">(optional)</span>
                    </label>
                    <textarea
                        name="description"
                        placeholder="What will be covered in this class..."
                        rows={3}
                        value={formData.description ?? ""}
                        onChange={handleChange}
                        className={`${inputCls} h-auto resize-none py-2`}
                    />
                </div>

                {/* Start Time + Duration */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <label className={labelCls}>
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays size={11} />
                                Start Time <span className="text-red-400">*</span>
                            </span>
                        </label>
                        <input
                            type="datetime-local"
                            name="scheduled_start"
                            value={formData.scheduled_start}
                            onChange={handleChange}
                            className={`${inputCls} [color-scheme:dark]`}
                        />
                        {errors.scheduled_start && (
                            <p className="mt-1 text-xs text-red-400">{errors.scheduled_start}</p>
                        )}
                    </div>

                    <div>
                        <label className={labelCls}>
                            <span className="inline-flex items-center gap-1.5">
                                <Clock size={11} />
                                Duration (hours) <span className="text-red-400">*</span>
                            </span>
                        </label>
                        <input
                            type="number"
                            name="duration_hours"
                            min={0.5}
                            step={0.5}
                            value={formData.duration_hours}
                            onChange={handleChange}
                            className={inputCls}
                        />
                        {errors.duration_hours && (
                            <p className="mt-1 text-xs text-red-400">{errors.duration_hours}</p>
                        )}
                    </div>
                </div>

            </div>
        </CommonModal>
    );
}