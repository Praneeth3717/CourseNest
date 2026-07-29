import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Clock,
    IndianRupee,
    User,
    CheckCircle2,
} from "lucide-react";

import { courseService } from "@/api/services/course.service";
import { enrollmentService } from "@/api/services/enrollment.service";
import type { Course } from "@/types/course.types";

const CourseDetailsPage = () => {
    const navigate = useNavigate();
    const { courseId } = useParams();

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    const [enrolled, setEnrolled] = useState(false);

    const fetchCourse = async () => {
        if (!courseId) return;

        try {
            setLoading(true);

            const response = await courseService.getCourseById(courseId);
            setCourse(response);
            setEnrolled(!!response.is_enrolled)
        } catch (error) {
            console.error("Failed to fetch course", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    const handleEnroll = async () => {
        if (!courseId) return;

        try {
            setEnrolling(true);

            await enrollmentService.enrollStudent({ course_id: courseId });

            setEnrolled(true);
        } catch (error) {
            console.error("Enrollment failed", error);
            alert("Enrollment failed. Please try again.");
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0C0C0C]">
                <p className="text-sm text-[#E1E1E1]/70">Loading course...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0C0C0C]">
                <p className="text-sm text-[#E1E1E1]/70">Course not found</p>
            </div>
        );
    }

    const isFree = !course.price || course.price <= 0;

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
                    className="h-[200px] w-full rounded-xl border border-[#343540] object-cover sm:h-[220px] sm:w-[280px] sm:flex-shrink-0"
                />

                <div className="flex flex-1 flex-col">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-semibold text-[#FFFFFF]">
                            {course.name}
                        </h1>

                        <span className="rounded-md border border-[#343540] bg-[#0C0C0C] px-2 py-1 text-xs font-medium text-[#E1E1E1]/70">
                            {course.code}
                        </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#E1E1E1]/80">
                        <div className="flex items-center gap-1.5">
                            <User size={14} />
                            <span>
                                {course.teacher?.full_name || "Instructor TBA"}
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>
                                {course.duration_hours
                                    ? `${course.duration_hours} hrs`
                                    : "Self-paced"}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-1 text-2xl font-semibold text-[#FFFFFF]">
                        {isFree ? (
                            "Free"
                        ) : (
                            <>
                                <IndianRupee size={20} />
                                {course.price?.toLocaleString()}
                            </>
                        )}
                    </div>

                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#E1E1E1]/70">
                        {course.description || "No description available."}
                    </p>

                    {/* Enroll CTA */}
                    <div className="mt-5">
                        {enrolled ? (
                            <button
                                disabled
                                className="flex items-center gap-2 rounded-md bg-[#10A37F]/15 px-5 py-2.5 text-sm font-medium text-[#10A37F]"
                            >
                                <CheckCircle2 size={16} />
                                Enrolled
                            </button>
                        ) : (
                            <button
                                onClick={handleEnroll}
                                disabled={enrolling}
                                className="flex items-center gap-2 rounded-md bg-[#10A37F] px-5 py-2.5 text-sm font-medium text-white shadow-md transition duration-300 hover:bg-[#0e8f70] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {enrolling ? "Enrolling..." : "Enroll Now"}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Course info */}
            <div className="mt-6 rounded-xl border border-[#343540] bg-[#1E1E1E] p-6 shadow-md">
                <h2 className="mb-4 text-sm font-semibold text-[#FFFFFF]">
                    Course Details
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailItem
                        label="Duration"
                        value={
                            course.duration_hours
                                ? `${course.duration_hours} hrs`
                                : "Self-paced"
                        }
                    />

                    <DetailItem
                        label="Instructor"
                        value={course.teacher?.full_name ?? "TBA"}
                    />

                    <DetailItem
                        label="Price"
                        value={
                            isFree
                                ? "Free"
                                : `₹${course.price?.toLocaleString()}`
                        }
                    />

                    <DetailItem label="Course Code" value={course.code} />
                </div>
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

export default CourseDetailsPage;