import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import {
    Search,
    BookOpen,
    CheckCircle2,
    Clock4,
    CalendarDays,
    ArrowRight,
} from "lucide-react";

import { studentService } from "@/api/services/student.service";
import type { StudentCourseItem } from "@/types/student.types";

import { useAppSelector } from "@/store/hooks";

const PAGE_SIZE = 12;

const MyCourses = () => {
    const navigate = useNavigate();

    const profile_id = useAppSelector(
        (state) => state.auth.profile?.id,
    );

    const [courses, setCourses] = useState<StudentCourseItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const loadCourses = async (
        currentPage = page,
        currentSearch = search,
    ) => {
        if (!profile_id) return;

        try {
            setLoading(true);

            const response = await studentService.getStudentCourses(
                profile_id,
                {
                    page: currentPage,
                    limit: PAGE_SIZE,
                    search: currentSearch || undefined,
                },
            );

            setCourses(response.items);
            setTotalPages(response.total_pages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadCourses(1, search);
    };

    return (
        <div className="min-h-screen p-6 text-[#E1E1E1]">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-semibold text-[#FFFFFF]">
                    My Learning
                </h1>
                <p className="text-sm text-[#E1E1E1]/60">
                    Track your enrolled courses and pick up where you left off.
                </p>
            </div>

            {/* Search */}
            <form
                onSubmit={handleSearch}
                className="mb-6 flex max-w-md gap-2"
            >
                <div className="relative flex-1">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#E1E1E1]/50"
                    />
                    <input
                        type="text"
                        placeholder="Search my courses..."
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

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20 text-sm text-[#E1E1E1]/60">
                    Loading...
                </div>
            )}

            {/* Empty */}
            {!loading && courses.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#343540] bg-[#1E1E1E] py-20 text-center">
                    <BookOpen size={32} className="text-[#E1E1E1]/40" />
                    <p className="text-sm text-[#E1E1E1]/60">
                        No enrolled courses found.
                    </p>
                    <button
                        onClick={() => navigate("/student/explore")}
                        className="mt-2 rounded-md bg-[#10A37F]/15 px-4 py-2 text-sm font-medium text-[#10A37F] transition hover:bg-[#10A37F] hover:text-white"
                    >
                        Explore Courses
                    </button>
                </div>
            )}

            {/* Course grid */}
            {!loading && courses.length > 0 && (
                <>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {courses.map((course) => (
                            <div
                                key={course.enrollment_id}
                                onClick={() =>
                                    navigate(`/student/courses/${course.course_id}`)
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

                                    {/* Completion badge */}
                                    {course.is_completed && (
                                        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-[#10A37F] px-2 py-0.5 text-xs font-medium text-white">
                                            <CheckCircle2 size={11} />
                                            Completed
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col gap-3 p-4">
                                    <div>
                                        <h3 className="truncate text-base font-semibold text-[#FFFFFF]">
                                            {course.name}
                                        </h3>
                                        <p className="text-xs font-medium uppercase tracking-wide text-[#10A37F]">
                                            {course.code}
                                        </p>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between text-xs text-[#E1E1E1]/60">
                                            <span>Progress</span>
                                            <span className="font-medium text-[#E1E1E1]">
                                                {course.course_progress_percentage}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2A2A2A]">
                                            <div
                                                className="h-full rounded-full bg-[#10A37F] transition-all duration-500"
                                                style={{
                                                    width: `${course.course_progress_percentage}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Meta */}
                                    <div className="mt-auto flex items-center justify-between border-t border-[#343540] pt-3 text-xs text-[#E1E1E1]/60">
                                        <div className="flex items-center gap-1">
                                            {course.is_completed ? (
                                                <CheckCircle2
                                                    size={12}
                                                    className="text-[#10A37F]"
                                                />
                                            ) : (
                                                <Clock4 size={12} />
                                            )}
                                            <span
                                                className={
                                                    course.is_completed
                                                        ? "text-[#10A37F]"
                                                        : ""
                                                }
                                            >
                                                {course.is_completed
                                                    ? "Completed"
                                                    : "In Progress"}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <CalendarDays size={12} />
                                            <span>
                                                {new Date(
                                                    course.enrolled_at,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(
                                                `/student/courses/${course.course_id}`,
                                            );
                                        }}
                                        className="flex items-center justify-center gap-2 rounded-md bg-[#10A37F]/15 px-3 py-2 text-sm font-medium text-[#10A37F] transition duration-300 group-hover:bg-[#10A37F] group-hover:text-white"
                                    >
                                        {course.is_completed
                                            ? "Review Course"
                                            : "Continue Learning"}
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
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
                </>
            )}
        </div>
    );
};

export default MyCourses;