import { useEffect, useState, useMemo } from "react";
import { X } from "lucide-react";

import { teacherService } from "@/api/services/teacher.service";
import type { TeacherCourseDetailed } from "@/types/teacher.types";

import { courseService } from "@/api/services/course.service";
import type { CourseDropdown } from "@/types/course.types";

import { CommonTable } from "@/components/CommonTable/CommonTable";
import CommonModal from "@/components/CommonModal/CommonModal";
import type {
    ColumnDef,
    SearchInputDef,
    PaginationDef,
    RowActionsDef,
    ActionButtonDef,
} from "@/components/CommonTable/CommonTable";

// Widen locally — backend supports all four even though the shared type
// only declares ACTIVE | COMPLETED
type CourseStatusFilter = "ACTIVE" | "COMPLETED" | "DRAFT" | "ARCHIVED";

const STATUS_TABS: { label: string; value: CourseStatusFilter | undefined }[] = [
    { label: "All", value: undefined },
    { label: "Active", value: "ACTIVE" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Draft", value: "DRAFT" },
    { label: "Archived", value: "ARCHIVED" },
];

const STATUS_STYLES: Record<string, string> = {
    ACTIVE: "bg-emerald-500/15 text-emerald-400",
    COMPLETED: "bg-blue-500/15 text-blue-400",
    DRAFT: "bg-yellow-500/15 text-yellow-400",
    ARCHIVED: "bg-[#E1E1E1]/10 text-[#E1E1E1]/40",
};

interface Props {
    teacherId: string;
}

export default function AssignedCoursesTable({ teacherId }: Props) {
    // ── Courses ───────────────────────────────────────────────────
    const [courses, setCourses] = useState<TeacherCourseDetailed[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalRows, setTotalRows] = useState(0);
    const [statusFilter, setStatusFilter] = useState<CourseStatusFilter | undefined>(undefined);

    // ── Remove ────────────────────────────────────────────────────
    const [removingCourse, setRemovingCourse] = useState<TeacherCourseDetailed | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);

    // ── Assign modal ──────────────────────────────────────────────
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [availableCourses, setAvailableCourses] = useState<CourseDropdown[]>([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [assigning, setAssigning] = useState(false);

    // ── Fetch ─────────────────────────────────────────────────────
    const fetchCourses = async () => {
        try {
            setLoading(true);
            const res = await teacherService.getTeacherCourses(teacherId, {
                page,
                limit: pageSize,
                search: search || undefined,
                // cast needed because the shared type is narrower than what
                // the backend actually accepts
                status_filter: statusFilter as "ACTIVE" | "COMPLETED" | undefined,
            });
            setCourses(res.items);
            setTotalRows(res.total);
        } catch (err) {
            console.error("Failed to fetch teacher courses", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableCourses = async () => {
        try {
            const res = await courseService.getCourseDropdown({ limit: 100 });
            setAvailableCourses(Array.isArray(res) ? res : []);
        } catch (err) {
            console.error("Failed to load course dropdown", err);
        }
    };

    useEffect(() => { fetchAvailableCourses(); }, []);
    useEffect(() => { fetchCourses(); }, [teacherId, page, pageSize, search, statusFilter]);

    // ── Handlers ──────────────────────────────────────────────────
    const handleStatusTabChange = (value: CourseStatusFilter | undefined) => {
        setStatusFilter(value);
        setPage(1);
    };

    const handleAssignCourse = async () => {
        if (!selectedCourse) return;
        try {
            setAssigning(true);
            await courseService.assignTeacher(selectedCourse, { teacher_id: teacherId });
            await fetchCourses();
            setSelectedCourse("");
            setShowAssignModal(false);
        } catch (err) {
            console.error("Failed to assign course", err);
        } finally {
            setAssigning(false);
        }
    };

    const handleRemoveConfirm = async () => {
        if (!removingCourse) return;
        try {
            setIsRemoving(true);
            await courseService.removeTeacher(removingCourse.id);
            if (courses.length === 1 && page > 1) {
                setPage((p) => p - 1);
            } else {
                await fetchCourses();
            }
            setRemovingCourse(null);
        } catch (err) {
            console.error("Failed to remove teacher from course", err);
        } finally {
            setIsRemoving(false);
        }
    };

    // ── Table config ──────────────────────────────────────────────
    const columns: ColumnDef<TeacherCourseDetailed>[] = useMemo(
        () => [
            {
                key: "name",
                label: "Course",
                sortable: true,
                minWidth: "min-w-[220px]",
                render: (_value, row) => (
                    <div className="flex items-center gap-3">
                        {/* Thumbnail */}
                        {(row as any).thumbnail ? (
                            <img
                                src={(row as any).thumbnail}
                                alt={row.name}
                                className="h-9 w-9 rounded-lg object-cover border border-[#343540] flex-shrink-0"
                            />
                        ) : (
                            <div className="h-9 w-9 rounded-lg bg-[#10A37F]/15 border border-[#10A37F]/20 flex items-center justify-center flex-shrink-0">
                                <svg
                                    className="w-4 h-4 text-[#10A37F]"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={1.8}
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                                    />
                                </svg>
                            </div>
                        )}

                        {/* Name + description */}
                        <div className="min-w-0">
                            <p className="font-medium text-[#E1E1E1] truncate">
                                {row.name}
                            </p>
                            {row.description && (
                                <p className="text-xs text-[#E1E1E1]/40 mt-0.5 truncate max-w-[260px]">
                                    {row.description}
                                </p>
                            )}
                        </div>
                    </div>
                ),
            },
            {
                key: "code",
                label: "Code",
                minWidth: "min-w-[90px]",
                render: (value) => (
                    <span className="font-mono text-xs text-[#E1E1E1]/70 bg-[#2A2A2A] px-2 py-0.5 rounded">
                        {value as string}
                    </span>
                ),
            },
            {
                key: "status",
                label: "Status",
                align: "center",
                render: (value) => {
                    const cls = STATUS_STYLES[value as string] ?? "bg-[#E1E1E1]/10 text-[#E1E1E1]/50";
                    return (
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
                            {value as string}
                        </span>
                    );
                },
            },
            {
                key: "duration_hours",
                label: "Duration",
                align: "center",
                render: (value) =>
                    value != null ? (
                        <span className="text-[#E1E1E1]/80">{value as number} hrs</span>
                    ) : (
                        <span className="text-[#E1E1E1]/30">—</span>
                    ),
            },
            {
                key: "created_at",
                label: "Assigned On",
                minWidth: "min-w-[120px]",
                render: (value) =>
                    value ? (
                        <span className="text-[#E1E1E1]/60 text-xs">
                            {new Date(value as string).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            })}
                        </span>
                    ) : (
                        <span className="text-[#E1E1E1]/30">—</span>
                    ),
            },
        ],
        []
    );

    const searchInputs: SearchInputDef[] = [
        {
            key: "course-search",
            placeholder: "Search courses...",
            value: search,
            onChange: (value) => {
                setSearch(value);
                setPage(1);
            },
        },
    ];

    const pagination: PaginationDef = {
        currentPage: page,
        pageSize,
        totalRows,
        pageSizeOptions: [10, 20, 50],
        onPageChange: setPage,
        onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
        },
    };

    const rowActions: RowActionsDef<TeacherCourseDetailed> = {
        onDelete: (course) => setRemovingCourse(course),
        delete: { label: "Remove from teacher" },
    };

    const actionButtons: ActionButtonDef[] = [
        {
            key: "assign-course",
            label: "Assign Course",
            variant: "primary",
            onClick: () => setShowAssignModal(true),
        },
    ];

    return (
        <>
            <div className="mt-6">
                {/* ── Status filter tabs ── */}
                <div className="mb-3 flex gap-1 rounded-lg border border-[#343540] bg-[#1E1E1E] p-1 w-fit">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.label}
                            onClick={() => handleStatusTabChange(tab.value)}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition whitespace-nowrap ${statusFilter === tab.value
                                    ? "bg-[#10A37F] text-white shadow"
                                    : "text-[#E1E1E1]/60 hover:text-[#E1E1E1] hover:bg-[#2A2A2A]"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <CommonTable<TeacherCourseDetailed>
                    title="Assigned Courses"
                    columns={columns}
                    data={courses}
                    rowKey={(c) => c.id}
                    loading={loading}
                    searchInputs={searchInputs}
                    actionButtons={actionButtons}
                    pagination={pagination}
                    emptyMessage="No courses assigned."
                    rowActions={rowActions}
                    maxHeight="520px"
                />
            </div>

            {/* ── Remove confirmation ── */}
            <CommonModal
                isOpen={!!removingCourse}
                onClose={() => setRemovingCourse(null)}
                title="Remove Course"
                description="This will unassign the teacher from the selected course."
                width="420px"
                submitButton={{
                    label: isRemoving ? "Removing..." : "Remove",
                    variant: "danger",
                    loading: isRemoving,
                    disabled: isRemoving,
                    onClick: handleRemoveConfirm,
                }}
            >
                <p className="text-sm text-[#E1E1E1]/80">
                    Are you sure you want to remove{" "}
                    <span className="font-semibold text-[#E1E1E1]">
                        {removingCourse?.name}
                    </span>{" "}
                    from this teacher?
                </p>
            </CommonModal>

            {/* ── Assign modal ── */}
            {showAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-xl border border-[#343540] bg-[#1E1E1E] p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[#FFFFFF]">
                                Assign Course
                            </h3>
                            <button
                                onClick={() => { setShowAssignModal(false); setSelectedCourse(""); }}
                                className="rounded-md p-1 text-[#E1E1E1]/60 transition hover:bg-[#2A2A2A] hover:text-[#E1E1E1]"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <label className="block text-xs font-medium uppercase tracking-wide text-[#E1E1E1]/50 mb-1.5">
                            Select Course
                        </label>
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="w-full rounded-md border border-[#343540] bg-[#0C0C0C] p-2.5 text-sm text-[#E1E1E1] focus:outline-none focus:ring-2 focus:ring-[#10A37F]"
                        >
                            <option value="">— Choose a course —</option>
                            {availableCourses.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.code})
                                </option>
                            ))}
                        </select>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => { setShowAssignModal(false); setSelectedCourse(""); }}
                                className="rounded-md border border-[#343540] px-4 py-2 text-sm font-medium text-[#E1E1E1] transition hover:bg-[#2A2A2A]"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!selectedCourse || assigning}
                                onClick={handleAssignCourse}
                                className="rounded-md bg-[#10A37F] px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-[#0e8f70] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {assigning ? "Assigning..." : "Assign"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}