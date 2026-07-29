// student.types.ts

export type Gender = "Male" | "Female" | "Other";

// ─── Core Student ─────────────────────────────────────────────────────────────

export interface Student {
    id: string;
    user_id: string;
    email: string;
    full_name: string;
    phone: string | null;
    dob: string | null;
    gender: Gender | null;
    address: string | null;
    profile_image: string | null;
    created_at: string;
}

// ─── Course Status ────────────────────────────────────────────────────────────

export type CourseStatus =
    | "DRAFT"
    | "ACTIVE"
    | "COMPLETED"
    | "ARCHIVED";

// ─── Create ───────────────────────────────────────────────────────────────────

export interface CreateStudentPayload {
    email: string;
    full_name: string;
}

/* create_student returns serialize_student(student) -> StudentData directly */
export type CreateStudentResponse = Student;

// ─── Get Students ─────────────────────────────────────────────────────────────

export interface GetStudentsParams extends Record<
    string,
    string | number | boolean | null | undefined
> {
    page?: number;
    limit?: number;
    search?: string;
}

/* StudentListResponse: flat, no wrapper */
export interface GetStudentsResponse {
    items: Student[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

// ─── Student Course Item (used both in get-by-id and get-courses) ─────────────

export interface StudentCourseItem {
    enrollment_id: string;
    course_id: string;
    name: string;
    code: string;
    thumbnail: string | null;

    course_progress_percentage: number;
    student_progress_percentage: number;

    is_completed: boolean;
    enrolled_at: string;
}

// ─── Get Student By ID ────────────────────────────────────────────────────────

/* StudentWithCoursesData: StudentData + courses, flat */
export interface StudentWithCourses extends Student {
    courses: StudentCourseItem[];
}

export type GetStudentByIdResponse = StudentWithCourses;

// ─── Update Student ───────────────────────────────────────────────────────────

export interface UpdateStudentPayload {
    full_name?: string | null;
    phone?: string | null;
    dob?: string | null;
    gender?: Gender | null;
    address?: string | null;
    profile_image?: File | null;
}

/* update_student returns serialize_student(student) -> StudentData directly */
export type UpdateStudentResponse = Student;

// ─── Delete Student ───────────────────────────────────────────────────────────

/* delete_student returns MessageResponse -> genuinely has a message field */
export interface DeleteStudentResponse {
    message: string;
}

// ─── Get Student Courses ──────────────────────────────────────────────────────

export interface GetStudentCoursesParams extends Record<
    string,
    string | number | boolean | null | undefined
> {
    page?: number;
    limit?: number;
    search?: string;
    status_filter?: "ACTIVE" | "COMPLETED";
}

/* StudentCourseListResponse: flat, no wrapper */
export interface GetStudentCoursesResponse {
    items: StudentCourseItem[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface StudentDashboardCards {
    enrolled_courses: number;
    active_courses: number;
    completed_courses: number;
    hours_learned: number;
}

export interface StudentUpcomingSession {
    session_id: string;
    course_id: string;
    course_name: string;
    session_title: string;
    scheduled_start: string;
    duration_hours: number;
}

/* StudentDashboardResponse: flat, no wrapper */
export interface StudentDashboardResponse {
    cards: StudentDashboardCards;
    upcoming_sessions: StudentUpcomingSession[];
}

// ─── Course Summary ───────────────────────────────────────────────────────────

export interface StudentNextSession {
    session_id: string;
    title: string;
    scheduled_start: string;
    duration_hours: number;
}

/* StudentCourseSummaryResponse: flat, no wrapper */
export interface StudentCourseSummaryResponse {
    course_id: string;
    course_name: string;
    course_code: string;
    status: CourseStatus;

    enrollment_id: string;
    is_completed: boolean;
    certificate_url: string | null;

    total_hours: number;
    attended_hours: number;
    remaining_hours: number;
    progress_percentage: number;

    total_sessions: number;
    completed_sessions: number;
    upcoming_sessions: number;
    missed_sessions: number;

    attended_sessions: number;
    absent_sessions: number;
    attendance_percentage: number;

    next_session: StudentNextSession | null;
}