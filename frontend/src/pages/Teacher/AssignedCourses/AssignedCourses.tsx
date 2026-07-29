import React, { useEffect, useState, useMemo } from "react";

import { useNavigate } from "react-router-dom";
import {
    Search,
    BookOpen,
    Clock,
    IndianRupee,
    ArrowRight,
    LayoutGrid,
} from "lucide-react";

import { teacherService } from "@/api/services/teacher.service";
import type { TeacherCourseDetailed } from "@/types/teacher.types";

import { useAppSelector } from "@/store/hooks";

/* ─── Constants ───────────────────────────────── */

const PAGE_SIZE = 12;

const STATUS_FILTERS = ["ALL", "ACTIVE", "DRAFT", "COMPLETED", "ARCHIVED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const statusStyles: Record<string, string> = {
    ACTIVE: "bg-[#10A37F]/15 text-[#10A37F]",
    DRAFT: "bg-yellow-500/15 text-yellow-400",
    COMPLETED: "bg-blue-500/15 text-blue-400",
    ARCHIVED: "bg-[#E1E1E1]/10 text-[#E1E1E1]/50",
};

const statusFilterStyles: Record<StatusFilter, string> = {
    ALL: "bg-[#10A37F] text-white",
    ACTIVE: "bg-[#10A37F]/15 text-[#10A37F]",
    DRAFT: "bg-yellow-500/15 text-yellow-400",
    COMPLETED: "bg-blue-500/15 text-blue-400",
    ARCHIVED: "bg-[#E1E1E1]/10 text-[#E1E1E1]/50",
};

/* ─── Component ───────────────────────────────── */

const AssignedCourses = () => {
    const navigate = useNavigate();

    const profileId = useAppSelector((state) => state.auth.profile?.id);

    const [courses, setCourses] = useState<TeacherCourseDetailed[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCourses, setTotalCourses] = useState(0);
    const [activeFilter, setActiveFilter] = useState<StatusFilter>("ALL");

    /* ── Data loading ──────────────────────────── */

    const loadCourses = async (
        currentPage = page,
        currentSearch = search,
    ) => {
        if (!profileId) return;

        try {
            setLoading(true);

            const response = await teacherService.getTeacherCourses(
                profileId,
                {
                    page: currentPage,
                    limit: PAGE_SIZE,
                    search: currentSearch || undefined,
                },
            );

            setCourses(response.items);
            setTotalPages(response.total_pages);
            setTotalCourses(response.total);
        } catch (error) {
            console.error("Failed to load courses", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, profileId]);

    /* ── Search ────────────────────────────────── */

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setActiveFilter("ALL");
        loadCourses(1, search);
    };

    /* ── Client-side status filter ─────────────── */

    const filteredCourses = useMemo(() => {
        if (activeFilter === "ALL") return courses;
        return courses.filter(
            (c) => c.status.toUpperCase() === activeFilter,
        );
    }, [courses, activeFilter]);

    /* ── Status counts for filter bar ─────────── */

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = { ALL: courses.length };
        for (const c of courses) {
            const key = c.status.toUpperCase();
            counts[key] = (counts[key] ?? 0) + 1;
        }
        return counts;
    }, [courses]);

    /* ── Render ────────────────────────────────── */

    return (
        <div className="min-h-screen p-6 text-[#E1E1E1]">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold text-[#FFFFFF]">
                        Assigned Courses
                    </h1>

                    {!loading && totalCourses > 0 && (
                        <span className="rounded-full bg-[#10A37F]/15 px-2.5 py-0.5 text-xs font-medium text-[#10A37F]">
                            {totalCourses}
                        </span>
                    )}
                </div>

                <p className="text-sm text-[#E1E1E1]/60">
                    Manage and teach your assigned courses.
                </p>
            </div>

            {/* Search */}
            <form
                onSubmit={handleSearch}
                className="mb-5 flex max-w-md gap-2"
            >
                <div className="relative flex-1">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#E1E1E1]/50"
                    />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-md border border-[#343540] bg-[#1E1E1E] py-2 pl-9 pr-3 text-sm text-[#E1E1E1] transition focus:outline-none focus:ring-2 focus:ring-[#10A37F]"
                    />
                </div>

                <button
                    type="submit"
                    className="rounded-md bg-[#10A37F] px-4 py-2 text-sm font-medium text-white shadow-md transition duration-300 hover:bg-[#0e8f70]"
                >
                    Search
                </button>
            </form>

            {/* Status filter bar — only shown when courses exist */}
            {!loading && courses.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                    {STATUS_FILTERS.map((status) => {
                        const count = statusCounts[status] ?? 0;
                        if (status !== "ALL" && count === 0) return null;

                        const isActive = activeFilter === status;

                        return (
                            <button
                                key={status}
                                onClick={() => setActiveFilter(status)}
                                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition duration-200 ${isActive
                                    ? statusFilterStyles[status]
                                    : "border border-[#343540] bg-[#1E1E1E] text-[#E1E1E1]/60 hover:border-[#10A37F]/40 hover:text-[#E1E1E1]"
                                    }`}
                            >
                                {status === "ALL" ? (
                                    <LayoutGrid size={11} />
                                ) : (
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${isActive
                                            ? "bg-current"
                                            : "bg-current opacity-60"
                                            }`}
                                    />
                                )}
                                {status}
                                <span
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isActive
                                        ? "bg-white/20"
                                        : "bg-[#343540]"
                                        }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20 text-sm text-[#E1E1E1]/60">
                    Loading...
                </div>
            )}

            {/* Empty — no courses at all */}
            {!loading && courses.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#343540] bg-[#1E1E1E] py-20 text-center">
                    <BookOpen size={32} className="text-[#E1E1E1]/40" />
                    <p className="text-sm font-medium text-[#E1E1E1]/60">
                        No courses assigned yet.
                    </p>
                    <p className="text-xs text-[#E1E1E1]/40">
                        Contact your admin to get courses assigned to you.
                    </p>
                </div>
            )}

            {/* Empty — filter has no matches */}
            {!loading &&
                courses.length > 0 &&
                filteredCourses.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#343540] bg-[#1E1E1E] py-16 text-center">
                        <p className="text-sm text-[#E1E1E1]/60">
                            No{" "}
                            <span className="font-medium text-[#E1E1E1]">
                                {activeFilter}
                            </span>{" "}
                            courses on this page.
                        </p>
                        <button
                            onClick={() => setActiveFilter("ALL")}
                            className="text-xs text-[#10A37F] hover:underline"
                        >
                            Clear filter
                        </button>
                    </div>
                )}

            {/* Grid */}
            {!loading && filteredCourses.length > 0 && (
                <>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredCourses.map((course) => (
                            <div
                                key={course.id}
                                onClick={() =>
                                    navigate(
                                        `/teacher/assigned-courses/${course.id}`,
                                    )
                                }
                                className="group flex flex-col overflow-hidden rounded-xl border border-[#343540] bg-[#1E1E1E] shadow-md transition duration-300 hover:-translate-y-1 hover:border-[#10A37F]/40 hover:shadow-lg cursor-pointer"
                            >
                                {/* Thumbnail */}
                                <div className="relative h-40 w-full overflow-hidden bg-[#0C0C0C]">
                                    <img
                                        src={
                                            course.thumbnail ||
                                            "/placeholder-course.png"
                                        }
                                        alt={course.name}
                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                    />

                                    {/* Status badge */}
                                    <span
                                        className={`absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[
                                            course.status.toUpperCase()
                                        ] ??
                                            "bg-[#E1E1E1]/10 text-[#E1E1E1]/60"
                                            }`}
                                    >
                                        {course.status}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col gap-2 p-4">
                                    <div>
                                        <h3 className="truncate text-base font-semibold text-[#FFFFFF]">
                                            {course.name}
                                        </h3>
                                        <p className="text-xs font-medium uppercase tracking-wide text-[#10A37F]">
                                            {course.code}
                                        </p>
                                    </div>

                                    {course.description && (
                                        <p className="line-clamp-2 text-sm text-[#E1E1E1]/60">
                                            {course.description}
                                        </p>
                                    )}

                                    {/* Duration + Price */}
                                    <div className="mt-auto flex items-center justify-between border-t border-[#343540] pt-3 text-sm">
                                        <div className="flex items-center gap-1.5 text-[#E1E1E1]/70">
                                            <Clock size={14} />
                                            <span>
                                                {course.duration_hours ?? "—"} hrs
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-0.5 font-semibold text-[#FFFFFF]">
                                            <IndianRupee size={14} />
                                            <span>
                                                {course.price?.toLocaleString() ??
                                                    "—"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(
                                                `/teacher/assigned-courses/${course.id}`,
                                            );
                                        }}
                                        className="flex items-center justify-center gap-2 rounded-md bg-[#10A37F]/15 px-3 py-2 text-sm font-medium text-[#10A37F] transition duration-300 group-hover:bg-[#10A37F] group-hover:text-white"
                                    >
                                        Manage Course
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination — hidden when a status filter narrows to fewer items */}
                    {activeFilter === "ALL" && totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-4">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage((prev) => prev - 1)}
                                className="rounded-md border border-[#343540] bg-[#1E1E1E] px-4 py-2 text-sm font-medium text-[#E1E1E1] transition hover:bg-[#2A2A2A] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <span className="text-sm text-[#E1E1E1]/70">
                                Page {page} of {totalPages}
                            </span>

                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage((prev) => prev + 1)}
                                className="rounded-md border border-[#343540] bg-[#1E1E1E] px-4 py-2 text-sm font-medium text-[#E1E1E1] transition hover:bg-[#2A2A2A] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AssignedCourses;