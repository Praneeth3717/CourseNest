import type { Teacher } from "./teacher.types";

export type CourseStatus =
    | "DRAFT"
    | "ACTIVE"
    | "COMPLETED"
    | "ARCHIVED";

/* Matches backend CourseData exactly — returned by create_course / update_course */
export interface CourseData {
    id: string;
    teacher_id: string | null;

    name: string;
    code: string;

    description: string | null;
    thumbnail: string | null;

    duration_hours: number | null;
    price: number | null;

    status: CourseStatus;

    created_at: string;
    updated_at: string;
}

export interface CourseTeacherSummary {
    id: string;
    full_name: string;
    phone: string | null;
    profile_image: string | null;
    specialization: string | null;
    qualification: string | null;
}

/* Matches backend CourseResponse (CourseData + extra fields) — returned by get_courses / get_course_by_id */
export interface Course extends CourseData {
    completed_hours: number;
    progress_percentage: number;
    teacher: CourseTeacherSummary | null;
    is_enrolled: boolean | null;
}

export interface CourseDropdown {
    id: string;
    name: string;
    code: string;
}

export interface CourseStudent {
    enrollment_id: string;

    student_id: string;
    full_name: string;
    phone: string | null;
    profile_image: string | null;

    progress_percentage: number;
    is_completed: boolean;

    enrolled_at: string;
}

/* CREATE */

export interface CreateCoursePayload {
    name: string;
    code: string;
    description?: string | null;
    duration_hours?: number | null;
    price?: number | null;
    thumbnail?: File | null;
}

/* create_course returns serialize_course(course) -> CourseData directly */
export type CreateCourseResponse = CourseData;

/* GET ALL */

export interface GetCoursesParams extends Record<
    string,
    string | number | boolean | null | undefined
> {
    page?: number;
    limit?: number;
    search?: string;
    status?: CourseStatus;
    teacher_id?: string;
}

/* CourseListResponse: flat, items are CourseResponse */
export interface GetCoursesResponse {
    items: Course[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

/* GET BY ID -> CourseResponse, flat */
export type GetCourseByIdResponse = Course;

/* UPDATE */

export interface UpdateCoursePayload {
    name?: string | null;
    code?: string | null;
    description?: string | null;
    duration_hours?: number | null;
    price?: number | null;
    status?: CourseStatus | null;
    teacher_id?: string | null;
    thumbnail?: File | null;
}

/* update_course returns serialize_course(course) -> CourseData directly */
export type UpdateCourseResponse = CourseData;

/* DELETE */

/* delete_course returns {"message": "..."} -> genuinely has a message field */
export interface DeleteCourseResponse {
    message: string;
}

/* DROPDOWN */

export interface GetCourseDropdownParams extends Record<
    string,
    string | number | boolean | null | undefined
> {
    search?: string;
    limit?: number;
}

/* response_model=list[CourseDropdownResponse] -> a bare array */
export type GetCourseDropdownResponse = CourseDropdown[];

/* ASSIGN TEACHER */

export interface AssignTeacherPayload {
    teacher_id: string;
}

/* assign_teacher_to_course has no response_model, returns {"message": "..."} raw dict */
export interface AssignTeacherResponse {
    message: string;
}

/* remove_teacher_from_course likewise */
export interface RemoveTeacherResponse {
    message: string;
}

/* COURSE STUDENTS */

export interface GetCourseStudentsParams extends Record<
    string,
    string | number | boolean | null | undefined
> {
    page?: number;
    limit?: number;
    search?: string;
}

export interface GetCourseStudentsResponse {
    items: CourseStudent[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}