import { useEffect, useState, useMemo } from "react";
import { BookOpen } from "lucide-react";

import { studentService } from "@/api/services/student.service";
import type { StudentCourseItem } from "@/types/student.types";

import { CommonTable } from "@/components/CommonTable/CommonTable";
import type {
    ColumnDef,
    SearchInputDef,
    PaginationDef,
} from "@/components/CommonTable/CommonTable";

type StatusFilter = "ACTIVE" | "COMPLETED" | undefined;

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
    { label: "All",       value: undefined   },
    { label: "Active",    value: "ACTIVE"    },
    { label: "Completed", value: "COMPLETED" },
];

// ── Single progress bar ───────────────────────────────────────────────────────

function ProgressBar({
    value,
    color,
}: {
    value: number;
    color: string;
}) {
    const clamped = Math.min(Math.max(value, 0), 100);
    return (
        <div className="flex flex-col gap-0.5 min-w-[120px]">
            <div className="flex justify-between text-[10px] text-[#E1E1E1]/40 mb-0.5">
                <span>{clamped}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#0C0C0C] overflow-hidden">
                <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${clamped}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    studentId: string;
}

export default function EnrolledCoursesTable({ studentId }: Props) {
    const [courses, setCourses]           = useState<StudentCourseItem[]>([]);
    const [loading, setLoading]           = useState(false);
    const [search, setSearch]             = useState("");
    const [page, setPage]                 = useState(1);
    const [pageSize, setPageSize]         = useState(10);
    const [totalRows, setTotalRows]       = useState(0);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const res = await studentService.getStudentCourses(studentId, {
                page,
                limit: pageSize,
                search: search || undefined,
                status_filter: statusFilter,
            });
            setCourses(res.items);
            setTotalRows(res.total);
        } catch (err) {
            console.error("Failed to fetch student courses", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCourses(); }, [studentId, page, pageSize, search, statusFilter]);

    const handleStatusTabChange = (value: StatusFilter) => {
        setStatusFilter(value);
        setPage(1);
    };

    // ── Columns ───────────────────────────────────────────────────────────────

    const columns: ColumnDef<StudentCourseItem>[] = useMemo(() => [
        {
            key: "name",
            label: "Course",
            sortable: true,
            minWidth: "min-w-[220px]",
            render: (_value, row) => (
                <div className="flex items-center gap-3">
                    {row.thumbnail ? (
                        <img
                            src={row.thumbnail}
                            alt={row.name}
                            className="h-9 w-9 rounded-lg object-cover border border-[#343540] flex-shrink-0"
                        />
                    ) : (
                        <div className="h-9 w-9 rounded-lg bg-[#10A37F]/10 border border-[#10A37F]/20 flex items-center justify-center flex-shrink-0">
                            <BookOpen size={16} className="text-[#10A37F]" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="font-medium text-[#E1E1E1] truncate">{row.name}</p>
                        <p className="text-xs text-[#E1E1E1]/40 font-mono mt-0.5">{row.code}</p>
                    </div>
                </div>
            ),
        },
        {
            key: "is_completed",
            label: "Status",
            align: "center",
            render: (_value, row) => (
                <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.is_completed
                            ? "bg-[#10A37F]/15 text-[#10A37F]"
                            : "bg-blue-500/10 text-blue-400"
                    }`}
                >
                    {row.is_completed ? "Completed" : "In Progress"}
                </span>
            ),
        },
        {
            key: "course_progress_percentage",
            label: "Course Progress",
            minWidth: "min-w-[150px]",
            render: (_value, row) => (
                <ProgressBar value={row.course_progress_percentage} color="#3b82f6" />
            ),
        },
        {
            key: "student_progress_percentage",
            label: "Attendance",
            minWidth: "min-w-[150px]",
            render: (_value, row) => (
                <ProgressBar value={row.student_progress_percentage} color="#10A37F" />
            ),
        },
        {
            key: "enrolled_at",
            label: "Enrolled On",
            minWidth: "min-w-[110px]",
            render: (value) => (
                <span className="text-xs text-[#E1E1E1]/60">
                    {new Date(value as string).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    })}
                </span>
            ),
        },
    ], []);

    const searchInputs: SearchInputDef[] = [
        {
            key: "course-search",
            placeholder: "Search courses...",
            value: search,
            onChange: (value) => { setSearch(value); setPage(1); },
        },
    ];

    const pagination: PaginationDef = {
        currentPage: page,
        pageSize,
        totalRows,
        pageSizeOptions: [10, 20, 50],
        onPageChange: setPage,
        onPageSizeChange: (size) => { setPageSize(size); setPage(1); },
    };

    return (
        <div className="mt-6">
            {/* Status tabs */}
            <div className="mb-3 flex gap-1 rounded-lg border border-[#343540] bg-[#1E1E1E] p-1 w-fit">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.label}
                        onClick={() => handleStatusTabChange(tab.value)}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition whitespace-nowrap ${
                            statusFilter === tab.value
                                ? "bg-[#10A37F] text-white shadow"
                                : "text-[#E1E1E1]/60 hover:text-[#E1E1E1] hover:bg-[#2A2A2A]"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <CommonTable<StudentCourseItem>
                title="Enrolled Courses"
                columns={columns}
                data={courses}
                rowKey={(c) => c.enrollment_id}
                loading={loading}
                searchInputs={searchInputs}
                pagination={pagination}
                emptyMessage="No courses enrolled."
                maxHeight="520px"
            />
        </div>
    );
}