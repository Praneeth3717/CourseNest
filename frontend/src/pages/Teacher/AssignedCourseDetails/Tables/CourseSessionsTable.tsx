import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { sessionService } from "@/api/services/session.service";
import { CommonTable } from "@/components/CommonTable/CommonTable";
import CommonModal from "@/components/CommonModal/CommonModal";
import SessionFormModal from "@/pages/admin/Courses/SessionFormModal";

import { useAppSelector } from "@/store/hooks";

import type {
    ColumnDef,
    SearchInputDef,
    PaginationDef,
    ActionButtonDef,
    RowActionsDef,
    ExtraHeaderElementDef,
} from "@/components/CommonTable/CommonTable";

import type { Session, SessionStatus } from "@/types/session.types";

// ─── Constants ────────────────────────────────────────────────────────────────

interface CourseSessionsTableProps {
    courseId: string;
}

const STATUS_OPTIONS: { label: string; value: SessionStatus }[] = [
    { label: "Pending", value: "PENDING" },
    { label: "Accepted", value: "ACCEPTED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "Completed", value: "COMPLETED" },
];

const STATUS_STYLES: Record<SessionStatus, string> = {
    PENDING: "border-yellow-400/30 bg-yellow-500/10 text-yellow-400",
    ACCEPTED: "border-[#10A37F]/30 bg-[#10A37F]/10 text-[#10A37F]",
    REJECTED: "border-red-400/30 bg-red-500/10 text-red-400",
    CANCELLED: "border-[#343540] bg-[#E1E1E1]/10 text-[#E1E1E1]/50",
    COMPLETED: "border-blue-400/30 bg-blue-500/10 text-blue-400",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CourseSessionsTable({ courseId }: CourseSessionsTableProps) {
    const navigate = useNavigate();
    const role = useAppSelector((state) => state.auth.role);

    const isAdmin = role === "Admin";
    const isTeacher = role === "Teacher";

    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<SessionStatus | "">("");

    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    // ── Modals ────────────────────────────────────────────────────────────────
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const [deletingSession, setDeletingSession] = useState<Session | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // ── Teacher respond modal ─────────────────────────────────────────────────
    const [respondingSession, setRespondingSession] = useState<Session | null>(null);
    const [respondAction, setRespondAction] = useState<"ACCEPTED" | "REJECTED" | null>(null);
    const [responseMessage, setResponseMessage] = useState("");
    const [isResponding, setIsResponding] = useState(false);

    // ─── Fetch ────────────────────────────────────────────────────────────────

    async function fetchSessions() {
        try {
            setLoading(true);
            const response = await sessionService.getCourseSessions(courseId, {
                page,
                limit: pageSize,
                search: search || undefined,
                status_filter: statusFilter || undefined,
            });
            setSessions(response.items);
            setTotalRows(response.total);
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { setPage(1); }, [search, statusFilter]);
    useEffect(() => { fetchSessions(); }, [courseId, page, search, statusFilter]);

    // ─── Admin: Delete ────────────────────────────────────────────────────────

    async function handleDeleteConfirm() {
        if (!deletingSession) return;
        try {
            setIsDeleting(true);
            await sessionService.deleteSession(deletingSession.id);
            if (sessions.length === 1 && page > 1) {
                setPage((p) => p - 1);
            } else {
                fetchSessions();
            }
            setDeletingSession(null);
        } catch (error) {
            console.error("Failed to delete session", error);
        } finally {
            setIsDeleting(false);
        }
    }

    // ─── Teacher: Respond ─────────────────────────────────────────────────────

    function openRespondModal(session: Session, action: "ACCEPTED" | "REJECTED") {
        setRespondingSession(session);
        setRespondAction(action);
        setResponseMessage("");
    }

    async function handleRespondConfirm() {
        if (!respondingSession || !respondAction) return;
        try {
            setIsResponding(true);
            await sessionService.respondToSession(respondingSession.id, {
                status: respondAction,
                message: responseMessage || null,
            });
            fetchSessions();
            setRespondingSession(null);
            setRespondAction(null);
        } catch (error) {
            console.error("Failed to respond to session", error);
        } finally {
            setIsResponding(false);
        }
    }

    // ─── Teacher: Complete ────────────────────────────────────────────────────

    async function handleCompleteSession(session: Session) {
        if (!window.confirm(`Mark "${session.title}" as completed?`)) return;
        try {
            await sessionService.completeSession(session.id);
            fetchSessions();
        } catch (error) {
            console.error("Failed to complete session", error);
        }
    }

    // ─── Columns ──────────────────────────────────────────────────────────────

    const columns: ColumnDef<Session>[] = useMemo(
        () => [
            {
                key: "title",
                label: "Title",
                sortable: true,
                minWidth: "min-w-[180px]",
                render: (_, row) => (
                    <button
                        onClick={() => navigate(`/courses/${courseId}/sessions/${row.id}`)}
                        className="font-medium text-left text-[#E1E1E1] hover:underline transition-all"
                    >
                        {row.title}
                    </button>
                ),
            },
            {
                key: "description",
                label: "Description",
                minWidth: "min-w-[200px]",
                render: (_, row) => {
                    const desc = row.description ?? "";
                    return (
                        <span className="text-[#E1E1E1]/70">
                            {desc.length > 80 ? `${desc.slice(0, 80)}…` : desc || "—"}
                        </span>
                    );
                },
            },
            {
                key: "scheduled_start",
                label: "Start",
                minWidth: "min-w-[160px]",
                render: (value) =>
                    value ? new Date(value as string).toLocaleString() : "—",
            },
            {
                key: "duration_hours",
                label: "Duration",
                align: "center",
                render: (_, row) =>
                    `${row.duration_hours} hr${row.duration_hours !== 1 ? "s" : ""}`,
            },
            {
                key: "attendance_marked",
                label: "Attendance",
                align: "center",
                render: (_, row) =>
                    row.attendance_marked ? (
                        <span className="rounded-md border border-[#10A37F]/30 bg-[#10A37F]/10 text-[#10A37F] px-2 py-1 text-xs font-medium">
                            Marked
                        </span>
                    ) : (
                        <span className="rounded-md border border-[#343540] bg-[#E1E1E1]/5 text-[#E1E1E1]/40 px-2 py-1 text-xs font-medium">
                            Pending
                        </span>
                    ),
            },
            {
                key: "status",
                label: "Status",
                align: "center",
                render: (_, row) => (
                    <span
                        className={`rounded-md border px-2 py-1 text-xs font-medium ${STATUS_STYLES[row.status] ?? "border-[#343540] text-[#E1E1E1]/50"}`}
                    >
                        {row.status}
                    </span>
                ),
            },
        ],
        [courseId]
    );

    // ─── Search + Status filter ───────────────────────────────────────────────

    const searchInputs: SearchInputDef[] = [
        {
            key: "session-search",
            placeholder: "Search sessions...",
            value: search,
            onChange: (value) => { setSearch(value); setPage(1); },
        },
    ];

    const extraHeaderElements: ExtraHeaderElementDef[] = [
        {
            key: "status-filter",
            position: "center",
            element: (
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value as SessionStatus | "");
                        setPage(1);
                    }}
                    className="h-8 rounded-md border border-[#343540] bg-[#0C0C0C] text-sm text-[#E1E1E1] px-3 focus:outline-none focus:ring-2 focus:ring-[#10A37F] transition"
                >
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            ),
        },
    ];

    // ─── Action Buttons ───────────────────────────────────────────────────────

    const actionButtons: ActionButtonDef[] = isAdmin
        ? [{ key: "add-session", label: "Add Class", variant: "primary", onClick: () => setShowCreateModal(true) }]
        : [];

    // ─── Pagination ───────────────────────────────────────────────────────────

    const pagination: PaginationDef = {
        currentPage: page,
        pageSize,
        totalRows,
        pageSizeOptions: [10, 20, 50],
        onPageChange: setPage,
        onPageSizeChange: () => { },
    };

    // ─── Row Actions ──────────────────────────────────────────────────────────

    const rowActions: RowActionsDef<Session> = isAdmin
        ? {
            onEdit: (session) => setEditingSession(session),
            onDelete: (session) => setDeletingSession(session),
            edit: { label: "Edit session" },
            delete: { label: "Delete session" },
        }
        : {
            custom: (session) => {
                const actions: ActionButtonDef[] = [];

                if (session.status === "PENDING") {
                    actions.push({
                        key: "accept", label: "Accept", variant: "primary",
                        icon: (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        ),
                        onClick: () => openRespondModal(session, "ACCEPTED"),
                    });
                    actions.push({
                        key: "reject", label: "Reject", variant: "danger",
                        icon: (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ),
                        onClick: () => openRespondModal(session, "REJECTED"),
                    });
                }

                if (session.status === "ACCEPTED") {
                    actions.push({
                        key: "complete", label: "Mark Complete", variant: "secondary",
                        icon: (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ),
                        onClick: () => handleCompleteSession(session),
                    });
                }

                return actions;
            },
            align: "right",
            header: "Actions",
        };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <CommonTable<Session>
                title="Classes"
                columns={columns}
                data={sessions}
                rowKey={(s) => s.id}
                loading={loading}
                searchInputs={searchInputs}
                extraHeaderElements={extraHeaderElements}
                actionButtons={actionButtons}
                pagination={pagination}
                rowActions={rowActions}
                emptyMessage="No classes scheduled yet."
                maxHeight="600px"
            />

            {/* ── Admin modals ── */}
            {isAdmin && (
                <>
                    {/* Create */}
                    <SessionFormModal
                        isOpen={showCreateModal}
                        onClose={() => setShowCreateModal(false)}
                        courseId={courseId}
                        onSuccess={fetchSessions}
                    />

                    {/* Edit */}
                    <SessionFormModal
                        isOpen={!!editingSession}
                        onClose={() => setEditingSession(null)}
                        courseId={courseId}
                        session={editingSession}
                        onSuccess={fetchSessions}
                    />

                    {/* Delete */}
                    <CommonModal
                        isOpen={!!deletingSession}
                        onClose={() => setDeletingSession(null)}
                        title="Delete Class"
                        description="This action cannot be undone."
                        width="420px"
                        submitButton={{
                            label: isDeleting ? "Deleting..." : "Delete",
                            variant: "danger",
                            loading: isDeleting,
                            disabled: isDeleting,
                            onClick: handleDeleteConfirm,
                        }}
                    >
                        <p className="text-sm text-[#E1E1E1]/80">
                            Are you sure you want to delete{" "}
                            <span className="font-medium text-[#E1E1E1]">
                                {deletingSession?.title}
                            </span>
                            ? All associated attendance records may be permanently removed.
                        </p>
                    </CommonModal>
                </>
            )}

            {/* ── Teacher: Respond modal ── */}
            {isTeacher && (
                <CommonModal
                    isOpen={!!respondingSession && !!respondAction}
                    onClose={() => { setRespondingSession(null); setRespondAction(null); }}
                    title={respondAction === "ACCEPTED" ? "Accept Class" : "Reject Class"}
                    description={
                        respondAction === "ACCEPTED"
                            ? "Confirm that you will conduct this class."
                            : "Let the admin know why you're rejecting this class."
                    }
                    width="460px"
                    submitButton={{
                        label: isResponding ? "Submitting..." : respondAction === "ACCEPTED" ? "Accept" : "Reject",
                        variant: respondAction === "ACCEPTED" ? "primary" : "danger",
                        loading: isResponding,
                        disabled: isResponding,
                        onClick: handleRespondConfirm,
                    }}
                >
                    <div className="flex flex-col gap-4">
                        <div className="rounded-lg border border-[#343540] bg-[#0C0C0C] px-4 py-3 text-sm">
                            <p className="font-medium text-[#E1E1E1]">
                                {respondingSession?.title}
                            </p>
                            <p className="mt-1 text-xs text-[#E1E1E1]/50">
                                {respondingSession?.scheduled_start
                                    ? new Date(respondingSession.scheduled_start).toLocaleString()
                                    : "—"}
                                {" · "}
                                {respondingSession?.duration_hours} hr
                                {respondingSession?.duration_hours !== 1 ? "s" : ""}
                            </p>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium uppercase tracking-wide text-[#E1E1E1]/50">
                                Message{" "}
                                <span className="normal-case text-[#E1E1E1]/30">(optional)</span>
                            </label>
                            <textarea
                                rows={3}
                                value={responseMessage}
                                onChange={(e) => setResponseMessage(e.target.value)}
                                placeholder={
                                    respondAction === "ACCEPTED"
                                        ? "Any notes for the admin..."
                                        : "Reason for rejection..."
                                }
                                className="w-full resize-none rounded-md border border-[#343540] bg-[#0C0C0C] px-3 py-2 text-sm text-[#E1E1E1] placeholder-[#E1E1E1]/30 focus:outline-none focus:ring-2 focus:ring-[#10A37F] transition"
                            />
                        </div>
                    </div>
                </CommonModal>
            )}
        </>
    );
}