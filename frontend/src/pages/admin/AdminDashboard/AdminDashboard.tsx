import React, { useEffect, useMemo, useState } from "react";
import { adminService } from "@/api/services/admin.service";
import { CommonTable } from "@/components/CommonTable/CommonTable";
import type { ColumnDef } from "@/components/CommonTable/CommonTable";
import type {
    DashboardData,
    DashboardCards,
    DashboardRevenue,
    UpcomingSession,
    SessionStatus,
    DashboardAnalyticsResponse
} from "@/types/admin.types";
import { CourseRevenueChart } from "./CourseRevenueChart";
import { MonthlyRevenueChart } from "./MonthlyRevenueChart";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const statusStyles: Record<SessionStatus, string> = {
    Pending: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
    Accepted: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
    Rejected: "bg-red-500/10 text-red-400 border border-red-500/30",
    Completed: "bg-[#10A37F]/10 text-[#10A37F] border border-[#10A37F]/30",
    Cancelled: "bg-[#343540]/40 text-[#E1E1E1]/40 border border-[#343540]",
};

function StatusBadge({ status }: { status: SessionStatus }) {
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}
        >
            {status}
        </span>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    accent?: string; // Tailwind border-color class
    sub?: string;
}

function StatCard({ label, value, icon, accent = "border-[#343540]", sub }: StatCardProps) {
    return (
        <div
            className={`relative flex flex-col gap-3 bg-[#1E1E1E] rounded-xl border ${accent} p-5 shadow-sm overflow-hidden`}
        >
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#E1E1E1]/40">
                    {label}
                </span>
                <span className="text-[#E1E1E1]/20">{icon}</span>
            </div>
            <p className="text-3xl font-bold text-[#E1E1E1] tracking-tight leading-none">
                {value}
            </p>
            {sub && (
                <p className="text-xs text-[#E1E1E1]/40">{sub}</p>
            )}
        </div>
    );
}

// ─── Section Heading ──────────────────────────────────────────────────────────

function SectionHeading({ title, sub }: { title: string; sub?: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold text-[#E1E1E1]">{title}</h2>
            {sub && <p className="text-xs text-[#E1E1E1]/40">{sub}</p>}
        </div>
    );
}

// ─── Skeleton Cards ───────────────────────────────────────────────────────────

function SkeletonCard() {
    return (
        <div className="bg-[#1E1E1E] rounded-xl border border-[#343540] p-5 animate-pulse flex flex-col gap-3">
            <div className="h-3 w-24 bg-[#2A2A2A] rounded" />
            <div className="h-8 w-20 bg-[#2A2A2A] rounded" />
            <div className="h-3 w-32 bg-[#2A2A2A] rounded" />
        </div>
    );
}

// ─── Course Breakdown ─────────────────────────────────────────────────────────

interface CourseBreakdownProps {
    cards: DashboardCards;
}

function CourseBreakdown({ cards }: CourseBreakdownProps) {
    const items: { label: string; value: number; color: string }[] = [
        { label: "Active", value: cards.active_courses, color: "bg-[#10A37F]" },
        { label: "Draft", value: cards.draft_courses, color: "bg-yellow-500" },
        { label: "Completed", value: cards.completed_courses, color: "bg-blue-500" },
        { label: "Archived", value: cards.archived_courses, color: "bg-[#343540]" },
    ];

    const total = cards.total_courses || 1;

    return (
        <div className="bg-[#1E1E1E] rounded-xl border border-[#343540] p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <SectionHeading title="Courses" sub={`${cards.total_courses} total`} />
                <span className="text-2xl font-bold text-[#E1E1E1]">{cards.total_courses}</span>
            </div>

            {/* Stacked bar */}
            <div className="flex h-2 w-full rounded-full overflow-hidden gap-px">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className={`${item.color} transition-all duration-700`}
                        style={{ width: `${(item.value / total) * 100}%` }}
                    />
                ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
                {items.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.color}`} />
                        <span className="text-xs text-[#E1E1E1]/50">{item.label}</span>
                        <span className="text-xs font-semibold text-[#E1E1E1] ml-auto">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Revenue Card ─────────────────────────────────────────────────────────────

function RevenueCard({ revenue }: { revenue: DashboardRevenue }) {
    return (
        <div className="bg-[#1E1E1E] rounded-xl border border-[#10A37F]/30 p-5 shadow-sm flex flex-col gap-4">
            <SectionHeading title="Revenue" sub="Lifetime · Monthly · Avg" />
            <div className="flex flex-col gap-3">
                <div className="flex items-end justify-between gap-2">
                    <span className="text-xs text-[#E1E1E1]/40 uppercase tracking-widest">Total</span>
                    <span className="text-2xl font-bold text-[#10A37F] tracking-tight">
                        {formatCurrency(revenue.total_revenue)}
                    </span>
                </div>
                <div className="h-px bg-[#343540]" />
                <div className="flex items-center justify-between">
                    <span className="text-xs text-[#E1E1E1]/40">This month</span>
                    <span className="text-sm font-semibold text-[#E1E1E1]">
                        {formatCurrency(revenue.this_month_revenue)}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-[#E1E1E1]/40">Monthly avg</span>
                    <span className="text-sm font-semibold text-[#E1E1E1]">
                        {formatCurrency(revenue.monthly_avg_revenue)}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Upcoming Sessions Table ──────────────────────────────────────────────────

function UpcomingSessionsTable({ sessions }: { sessions: UpcomingSession[] }) {
    const columns: ColumnDef<UpcomingSession>[] = useMemo(
        () => [
            {
                key: "course_name",
                label: "Course",
                minWidth: "min-w-[180px]",
                render: (_, row) => (
                    <div className="flex flex-col">
                        <span className="font-medium text-[#E1E1E1] truncate max-w-[180px]">
                            {row.course_name}
                        </span>
                        <span className="text-xs text-[#E1E1E1]/40 truncate max-w-[180px]">
                            {row.session_title}
                        </span>
                    </div>
                ),
            },
            {
                key: "teacher_name",
                label: "Teacher",
                minWidth: "min-w-[140px]",
                render: (_, row) =>
                    row.teacher_name ? (
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#10A37F]/20 text-[#10A37F] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                {row.teacher_name.charAt(0)}
                            </div>
                            <span className="text-[#E1E1E1]/80 text-sm">{row.teacher_name}</span>
                        </div>
                    ) : (
                        <span className="text-[#E1E1E1]/30">—</span>
                    ),
            },
            {
                key: "scheduled_start",
                label: "Scheduled",
                minWidth: "min-w-[160px]",
                render: (value) => (
                    <span className="text-[#E1E1E1]/70 text-sm">
                        {formatDate(value as string)}
                    </span>
                ),
            },
            {
                key: "duration_hours",
                label: "Duration",
                align: "center",
                render: (value) => (
                    <span className="text-[#E1E1E1]/60 text-sm">
                        {value as number}h
                    </span>
                ),
            },
            {
                key: "status",
                label: "Status",
                align: "center",
                render: (value) => <StatusBadge status={value as SessionStatus} />,
            },
        ],
        []
    );

    return (
        <CommonTable<UpcomingSession>
            title="Upcoming Sessions"
            columns={columns}
            data={sessions.slice(0, 5)}
            rowKey={(s) => s.session_id}
            emptyMessage="No upcoming sessions."
        />
    );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconUsers = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
);

const IconTeacher = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84 51.11 51.11 0 0 0-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
    </svg>
);

const IconCourse = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
);

const IconStudent = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
);

// ─── AdminDashboard ───────────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Add state:
    const [charts, setCharts] = useState<DashboardAnalyticsResponse | null>(null);
    const [chartsLoading, setChartsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const result = await adminService.getDashboard();
                setData(result);
            } catch (err: any) {
                setError(err?.message || "Failed to load dashboard");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    useEffect(() => {
        adminService.getDashboardCharts()
            .then(setCharts)
            .finally(() => setChartsLoading(false));
    }, []);

    return (
        <div className="flex flex-col gap-6 p-6 min-h-screenn">

            {/* ── Page Header ── */}
            <div className="flex flex-col gap-1">
                <h1 className="text-xl font-semibold text-[#E1E1E1]">Dashboard</h1>
                <p className="text-sm text-[#E1E1E1]/40">
                    Overview of your platform activity
                </p>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* ── Top Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                ) : data ? (
                    <>
                        <StatCard
                            label="Students"
                            value={data.cards.students.toLocaleString()}
                            icon={<IconStudent />}
                            accent="border-[#343540]"
                            sub="Registered learners"
                        />
                        <StatCard
                            label="Teachers"
                            value={data.cards.teachers.toLocaleString()}
                            icon={<IconTeacher />}
                            accent="border-[#343540]"
                            sub="Active instructors"
                        />
                        <StatCard
                            label="Total Courses"
                            value={data.cards.total_courses.toLocaleString()}
                            icon={<IconCourse />}
                            accent="border-[#343540]"
                            sub={`${data.cards.active_courses} active`}
                        />
                        <StatCard
                            label="Total Revenue"
                            value={formatCurrency(data.revenue.total_revenue)}
                            icon={<IconUsers />}
                            accent="border-[#10A37F]/30"
                            sub={`This month: ${formatCurrency(data.revenue.this_month_revenue)}`}
                        />
                    </>
                ) : null}
            </div>

            {/* ── Secondary Row: Course Breakdown + Revenue ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : data ? (
                    <>
                        <CourseBreakdown cards={data.cards} />
                        <RevenueCard revenue={data.revenue} />
                    </>
                ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MonthlyRevenueChart
                    data={charts?.monthly_revenue ?? []}
                    loading={chartsLoading}
                />
                <CourseRevenueChart
                    data={charts?.course_revenue ?? []}
                    loading={chartsLoading}
                />
            </div>

            {/* ── Upcoming Sessions Table ── */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <SectionHeading
                        title="Upcoming Sessions"
                        sub="Next 5 scheduled sessions across all courses"
                    />
                </div>

                {loading ? (
                    <div className="bg-[#1E1E1E] rounded-xl border border-[#343540] px-4 py-10 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3 text-[#E1E1E1]/30">
                            <div className="w-6 h-6 border-2 border-[#343540] border-t-[#10A37F] rounded-full animate-spin" />
                            <span className="text-sm">Loading sessions…</span>
                        </div>
                    </div>
                ) : data ? (
                    <UpcomingSessionsTable sessions={data.upcoming_sessions} />
                ) : null}
            </div>
        </div>
    );
};

export default AdminDashboard;