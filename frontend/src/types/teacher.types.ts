export type Gender =
    | "Male"
    | "Female"
    | "Other";

export type CourseStatus =
    | "ACTIVE"
    | "COMPLETED";

export interface TeacherCourse {
    id: string;
    teacher_id: string;
    name: string;
    code: string;
    duration_hours: number;
    price: number;
    status: CourseStatus;
    thumbnail: string | null;
    created_at: string;
    updated_at: string;
}

export interface TeacherCourseDetailed extends TeacherCourse {
    description: string | null;
}

export interface Teacher {
    id: string;
    user_id: string;
    email: string;
    full_name: string;
    phone: string | null;
    dob: string | null;
    gender: Gender | null;
    specialization: string | null;
    qualification: string | null;
    experience_years: number | null;
    address: string | null;
    profile_image: string | null;
    created_at: string;
}

/* GET /teachers/{id} -> TeacherCourseData (TeacherData + courses: list[CourseData]) */
export interface TeacherWithCourses extends Teacher {
    courses: TeacherCourseDetailed[];
}

export interface CreateTeacherPayload {
    email: string;
    full_name: string;
}

/* create_teacher returns serialize_teacher(teacher) -> TeacherData directly */
export type CreateTeacherResponse = Teacher;

export interface GetTeachersParams extends Record<
    string,
    string | number | boolean | null | undefined
> {
    page?: number;
    limit?: number;
    search?: string;
}

/* TeacherListResponse: flat */
export interface GetTeachersResponse {
    items: Teacher[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

/* GET TEACHER BY ID -> TeacherCourseData, flat */
export type GetTeacherByIdResponse = TeacherWithCourses;

export interface UpdateTeacherPayload {
    full_name?: string | null;
    phone?: string | null;
    dob?: string | null;
    gender?: Gender | null;
    specialization?: string | null;
    qualification?: string | null;
    experience_years?: number | null;
    address?: string | null;

    // uploaded file
    profile_image?: File | null;
}

/* update_teacher returns serialize_teacher(teacher) -> TeacherData directly */
export type UpdateTeacherResponse = Teacher;

/* delete_teacher returns {"message": "..."} -> MessageResponse, genuinely has message */
export interface DeleteTeacherResponse {
    message: string;
}

export interface GetTeacherCoursesParams extends Record<
    string,
    string | number | boolean | null | undefined
> {
    page?: number;
    limit?: number;
    search?: string;
    status_filter?: CourseStatus;
}

/* CourseListResponse: flat */
export interface GetTeacherCoursesResponse {
    items: TeacherCourseDetailed[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export interface TeacherDashboardCards {
    active_courses: number;
    upcoming_sessions: number;
    completed_sessions: number;
    teaching_hours: number;
}

export interface TeacherUpcomingSession {
    session_id: string;
    course_id: string;
    course_name: string;
    session_title: string;
    scheduled_start: string;
    duration_hours: number;
}

export interface PendingApproval {
    session_id: string;
    course_id: string;
    course_name: string;
    session_title: string;
    scheduled_start: string;
    duration_hours: number;
}

/* TeacherDashboardResponse: flat */
export interface TeacherDashboardResponse {
    cards: TeacherDashboardCards;
    upcoming_sessions: TeacherUpcomingSession[];
    pending_approvals: PendingApproval[];
}

export interface NextSession {
    session_id: string;
    title: string;
    scheduled_start: string;
    duration_hours: number;
}

/* CourseSummaryResponse: flat */
export interface CourseSummaryResponse {
    course_id: string;
    course_name: string;
    course_code: string;
    status: CourseStatus;

    total_students: number;

    total_hours: number;
    completed_hours: number;
    remaining_hours: number;
    progress_percentage: number;

    completed_sessions: number;
    upcoming_sessions: number;
    pending_sessions: number;

    low_attendance_students: number;

    next_session: NextSession | null;
}