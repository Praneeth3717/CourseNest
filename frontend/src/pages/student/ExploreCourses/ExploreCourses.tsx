import React, {
    useEffect,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { Search, Clock, IndianRupee, BookOpen, User, ArrowRight, CheckCircle2 } from "lucide-react";

import { courseService } from "@/api/services/course.service";
import type { Course } from "@/types/course.types";

const PAGE_SIZE = 8;

const ExploreCourses = () => {
    const navigate = useNavigate();

    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const loadCourses = async (pageNum: number, searchTerm: string) => {
        try {
            setLoading(true);

            const response = await courseService.getCourses({
                page: pageNum,
                limit: PAGE_SIZE,
                search: searchTerm,
                status: "ACTIVE",
            });

            setCourses(response.items);
            setTotalPages(response.total_pages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourses(page, search);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        await loadCourses(1, search);
    };

    return (
        <div className="min-h-screen p-6 text-[#E1E1E1]">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-semibold text-[#FFFFFF]">
                    Explore Courses
                </h1>
                <p className="text-sm text-[#E1E1E1]/60">
                    Browse available courses and enroll in the ones that match your goals.
                </p>
            </div>

            {/* Search bar */}
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

            {/* Loading state */}
            {loading && (
                <div className="flex items-center justify-center py-20 text-sm text-[#E1E1E1]/60">
                    Loading...
                </div>
            )}

            {/* Empty state */}
            {!loading && courses.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#343540] bg-[#1E1E1E] py-20 text-center">
                    <BookOpen size={32} className="text-[#E1E1E1]/40" />
                    <p className="text-sm text-[#E1E1E1]/60">
                        No courses found.
                    </p>
                </div>
            )}

            {/* Grid */}
            {!loading && courses.length > 0 && (
                <>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                onClick={() =>
                                    navigate(`/student/courses/${course.id}`)
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
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col gap-2 p-4">
                                    <h3 className="truncate text-base font-semibold text-[#FFFFFF]">
                                        {course.name}
                                    </h3>

                                    <p className="text-xs font-medium uppercase tracking-wide text-[#10A37F]">
                                        {course.code}
                                    </p>

                                    {course.description && (
                                        <p className="line-clamp-2 text-sm text-[#E1E1E1]/60">
                                            {course.description}
                                        </p>
                                    )}

                                    <div className="mt-2 flex items-center justify-between border-t border-[#343540] pt-3 text-sm">
                                        <div className="flex items-center gap-1.5 text-[#E1E1E1]/70">
                                            <Clock size={14} />
                                            <span>
                                                {course.duration_hours ?? "-"}{" "}
                                                hrs
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 font-semibold text-[#FFFFFF]">
                                            <IndianRupee size={14} />
                                            <span>
                                                {course.price?.toLocaleString() ??
                                                    "-"}
                                            </span>
                                        </div>
                                    </div>

                                    {course.teacher && (
                                        <p className="flex items-center gap-1.5 text-xs text-[#E1E1E1]/50">
                                            <User size={12} />
                                            <span className="text-[#E1E1E1]/80">
                                                {course.teacher.full_name}
                                            </span>
                                        </p>
                                    )}

                                    {/* CTA */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!course.is_enrolled) {
                                                navigate(`/student/courses/${course.id}`);
                                            }
                                        }}
                                        disabled={!!course.is_enrolled}
                                        className={`mt-2 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition duration-300 ${course.is_enrolled
                                            ? "cursor-not-allowed bg-[#10A37F]/10 text-[#10A37F]"
                                            : "bg-[#10A37F]/15 text-[#10A37F] group-hover:bg-[#10A37F] group-hover:text-white"
                                            }`}
                                    >
                                        {course.is_enrolled ? (
                                            <>
                                                <CheckCircle2 size={14} />
                                                Enrolled
                                            </>
                                        ) : (
                                            <>
                                                View & Enroll
                                                <ArrowRight size={14} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <button
                            disabled={page === 1}
                            onClick={() =>
                                setPage((prev) => prev - 1)
                            }
                            className="rounded-md border border-[#343540] bg-[#1E1E1E] px-4 py-2 text-sm font-medium text-[#E1E1E1] transition hover:bg-[#2A2A2A] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <span className="text-sm text-[#E1E1E1]/70">
                            Page {page} of {totalPages}
                        </span>

                        <button
                            disabled={page === totalPages}
                            onClick={() =>
                                setPage((prev) => prev + 1)
                            }
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

export default ExploreCourses;