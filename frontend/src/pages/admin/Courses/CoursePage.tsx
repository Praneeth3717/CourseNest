import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

import { courseService } from "@/api/services/course.service";
import type { Course } from "@/types/course.types";

import CourseStudentsTable from "@/pages/Teacher/AssignedCourseDetails/Tables/CourseStudentsTable";
import CourseSessionsTable from "@/pages/Teacher/AssignedCourseDetails/Tables/CourseSessionsTable";

const TABS = [
    { key: "classes", label: "Classes" },
    { key: "students", label: "Students" },
];

const STATUS_STYLES: Record<string, string> = {
    DRAFT: "border-yellow-400/30 bg-yellow-500/10 text-yellow-400",
    ACTIVE: "border-[#10A37F]/30 bg-[#10A37F]/10 text-[#10A37F]",
    COMPLETED: "border-blue-400/30 bg-blue-500/10 text-blue-400",
    ARCHIVED: "border-[#343540] bg-[#E1E1E1]/10 text-[#E1E1E1]/60",
};

const CoursePage = () => {
    const navigate = useNavigate();
    const { courseId } = useParams();

    const [course, setCourse] = useState<Course | null>(null);
    const [activeTab, setActiveTab] = useState("classes");
    const [loading, setLoading] = useState(false);

    const fetchCourse = async () => {
        if (!courseId) return;

        try {
            setLoading(true);

            // getCourseById returns the Course object directly
            const response = await courseService.getCourseById(courseId);
            setCourse(response);
        } catch (error) {
            console.error("Failed to fetch course", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (
            !courseId ||
            !window.confirm("Are you sure you want to delete this course?")
        ) {
            return;
        }

        try {
            await courseService.deleteCourse(courseId);

            alert("Course deleted successfully");

            navigate("/admin/courses");
        } catch (error) {
            console.error("Failed to delete course", error);

            alert("Failed to delete course");
        }
    };

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0C0C0C]">
                <p className="text-[#E1E1E1]/70 text-sm">Loading course...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0C0C0C]">
                <p className="text-[#E1E1E1]/70 text-sm">Course not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 text-[#E1E1E1]">
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 rounded-md border border-[#343540] bg-[#1E1E1E] px-4 py-2 text-sm font-medium text-[#E1E1E1] transition hover:bg-[#2A2A2A]"
            >
                <ArrowLeft size={16} />
                Back
            </button>

            {/* Hero */}
            <div className="flex flex-col gap-6 rounded-xl border border-[#343540] bg-[#1E1E1E] p-6 shadow-md sm:flex-row">
                <img
                    src={course.thumbnail || "/placeholder-course.png"}
                    alt={course.name}
                    className="h-[160px] w-full rounded-xl border border-[#343540] object-cover sm:w-[220px] sm:flex-shrink-0"
                />

                <div className="flex-1">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-semibold text-[#FFFFFF]">
                                    {course.name}
                                </h1>

                                <span className="rounded-md border border-[#343540] bg-[#0C0C0C] px-2 py-1 text-xs font-medium text-[#E1E1E1]/70">
                                    {course.code}
                                </span>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#E1E1E1]/80">
                                <span>
                                    ⏱ {course.duration_hours ?? 0} hrs
                                </span>

                                <span>
                                    ₹{course.price?.toLocaleString() ?? 0}
                                </span>

                                <span
                                    className={`rounded-md border px-2 py-1 text-xs font-medium ${STATUS_STYLES[course.status] ??
                                        "border-[#343540] bg-[#0C0C0C] text-[#E1E1E1]/70"
                                        }`}
                                >
                                    {course.status}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() =>
                                    navigate(`/admin/courses/edit/${course.id}`)
                                }
                                className="flex items-center gap-2 rounded-md bg-[#10A37F] px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-[#0e8f70]"
                            >
                                <Pencil size={16} />
                                Edit Course
                            </button>

                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 rounded-md border border-red-400/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                            >
                                <Trash2 size={16} />
                                Delete Course
                            </button>
                        </div>
                    </div>

                    <div className="mt-4">
                        <h3 className="text-sm font-semibold text-[#FFFFFF]">
                            Course Description
                        </h3>

                        <p className="mt-1 text-sm text-[#E1E1E1]/80">
                            {course.description || "No description available."}
                        </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-6 text-sm text-[#E1E1E1]/80">
                        <div>
                            Completed Hours:{" "}
                            <strong className="text-[#E1E1E1]">
                                {course.completed_hours}/
                                {course.duration_hours ?? 0} hrs
                            </strong>
                        </div>

                        <div>
                            Progress:{" "}
                            <strong className="text-[#E1E1E1]">
                                {course.progress_percentage}%
                            </strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="mt-6 rounded-xl border border-[#343540] bg-[#1E1E1E] p-6 shadow-md">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailItem label="Status" value={course.status} />

                    <DetailItem
                        label="Duration"
                        value={
                            course.duration_hours !== null
                                ? `${course.duration_hours} hrs`
                                : null
                        }
                    />

                    <DetailItem
                        label="Completed Hours"
                        value={course.completed_hours}
                    />

                    <DetailItem
                        label="Progress"
                        value={`${course.progress_percentage}%`}
                    />

                    <DetailItem
                        label="Teacher"
                        value={course.teacher?.full_name ?? "-"}
                    />

                    <DetailItem
                        label="Created At"
                        value={new Date(course.created_at).toLocaleString()}
                    />

                    <DetailItem
                        label="Updated At"
                        value={new Date(course.updated_at).toLocaleString()}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="mt-6 flex gap-2 border-b border-[#343540]">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-sm font-medium transition ${activeTab === tab.key
                            ? "border-b-2 border-[#10A37F] text-[#FFFFFF]"
                            : "text-[#E1E1E1]/60 hover:text-[#E1E1E1]"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="mt-4">

                {activeTab === "students" && courseId && (
                    <CourseStudentsTable courseId={courseId} />
                )}

                {activeTab === "classes" && courseId && (
                    <CourseSessionsTable courseId={courseId} />
                )}

            </div>
        </div>
    );
};

const DetailItem = ({
    label,
    value,
}: {
    label: string;
    value: string | number | null | undefined;
}) => {
    return (
        <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#E1E1E1]/50">
                {label}
            </p>

            <p className="text-sm text-[#E1E1E1]">
                {value !== null && value !== undefined && value !== ""
                    ? value
                    : "-"}
            </p>
        </div>
    );
};

export default CoursePage;