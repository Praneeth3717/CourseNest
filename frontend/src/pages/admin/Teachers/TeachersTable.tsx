import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { teacherService } from "@/api/services/teacher.service";

import { CommonTable } from "@/components/CommonTable/CommonTable";
import CreateTeacherModal from "@/pages/admin/Teachers/CreateTeacherModal";
import CommonModal from "@/components/CommonModal/CommonModal";

import type {
    ColumnDef,
    SearchInputDef,
    PaginationDef,
    ActionButtonDef,
    RowActionsDef,
} from "@/components/CommonTable/CommonTable";

import type {
    Teacher,
    GetTeachersResponse,
} from "@/types/teacher.types";

interface TeachersTableProps {
    onTeacherClick?: (teacher: Teacher) => void;
}

export default function TeachersTable({
    onTeacherClick,
}: TeachersTableProps) {
    const navigate = useNavigate();

    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [totalRows, setTotalRows] = useState(0);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    async function fetchTeachers() {
        try {
            setLoading(true);

            const response: GetTeachersResponse =
                await teacherService.getTeachers({
                    page,
                    limit: pageSize,
                    search: search || undefined,
                });

            setTeachers(response.items);
            setTotalRows(response.total);
        } catch (error) {
            console.error("Failed to fetch teachers", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchTeachers();
    }, [page, pageSize, search]);

    async function handleDeleteConfirm() {
        if (!deletingTeacher) return;

        try {
            setIsDeleting(true);
            await teacherService.deleteTeacher(deletingTeacher.id);

            // If we deleted the last row on this page (and not page 1), go back a page
            if (teachers.length === 1 && page > 1) {
                setPage((p) => p - 1);
            } else {
                fetchTeachers();
            }

            setDeletingTeacher(null);
        } catch (error) {
            console.error("Failed to delete teacher", error);
        } finally {
            setIsDeleting(false);
        }
    }

    const actionButtons: ActionButtonDef[] = [
        {
            key: "create-teacher",
            label: "Create Teacher",
            variant: "primary",
            onClick: () => setIsCreateModalOpen(true),
        },
    ];

    const columns: ColumnDef<Teacher>[] = useMemo(
        () => [
            {
                key: "full_name",
                label: "Teacher",
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
            },

            {
                key: "gender",
                label: "Gender",
                align: "center",
            },

            {
                key: "specialization",
                label: "Specialization",
                minWidth: "min-w-[180px]",
            },

            {
                key: "qualification",
                label: "Qualification",
                minWidth: "min-w-[180px]",
            },

            {
                key: "experience_years",
                label: "Experience",
                align: "center",
                render: (value) =>
                    value != null ? `${value} yrs` : "—",
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
            key: "teacher-search",
            placeholder: "Search teacher...",
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

    const rowActions: RowActionsDef<Teacher> = {
        onEdit: (teacher) => navigate(`${teacher.id}/edit`),
        onDelete: (teacher) => setDeletingTeacher(teacher),
        edit: { label: "Edit teacher" },
        delete: { label: "Delete teacher" },
    };

    return (
        <>
            <CommonTable<Teacher>
                title="Teachers"
                columns={columns}
                data={teachers}
                rowKey={(teacher) => teacher.id}
                loading={loading}
                searchInputs={searchInputs}
                actionButtons={actionButtons}
                pagination={pagination}
                emptyMessage="No teachers found."
                onRowClick={onTeacherClick}
                rowActions={rowActions}
                maxHeight="600px"
            />

            <CreateTeacherModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    fetchTeachers();
                }}
            />

            {/* Delete confirmation */}
            <CommonModal
                isOpen={!!deletingTeacher}
                onClose={() => setDeletingTeacher(null)}
                title="Delete teacher"
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
                        {deletingTeacher?.full_name}
                    </span>
                    ? All associated data may be permanently removed.
                </p>
            </CommonModal>
        </>
    );
}