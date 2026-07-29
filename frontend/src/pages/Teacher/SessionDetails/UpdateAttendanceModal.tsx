import { useEffect, useState } from "react";

import CommonModal from "@/components/CommonModal/CommonModal";
import { attendanceService } from "@/api/services/attendance.service";

import type { AttendanceStudent, AttendanceStatus } from "@/types/attendance.types";

interface UpdateAttendanceModalProps {
    isOpen: boolean;
    attendance: AttendanceStudent | null;
    onClose: () => void;
    onSuccess: () => void;
}

const UpdateAttendanceModal = ({
    isOpen,
    attendance,
    onClose,
    onSuccess,
}: UpdateAttendanceModalProps) => {
    const [status, setStatus] = useState<AttendanceStatus>("present");
    const [remarks, setRemarks] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (attendance) {
            setStatus(attendance.status);
            setRemarks(attendance.remarks || "");
        }
    }, [attendance]);

    const handleSubmit = async () => {
        if (!attendance) return;

        try {
            setLoading(true);

            await attendanceService.updateAttendance(attendance.attendance_id, {
                status,
                remarks: remarks || null,
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to update attendance.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <CommonModal
            isOpen={isOpen}
            onClose={onClose}
            title="Update Attendance"
            description="Edit the attendance status and remarks for this student."
            width="480px"
            submitButton={{
                label: loading ? "Updating…" : "Update Attendance",
                onClick: handleSubmit,
                variant: "primary",
                loading,
                disabled: loading,
            }}
        >
            {attendance && (
                <div className="flex flex-col gap-5">
                    {/* Student info */}
                    <div className="flex items-center gap-3 rounded-lg border border-[#343540] bg-[#0C0C0C] p-3">
                        {attendance.profile_image ? (
                            <img
                                src={attendance.profile_image}
                                alt={attendance.full_name}
                                className="h-10 w-10 rounded-full object-cover border border-[#343540]"
                            />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-[#10A37F]/20 text-[#10A37F] flex items-center justify-center text-sm font-semibold border border-[#10A37F]/30">
                                {attendance.full_name.charAt(0).toUpperCase()}
                            </div>
                        )}

                        <div>
                            <p className="text-sm font-semibold text-[#E1E1E1]">
                                {attendance.full_name}
                            </p>
                            <p className="text-xs text-[#E1E1E1]/50">
                                {attendance.phone || "No phone on record"}
                            </p>
                        </div>
                    </div>

                    {/* Status toggle */}
                    <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#E1E1E1]/50">
                            Status
                        </p>

                        <div className="flex gap-2">
                            {(["present", "absent"] as const).map((opt) => {
                                const active = status === opt;
                                return (
                                    <button
                                        key={opt}
                                        onClick={() => setStatus(opt)}
                                        className={`rounded-md border px-4 py-2 text-sm font-medium capitalize transition ${active
                                                ? opt === "present"
                                                    ? "border-[#10A37F] bg-[#10A37F]/20 text-[#10A37F]"
                                                    : "border-red-400 bg-red-500/20 text-red-400"
                                                : "border-[#343540] bg-[#2A2A2A] text-[#E1E1E1]/50 hover:bg-[#343540]"
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Remarks */}
                    <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#E1E1E1]/50">
                            Remarks
                        </label>

                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows={4}
                            placeholder="Add a remark (optional)"
                            className="w-full rounded-md border border-[#343540] bg-[#0C0C0C] px-3 py-2 text-sm text-[#E1E1E1] placeholder-[#E1E1E1]/30 outline-none focus:border-[#10A37F] resize-none"
                        />
                    </div>
                </div>
            )}
        </CommonModal>
    );
};

export default UpdateAttendanceModal;