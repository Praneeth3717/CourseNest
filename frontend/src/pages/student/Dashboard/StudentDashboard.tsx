import React, { useEffect, useMemo, useState, useCallback } from "react";
import { studentService } from "@/api/services/student.service";
import { CommonTable } from "@/components/CommonTable/CommonTable";
import type { ColumnDef } from "@/components/CommonTable/CommonTable";
import type {
    StudentDashboardResponse,
    StudentUpcomingSession,
    StudentCourseSummaryResponse,
    StudentCourseItem,
} from "@/types/student.types";
import { useAppSelector } from "@/store/hooks";
import { HoursArc, SessionBarChart } from "@/pages/student/Dashboard/StudentCharts"

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

// ─── Mini Stat ────────────────────────────────────────────────────────────────

function MiniStat({
    label,
    value,
    accent = false,
}: {
    label: string;
    value: string | number;
    accent?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1 bg-[#242424] rounded-lg p-3 border border-[#343540]">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#E1E1E1]/40">
                {label}
            </span>
            <span className={`text-lg font-bold leading-none ${accent ? "text-[#10A37F]" : "text-[#E1E1E1]"}`}>
                {value}
            </span>
        </div>
    );
}

// ─── Course Summary Panel ─────────────────────────────────────────────────────

function CourseSummaryPanel({ courseId }: { courseId: string }) {
    const [summary, setSummary] = useState<StudentCourseSummaryResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!courseId) return;
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const res = await studentService.getStudentCourseSummary(courseId);
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
                        <h3 className="text-base font-semibold text-[#E1E1E1] leading-snug">
                            {summary.course_name}
                        </h3>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
                            {summary.status}
                        </span>
                        {summary.is_completed && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                Completed
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Mini stats grid */}
            <div className="grid grid-cols-3 gap-2">
                <MiniStat
                    label="Attendance"
                    value={`${summary.attendance_percentage}%`}
                    accent={summary.attendance_percentage >= 75}
                />
                <MiniStat label="Sessions Attended" value={summary.attended_sessions} />
                <MiniStat label="Sessions Missed" value={summary.absent_sessions} />
            </div>

            {/* Charts — side by side */}
            <div className="flex gap-3">
                <div className="bg-[#242424] rounded-xl border border-[#343540] p-4 flex-1">
                    <HoursArc
                        completed={summary.attended_hours}
                        total={summary.total_hours}
                        remaining={summary.remaining_hours}
                    />
                </div>
                <div className="bg-[#242424] rounded-xl border border-[#343540] p-4 flex-1">
                    {/* prop is now `missed` not `pending` */}
                    <SessionBarChart
                        completed={summary.completed_sessions}
                        upcoming={summary.upcoming_sessions}
                        missed={summary.missed_sessions}
                    />
                </div>
            </div>

            {/* Certificate */}
            {summary.is_completed && summary.certificate_url && (
                <a
                    href={summary.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#10A37F]/10 border border-[#10A37F]/30 rounded-xl px-4 py-3 text-[#10A37F] text-sm font-medium hover:bg-[#10A37F]/20 transition-colors"
                >
                    <IconCertificate />
                    View Certificate
                </a>
            )}

            {/* Next Session */}
            {summary.next_session && (
                <div className="bg-[#10A37F]/5 border border-[#10A37F]/20 rounded-xl p-4 flex flex-col gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#10A37F]/70">
                        Next Session
                    </span>
                    <p className="text-sm font-medium text-[#E1E1E1]">
                        {summary.next_session.title}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-[#E1E1E1]/50">
                        <span>{formatDate(summary.next_session.scheduled_start)}</span>
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
    courses: StudentCourseItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

function CourseListPanel({ courses, selectedId, onSelect }: CourseListPanelProps) {
    const [tab, setTab] = useState<"ACTIVE" | "COMPLETED">("ACTIVE");
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        const isCompleted = tab === "COMPLETED";
        return courses.filter(
            (c) =>
                c.is_completed === isCompleted &&
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
                            key={course.course_id}
                            onClick={() => onSelect(course.course_id)}
                            className={`w-full text-left flex flex-col gap-1.5 px-3 py-3 rounded-lg border transition-all ${selectedId === course.course_id
                                ? "bg-[#10A37F]/10 border-[#10A37F]/30 text-[#E1E1E1]"
                                : "bg-[#242424] border-[#343540] text-[#E1E1E1]/70 hover:border-[#10A37F]/20 hover:text-[#E1E1E1]"
                                }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium leading-snug line-clamp-1">
                                    {course.name}
                                </span>
                                <span className="text-[10px] font-mono shrink-0 text-[#E1E1E1]/40 bg-[#1E1E1E] px-1.5 py-0.5 rounded border border-[#343540]">
                                    {course.code}
                                </span>
                            </div>
                            {/* Progress bar */}
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 bg-[#343540] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#10A37F] rounded-full transition-all"
                                        style={{ width: `${course.course_progress_percentage}%` }}
                                    />
                                </div>
                                <span className="text-[10px] text-[#E1E1E1]/40 shrink-0">
                                    {course.course_progress_percentage}%
                                </span>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

// ─── Upcoming Sessions Table ──────────────────────────────────────────────────

function UpcomingSessionsTable({ sessions }: { sessions: StudentUpcomingSession[] }) {
    const columns: ColumnDef<StudentUpcomingSession>[] = useMemo(
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
        <CommonTable<StudentUpcomingSession>
            title="Upcoming Sessions"
            columns={columns}
            data={sessions.slice(0, 5)}
            rowKey={(s) => s.session_id}
            emptyMessage="No upcoming sessions."
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

const IconCertificate = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.63 48.63 0 0 1 12 20.904a48.63 48.63 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
    </svg>
);

// ─── StudentDashboard ─────────────────────────────────────────────────────────

const StudentDashboard: React.FC = () => {
    const profileId = useAppSelector((state) => state.auth.profile?.id);

    const [data, setData] = useState<StudentDashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [courses, setCourses] = useState<StudentCourseItem[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const result = await studentService.getStudentDashboard();
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
                const res = await studentService.getStudentCourses(profileId, { limit: 100 });
                const allCourses = res.items;
                setCourses(allCourses);
                const firstActive = allCourses.find((c) => !c.is_completed);
                if (firstActive) setSelectedCourseId(firstActive.course_id);
            } catch {
                // silently fail — courses panel stays empty
            } finally {
                setCoursesLoading(false);
            }
        }
        loadCourses();
    }, [profileId]);

    const handleCourseSelect = useCallback((id: string) => {
        setSelectedCourseId(id);
    }, []);

    return (
        <div className="flex flex-col gap-6 p-6 min-h-screen">

            {/* ── Page Header ── */}
            <div className="flex flex-col gap-1">
                <h1 className="text-xl font-semibold text-[#E1E1E1]">Dashboard</h1>
                <p className="text-sm text-[#E1E1E1]/40">Overview of your learning activity</p>
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
                        <StatCard
                            label="Enrolled Courses"
                            value={data.cards.enrolled_courses}
                            icon={<IconBook />}
                            sub="Total enrollments"
                        />
                        <StatCard
                            label="Active Courses"
                            value={data.cards.active_courses}
                            icon={<IconCalendar />}
                            sub="Currently in progress"
                        />
                        <StatCard
                            label="Completed Courses"
                            value={data.cards.completed_courses}
                            icon={<IconCheck />}
                            sub="All time"
                        />
                        <StatCard
                            label="Hours Learned"
                            value={`${data.cards.hours_learned}h`}
                            icon={<IconClock />}
                            accent="border-[#10A37F]/30"
                            sub="Total attended hours"
                        />
                    </>
                ) : null}
            </div>

            {/* ── Upcoming Sessions Table ── */}
            <div className="flex flex-col gap-3">
                <SectionHeading title="Upcoming Sessions" sub="Your next 5 scheduled sessions" />
                {loading ? (
                    <SkeletonTable />
                ) : data ? (
                    <UpcomingSessionsTable sessions={data.upcoming_sessions} />
                ) : null}
            </div>

            {/* ── Course Explorer ── */}
            <div className="flex flex-col gap-3">
                <SectionHeading
                    title="My Courses"
                    sub="Select a course to view your progress summary"
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
                                Select a course to view your progress
                            </div>
                        )}
                    </div>

                </div>
            </div>

        </div>
    );
};

export default StudentDashboard;