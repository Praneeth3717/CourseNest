import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, ClipboardList } from "lucide-react";

import type { Session, SessionStatus } from "@/types/session.types";
import type { CourseStudent } from "@/types/course.types";

import { sessionService } from "@/api/services/session.service";
import { courseService } from "@/api/services/course.service";
import { attendanceService } from "@/api/services/attendance.service";

import StudentAttendanceTable from "../Tables/StudentAttendanceTable";

const STATUS_STYLES: Record<SessionStatus, string> = {
    PENDING: "border-yellow-400/30 bg-yellow-500/10 text-yellow-400",
    ACCEPTED: "border-[#10A37F]/30 bg-[#10A37F]/10 text-[#10A37F]",
    REJECTED: "border-red-400/30 bg-red-500/10 text-red-400",
    CANCELLED: "border-[#343540] bg-[#E1E1E1]/10 text-[#E1E1E1]/60",
    COMPLETED: "border-blue-400/30 bg-blue-500/10 text-blue-400",
};

const formatDateTime = (value?: string | null) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
};

const DetailItem = ({
    label,
    value,
}: {
    label: string;
    value: string | number | null | undefined;
}) => (
    <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#E1E1E1]/50">
            {label}
        </p>
        <p className="text-sm text-[#E1E1E1]">
            {value !== null && value !== undefined && value !== "" ? value : "-"}
        </p>
    </div>
);

const SessionDetails = () => {
    const navigate = useNavigate();
    const { sessionId } = useParams<{ sessionId: string }>();

    const [session, setSession] = useState<Session | null>(null);
    const [students, setStudents] = useState<CourseStudent[]>([]);

    const [responseStatus, setResponseStatus] = useState<"ACCEPTED" | "REJECTED">("ACCEPTED");
    const [responseMessage, setResponseMessage] = useState("");

    const [attendance, setAttendance] = useState<
        Record<string, { status?: "present" | "absent"; remark: string }>
    >({});

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [responding, setResponding] = useState(false);
    const [completingSession, setCompletingSession] = useState(false);

    const loadSession = async () => {
        if (!sessionId) return;

        try {
            setLoading(true);

            const sessionResponse = await sessionService.getSessionById(sessionId);
            const sessionData = sessionResponse;
            setSession(sessionData);

            const studentsResponse = await courseService.getCourseStudents(
                sessionData.course_id,
                { page: 1, limit: 100 },
            );
            setStudents(studentsResponse.items);
        } catch (err) {
            console.error(err);
            setError("Failed to load session details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSession();
    }, [sessionId]);

    const handleRespondToSession = async () => {
        if (!sessionId) return;

        try {
            setResponding(true);
            await sessionService.respondToSession(sessionId, {
                status: responseStatus,
                message: responseMessage || null,
            });
            await loadSession();
            alert(`Session ${responseStatus.toLowerCase()} successfully.`);
        } catch (error) {
            console.error(error);
            alert("Failed to respond to session.");
        } finally {
            setResponding(false);
        }
    };

    const handleCompleteSession = async () => {
        if (!sessionId) return;

        try {
            setCompletingSession(true);
            await sessionService.completeSession(sessionId);
            await loadSession();
            alert("Session marked as completed successfully.");
        } catch (error) {
            console.error(error);
            alert("Failed to complete session.");
        } finally {
            setCompletingSession(false);
        }
    };

    const updateAttendanceStatus = (enrollmentId: string, status: "present" | "absent") => {
        setAttendance((prev) => ({
            ...prev,
            [enrollmentId]: {
                ...prev[enrollmentId],
                status,
                remark: prev[enrollmentId]?.remark || "",
            },
        }));
    };

    const updateRemark = (enrollmentId: string, remark: string) => {
        setAttendance((prev) => ({
            ...prev,
            [enrollmentId]: { ...prev[enrollmentId], remark },
        }));
    };

    const handleSubmitAttendance = async () => {
        if (!sessionId) return;

        const attendanceItems = students
            .filter((s) => attendance[s.enrollment_id]?.status !== undefined)
            .map((s) => {
                const record = attendance[s.enrollment_id];
                return {
                    enrollment_id: s.enrollment_id,
                    status: record!.status!,
                    remarks: record?.remark || null,
                };
            });

        try {
            await attendanceService.markAttendance(sessionId, { attendance: attendanceItems });
            await loadSession();
            alert("Attendance submitted successfully.");
        } catch (error) {
            console.error(error);
            alert("Failed to submit attendance.");
        }
    };

    /* ── States ── */

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0C0C0C]">
                <p className="text-sm text-[#E1E1E1]/70">Loading session details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0C0C0C]">
                <p className="text-sm text-red-400">{error}</p>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0C0C0C]">
                <p className="text-sm text-[#E1E1E1]/70">Session not found.</p>
            </div>
        );
    }

    /* ── Derived ── */

    const scheduledEnd = session.scheduled_start
        ? new Date(
            new Date(session.scheduled_start).getTime() +
            session.duration_hours * 60 * 60 * 1000,
        ).toLocaleString()
        : "-";

    return (
        <div className="min-h-screen p-6 text-[#E1E1E1]">
            {/* Back */}
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 rounded-md border border-[#343540] bg-[#1E1E1E] px-4 py-2 text-sm font-medium text-[#E1E1E1] transition hover:bg-[#2A2A2A]"
            >
                <ArrowLeft size={16} />
                Back
            </button>

            {/* Hero Card */}
            <div className="rounded-xl border border-[#343540] bg-[#1E1E1E] p-6 shadow-md">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-[#FFFFFF]">
                            {session.title}
                        </h1>

                        {session.description && (
                            <p className="mt-2 text-sm text-[#E1E1E1]/70">
                                {session.description}
                            </p>
                        )}
                    </div>

                    <span
                        className={`mt-1 shrink-0 rounded-md border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[session.status] ??
                            "border-[#343540] bg-[#0C0C0C] text-[#E1E1E1]/70"
                            }`}
                    >
                        {session.status}
                    </span>
                </div>
            </div>

            {/* Details Grid */}
            <div className="mt-6 rounded-xl border border-[#343540] bg-[#1E1E1E] p-6 shadow-md">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailItem
                        label="Scheduled Start"
                        value={formatDateTime(session.scheduled_start)}
                    />
                    <DetailItem
                        label="Scheduled End (Derived)"
                        value={scheduledEnd}
                    />
                    <DetailItem
                        label="Duration"
                        value={`${session.duration_hours} hr${session.duration_hours !== 1 ? "s" : ""}`}
                    />
                    <DetailItem
                        label="Teacher Response"
                        value={session.teacher_response_message}
                    />
                    <DetailItem
                        label="Responded At"
                        value={formatDateTime(session.responded_at)}
                    />
                    <DetailItem
                        label="Created At"
                        value={formatDateTime(session.created_at)}
                    />
                </div>
            </div>

            {/* ── Action: PENDING — respond ── */}
            {session.status === "PENDING" && (
                <div className="mt-6 rounded-xl border border-[#343540] bg-[#1E1E1E] p-6 shadow-md">
                    <h2 className="text-lg font-semibold text-[#FFFFFF]">
                        Review Session Request
                    </h2>
                    <p className="mt-1 text-sm text-[#E1E1E1]/60">
                        Accept or reject this session request. You may include a message for the
                        administrator.
                    </p>

                    {/* Radio toggles */}
                    <div className="mt-5 flex gap-3">
                        {(["ACCEPTED", "REJECTED"] as const).map((opt) => {
                            const active = responseStatus === opt;
                            const isAccept = opt === "ACCEPTED";
                            return (
                                <button
                                    key={opt}
                                    onClick={() => setResponseStatus(opt)}
                                    className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition ${active
                                        ? isAccept
                                            ? "border-[#10A37F] bg-[#10A37F]/20 text-[#10A37F]"
                                            : "border-red-400 bg-red-500/20 text-red-400"
                                        : "border-[#343540] bg-[#2A2A2A] text-[#E1E1E1]/60 hover:bg-[#343540]"
                                        }`}
                                >
                                    {isAccept ? (
                                        <CheckCircle size={15} />
                                    ) : (
                                        <XCircle size={15} />
                                    )}
                                    {isAccept ? "Accept" : "Reject"}
                                </button>
                            );
                        })}
                    </div>

                    <textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        placeholder="Add a message (optional)"
                        rows={4}
                        className="mt-4 w-full rounded-md border border-[#343540] bg-[#0C0C0C] px-3 py-2 text-sm text-[#E1E1E1] placeholder-[#E1E1E1]/30 outline-none focus:border-[#10A37F] resize-none"
                    />

                    <button
                        onClick={handleRespondToSession}
                        disabled={responding}
                        className={`mt-4 flex items-center gap-2 rounded-md px-5 py-2 text-sm font-semibold text-white shadow-md transition disabled:opacity-50 ${responseStatus === "ACCEPTED"
                            ? "bg-[#10A37F] hover:bg-[#0e8f70]"
                            : "bg-red-500 hover:bg-red-600"
                            }`}
                    >
                        {responding
                            ? "Submitting…"
                            : responseStatus === "ACCEPTED"
                                ? "Accept Session"
                                : "Reject Session"}
                    </button>
                </div>
            )}

            {/* ── Action: ACCEPTED — complete session ── */}
            {session.status === "ACCEPTED" && (
                <div className="mt-6 rounded-xl border border-[#343540] bg-[#1E1E1E] p-6 shadow-md">
                    <h2 className="text-lg font-semibold text-[#FFFFFF]">
                        Ready to take attendance?
                    </h2>
                    <p className="mt-1 text-sm text-[#E1E1E1]/60">
                        Mark this session as completed to unlock attendance recording.
                    </p>

                    <button
                        onClick={handleCompleteSession}
                        disabled={completingSession}
                        className="mt-4 flex items-center gap-2 rounded-md bg-[#10A37F] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#0e8f70] disabled:opacity-50"
                    >
                        {completingSession ? "Completing…" : "Complete Session"}
                    </button>
                </div>
            )}

            {/* ── COMPLETED — attendance ── */}
            {session.status === "COMPLETED" && (
                <>
                    {!session.attendance_marked ? (
                        <div className="mt-6 rounded-xl border border-[#343540] bg-[#1E1E1E] p-6 shadow-md">
                            <div className="mb-4 flex items-center gap-2">
                                <ClipboardList size={18} className="text-[#10A37F]" />
                                <h2 className="text-lg font-semibold text-[#FFFFFF]">
                                    Mark Attendance
                                </h2>
                            </div>

                            <div className="flex flex-col gap-3">
                                {students.map((student) => (
                                    <div
                                        key={student.enrollment_id}
                                        className="flex flex-col gap-3 rounded-lg border border-[#343540] bg-[#0C0C0C] p-4 sm:flex-row sm:items-center"
                                    >
                                        {/* Student info */}
                                        <div className="flex items-center gap-3 sm:w-48 sm:shrink-0">
                                            <img
                                                src={student.profile_image || "/default-avatar.png"}
                                                alt={student.full_name}
                                                className="h-9 w-9 rounded-full border border-[#343540] object-cover"
                                            />
                                            <span className="text-sm font-medium text-[#E1E1E1]">
                                                {student.full_name}
                                            </span>
                                        </div>

                                        {/* Present / Absent */}
                                        <div className="flex gap-2">
                                            {(["present", "absent"] as const).map((opt) => {
                                                const active =
                                                    attendance[student.enrollment_id]?.status === opt;
                                                return (
                                                    <button
                                                        key={opt}
                                                        onClick={() =>
                                                            updateAttendanceStatus(
                                                                student.enrollment_id,
                                                                opt,
                                                            )
                                                        }
                                                        className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition ${active
                                                            ? opt === "present"
                                                                ? "border-[#10A37F] bg-[#10A37F]/20 text-[#10A37F]"
                                                                : "border-red-400 bg-red-500/20 text-red-400"
                                                            : "border-[#343540] bg-[#1E1E1E] text-[#E1E1E1]/50 hover:bg-[#2A2A2A]"
                                                            }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Remark */}
                                        <input
                                            type="text"
                                            placeholder="Remark (optional)"
                                            value={attendance[student.enrollment_id]?.remark || ""}
                                            onChange={(e) =>
                                                updateRemark(student.enrollment_id, e.target.value)
                                            }
                                            className="flex-1 rounded-md border border-[#343540] bg-[#1E1E1E] px-3 py-1.5 text-sm text-[#E1E1E1] placeholder-[#E1E1E1]/30 outline-none focus:border-[#10A37F]"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 flex justify-end">
                                <button
                                    onClick={handleSubmitAttendance}
                                    className="rounded-md bg-[#10A37F] px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#0e8f70]"
                                >
                                    Submit Attendance
                                </button>
                            </div>
                        </div>
                    ) : (
                        sessionId && (
                            <div className="mt-6">
                                <StudentAttendanceTable sessionId={sessionId} />
                            </div>
                        ))}
                </>
            )}
        </div>
    );
};

export default SessionDetails;