import React, { useEffect, useMemo, useState, useCallback } from "react";
import { teacherService } from "@/api/services/teacher.service";
import { CommonTable } from "@/components/CommonTable/CommonTable";
import type { ColumnDef } from "@/components/CommonTable/CommonTable";
import type {
    TeacherDashboardResponse,
    TeacherUpcomingSession,
    PendingApproval,
    TeacherCourseDetailed,
    CourseSummaryResponse,
} from "@/types/teacher.types";
import { useAppSelector } from "@/store/hooks";

import { HoursArc, SessionBarChart } from "@/pages/Teacher/TeacherDashboard/TeacherCharts"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDateShort(iso: string): string {
    return new Date(iso).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    accent?: string;
    sub?: string;
}

function StatCard({ label, value, icon, accent = "border-[#343540]", sub }: StatCardProps) {
    return (
        <div className={`relative flex flex-col gap-3 bg-[#1E1E1E] rounded-xl border ${accent} p-5 shadow-sm overflow-hidden`}>
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#E1E1E1]/40">
                    {label}
                </span>
                <span className="text-[#E1E1E1]/20">{icon}</span>
            </div>
            <p className="text-3xl font-bold text-[#E1E1E1] tracking-tight leading-none">
                {value}
            </p>
            {sub && <p className="text-xs text-[#E1E1E1]/40">{sub}</p>}
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

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
    return (
        <div className="bg-[#1E1E1E] rounded-xl border border-[#343540] p-5 animate-pulse flex flex-col gap-3">
            <div className="h-3 w-24 bg-[#2A2A2A] rounded" />
            <div className="h-8 w-20 bg-[#2A2A2A] rounded" />
            <div className="h-3 w-32 bg-[#2A2A2A] rounded" />
        </div>
    );
}

// ─── Skeleton Table ───────────────────────────────────────────────────────────

function SkeletonTable() {
    return (
        <div className="bg-[#1E1E1E] rounded-xl border border-[#343540] px-4 py-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-[#E1E1E1]/30">
                <div className="w-6 h-6 border-2 border-[#343540] border-t-[#10A37F] rounded-full animate-spin" />
                <span className="text-sm">Loading…</span>
            </div>
        </div>
    );
}

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({ percentage }: { percentage: number }) {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <svg width="88" height="88" viewBox="0 0 88 88" className="rotate-[-90deg]">
            <circle
                cx="44" cy="44" r={radius}
                strokeWidth="7"
                stroke="#343540"
                fill="none"
            />
            <circle
                cx="44" cy="44" r={radius}
                strokeWidth="7"
                stroke="#10A37F"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
        </svg>
    );
}

// ─── Mini Stat ────────────────────────────────────────────────────────────────

function MiniStat({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
    return (
        <div className="flex flex-col gap-1 bg-[#242424] rounded-lg p-3 border border-[#343540]">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#E1E1E1]/40">{label}</span>
            <span className={`text-lg font-bold leading-none ${accent ? "text-[#10A37F]" : "text-[#E1E1E1]"}`}>{value}</span>
        </div>
    );
}


// ─── Course Summary Panel ─────────────────────────────────────────────────────

function CourseSummaryPanel({ courseId }: { courseId: string }) {
    const [summary, setSummary] = useState<CourseSummaryResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!courseId) return;
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const res = await teacherService.getCourseSummary(courseId);
                if (!cancelled) setSummary(res);
            } catch (err: unknown) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Failed to load summary");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [courseId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full py-16">
                <div className="flex flex-col items-center gap-3 text-[#E1E1E1]/30">
                    <div className="w-6 h-6 border-2 border-[#343540] border-t-[#10A37F] rounded-full animate-spin" />
                    <span className="text-sm">Loading summary…</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm m-1">
                {error}
            </div>
        );
    }

    if (!summary) return null;

    const statusColor =
        summary.status === "ACTIVE"
            ? "bg-[#10A37F]/10 text-[#10A37F] border-[#10A37F]/30"
            : "bg-[#E1E1E1]/10 text-[#E1E1E1]/60 border-[#343540]";

    return (
        <div className="flex flex-col gap-5 h-full overflow-y-auto pr-1">

            {/* Header */}
            <div className="flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="text-xs text-[#E1E1E1]/40 font-mono">{summary.course_code}</p>
                        <h3 className="text-base font-semibold text-[#E1E1E1] leading-snug">{summary.course_name}</h3>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${statusColor}`}>
                        {summary.status}
                    </span>
                </div>
            </div>

            {/* Mini stats grid */}
            <div className="grid grid-cols-2 gap-2">
                <MiniStat label="Students" value={summary.total_students} />
                <MiniStat label="Low Attendance" value={summary.low_attendance_students} />
            </div>

            {/* Charts — side by side */}
            <div className="flex gap-3">
                <div className="bg-[#242424] rounded-xl border border-[#343540] p-4 flex-1">
                    <HoursArc
                        completed={summary.completed_hours}
                        total={summary.total_hours}
                    />
                </div>
                <div className="bg-[#242424] rounded-xl border border-[#343540] p-4 flex-1">
                    <SessionBarChart
                        completed={summary.completed_sessions}
                        upcoming={summary.upcoming_sessions}
                        pending={summary.pending_sessions}
                    />
                </div>
            </div>
            {/* Next Session */}
            {summary.next_session && (
                <div className="bg-[#10A37F]/5 border border-[#10A37F]/20 rounded-xl p-4 flex flex-col gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#10A37F]/70">Next Session</span>
                    <p className="text-sm font-medium text-[#E1E1E1]">{summary.next_session.title}</p>
                    <div className="flex items-center gap-3 text-xs text-[#E1E1E1]/50">
                        <span>{formatDateShort(summary.next_session.scheduled_start)}</span>
                        <span className="w-1 h-1 rounded-full bg-[#E1E1E1]/20" />
                        <span>{summary.next_session.duration_hours}h</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Course List Panel ────────────────────────────────────────────────────────

interface CourseListPanelProps {
    courses: TeacherCourseDetailed[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

function CourseListPanel({ courses, selectedId, onSelect }: CourseListPanelProps) {
    const [tab, setTab] = useState<"ACTIVE" | "COMPLETED">("ACTIVE");
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return courses.filter(
            (c) =>
                c.status === tab &&
                (c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
        );
    }, [courses, tab, search]);

    return (
        <div className="flex flex-col gap-3 h-full">

            {/* Tabs + Search */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center bg-[#242424] rounded-lg p-0.5 border border-[#343540]">
                    {(["ACTIVE", "COMPLETED"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${tab === t
                                ? "bg-[#10A37F] text-white shadow"
                                : "text-[#E1E1E1]/50 hover:text-[#E1E1E1]/80"
                                }`}
                        >
                            {t === "ACTIVE" ? "Active" : "Completed"}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#E1E1E1]/30">
                        <IconSearch />
                    </span>
                    <input
                        type="text"
                        placeholder="Search by name or code…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#242424] border border-[#343540] rounded-lg pl-9 pr-3 py-2 text-sm text-[#E1E1E1] placeholder-[#E1E1E1]/30 focus:outline-none focus:border-[#10A37F]/50 transition-colors"
                    />
                </div>
            </div>

            {/* Course list */}
            <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 min-h-0">
                {filtered.length === 0 ? (
                    <p className="text-sm text-[#E1E1E1]/30 text-center py-8">No courses found.</p>
                ) : (
                    filtered.map((course) => (
                        <button
                            key={course.id}
                            onClick={() => onSelect(course.id)}
                            className={`w-full text-left flex flex-col gap-1 px-3 py-3 rounded-lg border transition-all ${selectedId === course.id
                                ? "bg-[#10A37F]/10 border-[#10A37F]/30 text-[#E1E1E1]"
                                : "bg-[#242424] border-[#343540] text-[#E1E1E1]/70 hover:border-[#10A37F]/20 hover:text-[#E1E1E1]"
                                }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium leading-snug line-clamp-1">{course.name}</span>
                                <span className="text-[10px] font-mono shrink-0 text-[#E1E1E1]/40 bg-[#1E1E1E] px-1.5 py-0.5 rounded border border-[#343540]">
                                    {course.code}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-[#E1E1E1]/40">
                                <span>{course.duration_hours}h total</span>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

// ─── Upcoming Sessions Table ──────────────────────────────────────────────────

function UpcomingSessionsTable({ sessions }: { sessions: TeacherUpcomingSession[] }) {
    const columns: ColumnDef<TeacherUpcomingSession>[] = useMemo(
        () => [
            {
                key: "course_name",
                label: "Course",
                minWidth: "min-w-[160px]",
                render: (_, row) => (
                    <div className="flex flex-col">
                        <span className="font-medium text-[#E1E1E1] truncate max-w-[160px]">
                            {row.course_name}
                        </span>
                        <span className="text-xs text-[#E1E1E1]/40 truncate max-w-[160px]">
                            {row.session_title}
                        </span>
                    </div>
                ),
            },
            {
                key: "scheduled_start",
                label: "Scheduled",
                minWidth: "min-w-[150px]",
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
                    <span className="text-[#E1E1E1]/60 text-sm">{value as number}h</span>
                ),
            },
        ],
        []
    );

    return (
        <CommonTable<TeacherUpcomingSession>
            title="Upcoming Sessions"
            columns={columns}
            data={sessions.slice(0, 5)}
            rowKey={(s) => s.session_id}
            emptyMessage="No upcoming sessions."
        />
    );
}

// ─── Pending Approvals Table ──────────────────────────────────────────────────

function PendingApprovalsTable({ approvals }: { approvals: PendingApproval[] }) {
    const columns: ColumnDef<PendingApproval>[] = useMemo(
        () => [
            {
                key: "course_name",
                label: "Course",
                minWidth: "min-w-[160px]",
                render: (_, row) => (
                    <div className="flex flex-col">
                        <span className="font-medium text-[#E1E1E1] truncate max-w-[160px]">
                            {row.course_name}
                        </span>
                        <span className="text-xs text-[#E1E1E1]/40 truncate max-w-[160px]">
                            {row.session_title}
                        </span>
                    </div>
                ),
            },
            {
                key: "scheduled_start",
                label: "Scheduled",
                minWidth: "min-w-[150px]",
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
                    <span className="text-[#E1E1E1]/60 text-sm">{value as number}h</span>
                ),
            },
            {
                key: "session_id",
                label: "Status",
                align: "center",
                render: () => (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                        Pending
                    </span>
                ),
            },
        ],
        []
    );

    return (
        <CommonTable<PendingApproval>
            title="Pending Approvals"
            columns={columns}
            data={approvals.slice(0, 5)}
            rowKey={(s) => s.session_id}
            emptyMessage="No pending approvals."
        />
    );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconBook = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
);

const IconCalendar = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
);

const IconCheck = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const IconClock = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const IconSearch = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

// ─── TeacherDashboard ─────────────────────────────────────────────────────────

const TeacherDashboard: React.FC = () => {
    const profileId = useAppSelector((state) => state.auth.profile?.id);

    const [data, setData] = useState<TeacherDashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Courses for the bottom section — fetched from teacher's course list
    const [courses, setCourses] = useState<TeacherCourseDetailed[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const result = await teacherService.getDashboard();
                setData(result);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load dashboard");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);


    useEffect(() => {
        async function loadCourses() {
            if (!profileId) return;
            setCoursesLoading(true);
            try {
                const res = await teacherService.getTeacherCourses(profileId, { limit: 100 });
                const allCourses = res.items;
                setCourses(allCourses);
                const firstActive = allCourses.find((c) => c.status === "ACTIVE");
                if (firstActive) setSelectedCourseId(firstActive.id);
            } catch {
                // silently fail — courses panel stays empty
            } finally {
                setCoursesLoading(false);
            }
        }
        loadCourses();
    }, []);

    const handleCourseSelect = useCallback((id: string) => {
        setSelectedCourseId(id);
    }, []);

    return (
        <div className="flex flex-col gap-6 p-6 min-h-screen">

            {/* ── Page Header ── */}
            <div className="flex flex-col gap-1">
                <h1 className="text-xl font-semibold text-[#E1E1E1]">Dashboard</h1>
                <p className="text-sm text-[#E1E1E1]/40">Overview of your teaching activity</p>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                ) : data ? (
                    <>
                        <StatCard label="Active Courses" value={data.cards.active_courses} icon={<IconBook />} sub="Currently running" />
                        <StatCard label="Upcoming Sessions" value={data.cards.upcoming_sessions} icon={<IconCalendar />} sub="Scheduled ahead" />
                        <StatCard label="Completed Sessions" value={data.cards.completed_sessions} icon={<IconCheck />} sub="All time" />
                        <StatCard label="Teaching Hours" value={`${data.cards.teaching_hours}h`} icon={<IconClock />} accent="border-[#10A37F]/30" sub="Total hours taught" />
                    </>
                ) : null}
            </div>

            {/* ── Tables: Upcoming Sessions + Pending Approvals ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                    <SectionHeading title="Upcoming Sessions" sub="Your next 5 scheduled sessions" />
                    {loading ? <SkeletonTable /> : data ? <UpcomingSessionsTable sessions={data.upcoming_sessions} /> : null}
                </div>
                <div className="flex flex-col gap-3">
                    <SectionHeading title="Pending Approvals" sub="Sessions awaiting admin approval" />
                    {loading ? <SkeletonTable /> : data ? <PendingApprovalsTable approvals={data.pending_approvals} /> : null}
                </div>
            </div>

            {/* ── Course Explorer ── */}
            <div className="flex flex-col gap-3">
                <SectionHeading
                    title="My Courses"
                    sub="Select a course to view its summary"
                />

                <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">

                    {/* Left: Course list */}
                    <div className="bg-[#1E1E1E] rounded-xl border border-[#343540] p-4 flex flex-col gap-3 min-h-[420px]">
                        {coursesLoading ? (
                            <div className="flex items-center justify-center h-full py-10">
                                <div className="flex flex-col items-center gap-3 text-[#E1E1E1]/30">
                                    <div className="w-6 h-6 border-2 border-[#343540] border-t-[#10A37F] rounded-full animate-spin" />
                                    <span className="text-sm">Loading courses…</span>
                                </div>
                            </div>
                        ) : (
                            <CourseListPanel
                                courses={courses}
                                selectedId={selectedCourseId}
                                onSelect={handleCourseSelect}
                            />
                        )}
                    </div>

                    {/* Right: Course summary */}
                    <div className="bg-[#1E1E1E] rounded-xl border border-[#343540] p-5 min-h-[420px]">
                        {selectedCourseId ? (
                            <CourseSummaryPanel courseId={selectedCourseId} />
                        ) : (
                            <div className="flex items-center justify-center h-full py-16 text-[#E1E1E1]/30 text-sm">
                                Select a course to view its summary
                            </div>
                        )}
                    </div>

                </div>
            </div>

        </div>
    );
};

export default TeacherDashboard;