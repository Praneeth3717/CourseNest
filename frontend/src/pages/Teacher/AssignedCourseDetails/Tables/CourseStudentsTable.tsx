import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { courseService } from "@/api/services/course.service";
import { CommonTable } from "@/components/CommonTable/CommonTable";

import type {
    ColumnDef,
    SearchInputDef,
    PaginationDef,
} from "@/components/CommonTable/CommonTable";

import type { CourseStudent } from "@/types/course.types";

interface CourseStudentsTableProps {
    courseId: string;
}

const STATUS_STYLES: Record<string, string> = {
    completed: "border-[#10A37F]/30 bg-[#10A37F]/10 text-[#10A37F]",
    in_progress: "border-yellow-400/30 bg-yellow-500/10 text-yellow-400",
};

export default function CourseStudentsTable({ courseId }: CourseStudentsTableProps) {
    const navigate = useNavigate();

    const [students, setStudents] = useState<CourseStudent[]>([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    async function fetchStudents() {
        try {
            setLoading(true);

            const response = await courseService.getCourseStudents(courseId, {
                page,
                limit: pageSize,
                search: search || undefined,
            });

            setStudents(response.items);
            setTotalRows(response.total);
        } catch (error) {
            console.error("Failed to fetch course students", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setPage(1);
    }, [search]);

    useEffect(() => {
        fetchStudents();
    }, [courseId, page, search]);

    const columns: ColumnDef<CourseStudent>[] = useMemo(
        () => [
            {
                key: "full_name",
                label: "Student",
                sortable: true,
                minWidth: "min-w-[220px]",
                render: (_, row) => (
                    <div className="flex items-center gap-3">
                        {row.profile_image ? (
                            <img
                                src={row.profile_image}
                                alt={row.full_name}
                                className="w-9 h-9 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-[#10A37F]/20 text-[#10A37F] flex items-center justify-center text-sm font-semibold">
                                {row.full_name.charAt(0).toUpperCase()}
                            </div>
                        )}

                        <button
                            onClick={() => navigate(`/admin/students/${row.student_id}`)}
                            className="font-medium text-left text-[#E1E1E1] hover:underline transition-all"
                        >
                            {row.full_name}
                        </button>
                    </div>
                ),
            },

            {
                key: "phone",
                label: "Phone",
                minWidth: "min-w-[140px]",
                render: (value) => (value as string | null) || "—",
            },

            {
                key: "progress_percentage",
                label: "Progress",
                align: "center",
                minWidth: "min-w-[160px]",
                render: (_, row) => (
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#343540]">
                            <div
                                className="h-full rounded-full bg-[#10A37F] transition-all duration-300"
                                style={{ width: `${row.progress_percentage}%` }}
                            />
                        </div>
                        <span className="text-xs text-[#E1E1E1]/70">
                            {row.progress_percentage}%
                        </span>
                    </div>
                ),
            },

            {
                key: "is_completed",
                label: "Status",
                align: "center",
                render: (_, row) => {
                    const key = row.is_completed ? "completed" : "in_progress";
                    return (
                        <span
                            className={`rounded-md border px-2 py-1 text-xs font-medium ${STATUS_STYLES[key]}`}
                        >
                            {row.is_completed ? "Completed" : "In Progress"}
                        </span>
                    );
                },
            },

            {
                key: "enrolled_at",
                label: "Enrolled On",
                minWidth: "min-w-[130px]",
                render: (value) =>
                    value ? new Date(value as string).toLocaleDateString() : "—",
            },
        ],
        []
    );

    const searchInputs: SearchInputDef[] = [
        {
            key: "student-search",
            placeholder: "Search student...",
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
        onPageSizeChange: () => { },  // fixed page size for course context
    };

    return (
        <CommonTable<CourseStudent>
            title="Enrolled Students"
            columns={columns}
            data={students}
            rowKey={(student) => student.enrollment_id}
            loading={loading}
            searchInputs={searchInputs}
            pagination={pagination}
            emptyMessage="No students enrolled in this course yet."
            maxHeight="600px"
        />
    );
}