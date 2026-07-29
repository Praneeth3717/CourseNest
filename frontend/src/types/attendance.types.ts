// attendance.types.ts

/* Confirm actual enum values against app.models.attendance.AttendanceStatus —
   other enums in this codebase (SessionStatusEnum, CourseStatus) are uppercase,
   so this is likely "PRESENT" | "ABSENT" rather than lowercase. Update if needed. */
export type AttendanceStatus =
    | "present"
    | "absent";

export interface Attendance {
    id: string;
    session_id: string;
    enrollment_id: string;
    status: AttendanceStatus;
    remarks: string | null;
    marked_at: string;
    created_at: string;
    updated_at: string;
}

export interface AttendanceStudent {
    attendance_id: string;
    enrollment_id: string;
    student_id: string;

    full_name: string;
    phone: string | null;
    profile_image: string | null;

    status: AttendanceStatus;
    remarks: string | null;
    marked_at: string;
}

/* MARK ATTENDANCE */

export interface AttendanceEntryPayload {
    enrollment_id: string;
    status: AttendanceStatus;
    remarks?: string | null;
}

export interface MarkAttendancePayload {
    attendance: AttendanceEntryPayload[];
}

/* mark_session_attendance returns AttendanceListResponse directly, flat */
export interface MarkAttendanceResponse {
    items: Attendance[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

/* GET SESSION ATTENDANCE */

export interface GetSessionAttendanceParams extends Record<
    string,
    string | number | boolean | null | undefined
> {
    page?: number;
    limit?: number;
    search?: string;
}

/* get_session_attendance returns SessionAttendanceStudentsListResponse directly, flat */
export interface GetSessionAttendanceResponse {
    items: AttendanceStudent[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

/* UPDATE ATTENDANCE */

export interface UpdateAttendancePayload {
    status: AttendanceStatus;
    remarks?: string | null;
}

/* update_attendance returns serialize_attendance(attendance) -> AttendanceData directly */
export type UpdateAttendanceResponse = Attendance;