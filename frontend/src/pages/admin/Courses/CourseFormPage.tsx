// pages/admin/Courses/CourseFormPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    Clock,
    Image as ImageIcon,
    Loader2,
    TrendingUp,
    User,
} from "lucide-react";

import { courseService } from "@/api/services/course.service";
import type {
    Course,
    CourseStatus,
    CreateCoursePayload,
    UpdateCoursePayload,
} from "@/types/course.types";

const statusStyles: Record<string, string> = {
    ACTIVE: "bg-[#10A37F]/15 text-[#10A37F]",
    DRAFT: "bg-yellow-500/15 text-yellow-400",
    COMPLETED: "bg-blue-500/15 text-blue-400",
    ARCHIVED: "bg-[#E1E1E1]/10 text-[#E1E1E1]/60",
};

interface CourseFormState {
    name: string;
    code: string;
    description: string;
    duration_hours: number;
    price: number;
    status: CourseStatus;
    thumbnail: File | null;
}

const INITIAL_FORM_STATE: CourseFormState = {
    name: "",
    code: "",
    description: "",
    duration_hours: 0,
    price: 0,
    status: "DRAFT",
    thumbnail: null,
};

const inputClasses =
    "w-full rounded-md border border-[#343540] bg-[#0C0C0C] px-3 py-2 text-sm text-[#E1E1E1] transition focus:outline-none focus:ring-2 focus:ring-[#10A37F]";

const labelClasses = "mb-1.5 block text-sm font-medium text-[#E1E1E1]/80";

const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const CourseFormPage = () => {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const isEditMode = Boolean(courseId);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [course, setCourse] = useState<Course | null>(null);
    const [formData, setFormData] = useState<CourseFormState>(INITIAL_FORM_STATE);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    /* FETCH COURSE (edit mode) */
    useEffect(() => {
        if (!isEditMode) return;

        const fetchCourse = async () => {
            try {
                setLoading(true);

                const response = await courseService.getCourseById(courseId!);

                setCourse(response);

                setFormData({
                    name: response.name || "",
                    code: response.code || "",
                    description: response.description || "",
                    duration_hours: response.duration_hours ?? 0,
                    price: response.price ?? 0,
                    status: response.status || "DRAFT",
                    thumbnail: null,
                });
            } catch (error) {
                console.error("Failed to fetch course", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId, isEditMode]);

    /* PREVIEW FOR NEWLY SELECTED THUMBNAIL */
    useEffect(() => {
        if (!formData.thumbnail) {
            setThumbnailPreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(formData.thumbnail);
        setThumbnailPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [formData.thumbnail]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]:
                name === "price" || name === "duration_hours"
                    ? value === ""
                        ? 0
                        : Number(value)
                    : value,
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;

        setFormData((prev) => ({
            ...prev,
            thumbnail: file,
        }));
    };

    const handleClearSelectedThumbnail = () => {
        setFormData((prev) => ({
            ...prev,
            thumbnail: null,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSubmitting(true);

            if (isEditMode && courseId) {
                const payload: UpdateCoursePayload = {
                    name: formData.name,
                    code: formData.code,
                    description: formData.description,
                    duration_hours: formData.duration_hours,
                    price: formData.price,
                    status: formData.status,
                    thumbnail: formData.thumbnail,
                };

                const response = await courseService.updateCourse(courseId, payload);

                alert(response.message || "Course updated successfully");

                navigate(`/admin/courses/${courseId}`);
            } else {
                const payload: CreateCoursePayload = {
                    name: formData.name,
                    code: formData.code,
                    description: formData.description,
                    duration_hours: formData.duration_hours,
                    price: formData.price,
                    thumbnail: formData.thumbnail,
                };

                const response = await courseService.createCourse(payload);

                alert(response.message || "Course created successfully");

                navigate("/admin/courses");
            }
        } catch (error) {
            console.error(
                isEditMode ? "Failed to update course" : "Failed to create course",
                error,
            );

            alert(isEditMode ? "Failed to update course" : "Failed to create course");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6 text-sm text-[#E1E1E1]/60">
                <Loader2 size={18} className="mr-2 animate-spin" />
                Loading...
            </div>
        );
    }

    if (isEditMode && !course) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center text-[#E1E1E1]">
                <BookOpen size={32} className="text-[#E1E1E1]/40" />
                <p className="text-sm text-[#E1E1E1]/60">Course not found.</p>
            </div>
        );
    }

    // If your API returns relative paths for `thumbnail`, prefix this with
    // your asset/storage base URL before rendering.
    const existingThumbnailUrl = course?.thumbnail || null;

    return (
        <div className="min-h-screen p-6 text-[#E1E1E1]">
            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <div className="mb-6 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="rounded-md border border-[#343540] bg-[#1E1E1E] p-2 text-[#E1E1E1]/70 transition hover:bg-[#2A2A2A] hover:text-[#E1E1E1]"
                    >
                        <ArrowLeft size={16} />
                    </button>

                    <h1 className="text-2xl font-semibold text-[#FFFFFF]">
                        {isEditMode ? "Update Course" : "Create Course"}
                    </h1>
                </div>

                {/* Stats panel (edit mode only) */}
                {isEditMode && course && (
                    <div className="mb-6 rounded-xl border border-[#343540] bg-[#1E1E1E] p-4 sm:p-5">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-1.5 text-xs text-[#E1E1E1]/50">
                                    <TrendingUp size={14} />
                                    Progress
                                </span>
                                <span className="text-sm font-semibold text-[#FFFFFF]">
                                    {course.progress_percentage ?? 0}%
                                </span>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-1.5 text-xs text-[#E1E1E1]/50">
                                    <Clock size={14} />
                                    Hours
                                </span>
                                <span className="text-sm font-semibold text-[#FFFFFF]">
                                    {course.completed_hours ?? 0}
                                    {course.duration_hours ? ` / ${course.duration_hours}` : ""}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-1.5 text-xs text-[#E1E1E1]/50">
                                    <User size={14} />
                                    Teacher
                                </span>
                                <span className="truncate text-sm font-semibold text-[#FFFFFF]">
                                    {course.teacher?.full_name || "Unassigned"}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#E1E1E1]/50">Status</span>
                                <span
                                    className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[course.status] ?? "bg-[#E1E1E1]/10 text-[#E1E1E1]/60"
                                        }`}
                                >
                                    {course.status}
                                </span>
                            </div>
                        </div>

                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#343540]">
                            <div
                                className="h-full rounded-full bg-[#10A37F] transition-all"
                                style={{ width: `${course.progress_percentage ?? 0}%` }}
                            />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-[#343540] pt-3 text-xs text-[#E1E1E1]/50">
                            <span className="flex items-center gap-1.5">
                                <Calendar size={12} />
                                Created {formatDate(course.created_at)}
                            </span>

                            <span className="flex items-center gap-1.5">
                                <Calendar size={12} />
                                Updated {formatDate(course.updated_at)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="rounded-xl border border-[#343540] bg-[#1E1E1E] p-6 shadow-md"
                >
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label className={labelClasses}>Course Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className={inputClasses}
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Course Code</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                required
                                className={inputClasses}
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Duration (Hours)</label>
                            <input
                                type="number"
                                name="duration_hours"
                                value={formData.duration_hours}
                                onChange={handleChange}
                                min={0}
                                step="0.5"
                                className={inputClasses}
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Price</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                min={0}
                                step="0.01"
                                className={inputClasses}
                            />
                        </div>

                        {isEditMode && (
                            <div>
                                <label className={labelClasses}>Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className={inputClasses}
                                >
                                    <option value="DRAFT">Draft</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="ARCHIVED">Archived</option>
                                </select>
                            </div>
                        )}

                        <div className="sm:col-span-2">
                            <label className={labelClasses}>Thumbnail</label>

                            <div className="flex items-center gap-4">
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#343540] bg-[#0C0C0C]">
                                    {thumbnailPreview || existingThumbnailUrl ? (
                                        <img
                                            src={thumbnailPreview || existingThumbnailUrl || ""}
                                            alt="Course thumbnail"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <ImageIcon size={24} className="text-[#E1E1E1]/30" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-[#E1E1E1]/70 file:mr-3 file:rounded-md file:border-0 file:bg-[#10A37F] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white file:transition file:duration-300 hover:file:bg-[#0e8f70]"
                                    />

                                    {thumbnailPreview ? (
                                        <button
                                            type="button"
                                            onClick={handleClearSelectedThumbnail}
                                            className="mt-2 text-xs font-medium text-[#10A37F] hover:underline"
                                        >
                                            Remove selected image
                                        </button>
                                    ) : existingThumbnailUrl ? (
                                        <p className="mt-2 text-xs text-[#E1E1E1]/50">
                                            Current thumbnail. Choose a new file to replace it.
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5">
                        <label className={labelClasses}>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className={inputClasses}
                        />
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center justify-center gap-2 rounded-md bg-[#10A37F] px-4 py-2 text-sm font-medium text-white shadow-md transition duration-300 hover:bg-[#0e8f70] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting && <Loader2 size={14} className="animate-spin" />}
                            {submitting
                                ? isEditMode
                                    ? "Updating..."
                                    : "Creating..."
                                : isEditMode
                                    ? "Update Course"
                                    : "Create Course"}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="rounded-md border border-[#343540] bg-[#1E1E1E] px-4 py-2 text-sm font-medium text-[#E1E1E1] transition hover:bg-[#2A2A2A]"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CourseFormPage;