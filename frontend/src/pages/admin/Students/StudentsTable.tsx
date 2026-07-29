import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { studentService } from "@/api/services/student.service";

import { CommonTable } from "@/components/CommonTable/CommonTable";
import CreateStudentModal from "@/pages/admin/Students/CreateStudentModal";
import CommonModal from "@/components/CommonModal/CommonModal";

import type {
    ColumnDef,
    SearchInputDef,
    PaginationDef,
    ActionButtonDef,
    RowActionsDef,
} from "@/components/CommonTable/CommonTable";

import type {
    Student,
    GetStudentsResponse,
} from "@/types/student.types";

interface StudentsTableProps {
    onStudentClick?: (student: Student) => void;
}

export default function StudentsTable({
    onStudentClick,
}: StudentsTableProps) {
    const navigate = useNavigate();

    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [totalRows, setTotalRows] = useState(0);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    async function fetchStudents() {
        try {
            setLoading(true);

            const response: GetStudentsResponse =
                await studentService.getStudents({
                    page,
                    limit: pageSize,
                    search: search || undefined,
                });

            setStudents(response.items);
            setTotalRows(response.total);
        } catch (error) {
            console.error("Failed to fetch students", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchStudents();
    }, [page, pageSize, search]);

    async function handleDeleteConfirm() {
        if (!deletingStudent) return;

        try {
            setIsDeleting(true);
            await studentService.deleteStudent(deletingStudent.id);

            // If we deleted the last row on this page (and not page 1), go back a page
            if (students.length === 1 && page > 1) {
                setPage((p) => p - 1);
            } else {
                fetchStudents();
            }

            setDeletingStudent(null);
        } catch (error) {
            console.error("Failed to delete student", error);
        } finally {
            setIsDeleting(false);
        }
    }

    const actionButtons: ActionButtonDef[] = [
        {
            key: "create-student",
            label: "Create Student",
            variant: "primary",
            onClick: () => setIsCreateModalOpen(true),
        },
    ];

    const columns: ColumnDef<Student>[] = useMemo(
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
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                                {row.full_name.charAt(0)}
                            </div>
                        )}

                        <div>
                            <Link
                                to={`${row.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-medium hover:underline text-[#E1E1E1] transition-all"
                            >
                                {row.full_name}
                            </Link>

                            <div className="text-xs text-gray-500">
                                {row.email}
                            </div>
                        </div>
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
                key: "gender",
                label: "Gender",
                align: "center",
                render: (value) => (value as string | null) || "—",
            },

            {
                key: "dob",
                label: "Date of Birth",
                minWidth: "min-w-[140px]",
                render: (value) =>
                    value
                        ? new Date(value as string).toLocaleDateString()
                        : "—",
            },

            {
                key: "address",
                label: "Address",
                minWidth: "min-w-[200px]",
                render: (value) => (value as string | null) || "—",
            },

            {
                key: "created_at",
                label: "Created",
                minWidth: "min-w-[120px]",
                render: (value) =>
                    value
                        ? new Date(value as string)
                            .toLocaleDateString()
                        : "—",
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

        onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
        },
    };

    const rowActions: RowActionsDef<Student> = {
        onEdit: (student) => navigate(`${student.id}/edit`),
        onDelete: (student) => setDeletingStudent(student),
        edit: { label: "Edit student" },
        delete: { label: "Delete student" },
    };

    return (
        <>
            <CommonTable<Student>
                title="Students"
                columns={columns}
                data={students}
                rowKey={(student) => student.id}
                loading={loading}
                searchInputs={searchInputs}
                actionButtons={actionButtons}
                pagination={pagination}
                emptyMessage="No students found."
                onRowClick={onStudentClick}
                rowActions={rowActions}
                maxHeight="600px"
            />

            <CreateStudentModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    fetchStudents();
                }}
            />

            {/* Delete confirmation */}
            <CommonModal
                isOpen={!!deletingStudent}
                onClose={() => setDeletingStudent(null)}
                title="Delete student"
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
                <p>
                    Are you sure you want to delete{" "}
                    <span className="font-medium text-[#E1E1E1]">
                        {deletingStudent?.full_name}
                    </span>
                    ? All associated data may be permanently removed.
                </p>
            </CommonModal>
        </>
    );
}