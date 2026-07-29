import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Users, CalendarDays, ClipboardList, FolderOpen } from "lucide-react";

import { courseService } from "@/api/services/course.service";
import type { Course } from "@/types/course.types";

import CourseStudentsTable from "./Tables/CourseStudentsTable";
import CourseSessionsTable from "./Tables/CourseSessionsTable";

const TABS = [
    { key: "classes", label: "Classes", icon: CalendarDays },
    { key: "students", label: "Students", icon: Users },
];

const STATUS_STYLES: Record<string, string> = {
    DRAFT: "border-yellow-400/30 bg-yellow-500/10 text-yellow-400",
    ACTIVE: "border-[#10A37F]/30 bg-[#10A37F]/10 text-[#10A37F]",
    COMPLETED: "border-blue-400/30 bg-blue-500/10 text-blue-400",
    ARCHIVED: "border-[#343540] bg-[#E1E1E1]/10 text-[#E1E1E1]/60",
};

const AssignedCourseDetails = () => {
    const navigate = useNavigate();
    const { courseId } = useParams();

    const [course, setCourse] = useState<Course | null>(null);
    const [activeTab, setActiveTab] = useState("classes");
    const [loading, setLoading] = useState(false);

    const fetchCourse = async () => {
        if (!courseId) return;

        try {
            setLoading(true);
            const response = await courseService.getCourseById(courseId);
            setCourse(response);
        } catch (error) {
            console.error("Failed to fetch course", error);
        } finally {
            setLoading(false);
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

    const progressClamped = Math.min(Math.max(course.progress_percentage ?? 0, 0), 100);

    return (
        <div className="min-h-screen p-6 text-[#E1E1E1]">
            {/* Back */}
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 rounded-md border border-[#343540] bg-[#1E1E1E] px-4 py-2 text-sm font-medium text-[#E1E1E1] transition hover:bg-[#2A2A2A]"
            >
                <ArrowLeft size={16} />
                Back
            </button>

            {/* Hero Card */}
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
                                <span>⏱ {course.duration_hours ?? 0} hrs</span>

                                <span
                                    className={`rounded-md border px-2 py-1 text-xs font-medium ${STATUS_STYLES[course.status] ??
                                        "border-[#343540] bg-[#0C0C0C] text-[#E1E1E1]/70"
                                        }`}
                                >
                                    {course.status}
                                </span>
                            </div>
                        </div>

                        {/* Teacher-role action — no edit/delete; open course content instead */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(`/teacher/courses/${course.id}/content`)}
                                className="flex items-center gap-2 rounded-md bg-[#10A37F] px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-[#0e8f70]"
                            >
                                <BookOpen size={16} />
                                View Content
                            </button>
                        </div>
                    </div>

                    <div className="mt-4">
                        <h3 className="text-sm font-semibold text-[#FFFFFF]">Course Description</h3>
                        <p className="mt-1 text-sm text-[#E1E1E1]/80">
                            {course.description || "No description available."}
                        </p>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-5">
                        <div className="mb-1 flex items-center justify-between text-xs text-[#E1E1E1]/60">
                            <span>Course Progress</span>
                            <span>{progressClamped}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#343540]">
                            <div
                                className="h-full rounded-full bg-[#10A37F] transition-all duration-500"
                                style={{ width: `${progressClamped}%` }}
                            />
                        </div>
                        <p className="mt-1 text-xs text-[#E1E1E1]/50">
                            {course.completed_hours ?? 0} / {course.duration_hours ?? 0} hrs completed
                        </p>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="mt-6 rounded-xl border border-[#343540] bg-[#1E1E1E] p-6 shadow-md">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailItem label="Status" value={course.status} />
                    <DetailItem label="Duration" value={course.duration_hours !== null ? `${course.duration_hours} hrs` : null} />
                    <DetailItem label="Completed Hours" value={course.completed_hours} />
                    <DetailItem label="Progress" value={`${course.progress_percentage}%`} />
                    <DetailItem label="Course Code" value={course.code} />
                    <DetailItem label="Price" value={course.price !== undefined ? `₹${course.price.toLocaleString()}` : null} />
                    <DetailItem label="Created At" value={new Date(course.created_at).toLocaleString()} />
                    <DetailItem label="Updated At" value={new Date(course.updated_at).toLocaleString()} />
                </div>
            </div>

            {/* Tabs */}
            <div className="mt-6 flex gap-1 border-b border-[#343540]">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition ${activeTab === tab.key
                                ? "border-b-2 border-[#10A37F] text-[#FFFFFF]"
                                : "text-[#E1E1E1]/60 hover:text-[#E1E1E1]"
                                }`}
                        >
                            <Icon size={14} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
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
}) => (
    <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#E1E1E1]/50">
            {label}
        </p>
        <p className="text-sm text-[#E1E1E1]">
            {value !== null && value !== undefined && value !== "" ? value : "-"}
        </p>
    </div>
);

const PlaceholderSection = ({ label }: { label: string }) => (
    <div className="rounded-xl border border-[#343540] bg-[#1E1E1E] p-10 text-center shadow-md">
        <p className="text-sm text-[#E1E1E1]/50">{label}</p>
    </div>
);

export default AssignedCourseDetails;