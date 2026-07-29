import { useEffect, useMemo, useState } from "react";

import { attendanceService } from "@/api/services/attendance.service";
import { CommonTable } from "@/components/CommonTable/CommonTable";
import CommonModal from "@/components/CommonModal/CommonModal";
import UpdateAttendanceModal from "../SessionDetails/UpdateAttendanceModal";

import type {
    ColumnDef,
    SearchInputDef,
    PaginationDef,
    RowActionsDef,
} from "@/components/CommonTable/CommonTable";

import type { AttendanceStudent } from "@/types/attendance.types";

interface StudentAttendanceTableProps {
    sessionId: string;
}

const STATUS_STYLES: Record<string, string> = {
    present: "border-[#10A37F]/30 bg-[#10A37F]/10 text-[#10A37F]",
    absent: "border-red-400/30 bg-red-500/10 text-red-400",
};

export default function StudentAttendanceTable({
    sessionId,
}: StudentAttendanceTableProps) {
    const [attendance, setAttendance] = useState<AttendanceStudent[]>([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalRows, setTotalRows] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [selectedRecord, setSelectedRecord] = useState<AttendanceStudent | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    /* ── Fetch ── */

    const fetchAttendance = async () => {
        try {
            setLoading(true);

            const response = await attendanceService.getSessionAttendance(sessionId, {
                page,
                limit: pageSize,
                search: search || undefined,
            });

            setAttendance(response.items);
            setTotalRows(response.total);
            setTotalPages(response.total_pages);
        } catch (error) {
            console.error("Failed to fetch attendance", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (sessionId) fetchAttendance();
    }, [sessionId, page, pageSize, search]);

    /* ── Columns ── */

    const columns: ColumnDef<AttendanceStudent>[] = useMemo(
        () => [
            {
                key: "full_name",
                label: "Student",
                sortable: true,
                minWidth: "min-w-[200px]",
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
                                {row.full_name?.charAt(0).toUpperCase() || "?"}
                            </div>
                        )}

                        <span className="font-medium text-[#E1E1E1]">
                            {row.full_name}
                        </span>
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
                key: "status",
                label: "Status",
                align: "center",
                render: (_, row) => (
                    <span
                        className={`inline-block rounded-md border px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[row.status] ??
                            "border-[#343540] bg-[#0C0C0C] text-[#E1E1E1]/60"
                            }`}
                    >
                        {row.status}
                    </span>
                ),
            },

            {
                key: "remarks",
                label: "Remarks",
                minWidth: "min-w-[160px]",
                render: (value) => (value as string | null) || "—",
            },

            {
                key: "marked_at",
                label: "Marked At",
                minWidth: "min-w-[160px]",
                render: (value) =>
                    value ? new Date(value as string).toLocaleString() : "—",
            },
        ],
        [],
    );

    /* ── Search / Pagination / Row actions ── */

    const searchInputs: SearchInputDef[] = [
        {
            key: "attendance-search",
            placeholder: "Search student…",
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

    const rowActions: RowActionsDef<AttendanceStudent> = {
        onEdit: (record) => {
            setSelectedRecord(record);
            setIsEditModalOpen(true);
        },
        edit: { label: "Edit attendance" },
    };

    return (
        <>
            <CommonTable<AttendanceStudent>
                title="Attendance"
                columns={columns}
                data={attendance}
                rowKey={(record) => record.attendance_id}
                loading={loading}
                searchInputs={searchInputs}
                pagination={pagination}
                emptyMessage="No attendance records found."
                rowActions={rowActions}
                maxHeight="600px"
            />

            <UpdateAttendanceModal
                isOpen={isEditModalOpen}
                attendance={selectedRecord}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedRecord(null);
                }}
                onSuccess={fetchAttendance}
            />
        </>
    );
}