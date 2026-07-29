export type SessionStatus =
    | "PENDING"
    | "ACCEPTED"
    | "REJECTED"
    | "CANCELLED"
    | "COMPLETED";

export interface Session {
    id: string;
    course_id: string;
    teacher_id: string;

    title: string;
    description: string | null;

    scheduled_start: string;
    duration_hours: number;

    attendance_marked: boolean;
    status: SessionStatus;

    teacher_response_message: string | null;
    responded_at: string | null;

    created_at: string;
    updated_at: string;
}

/* CREATE SESSION */

export interface CreateSessionPayload {
    title: string;
    description?: string | null;
    scheduled_start: string; // ISO datetime
    duration_hours: number;
}

/* create_class_session returns serialize_classSession(session) -> SessionData directly */
export type CreateSessionResponse = Session;

/* UPDATE SESSION */

export interface UpdateSessionPayload {
    title?: string | null;
    description?: string | null;
    scheduled_start?: string | null;
    duration_hours?: number | null;
}

/* update_session returns SessionData directly */
export type UpdateSessionResponse = Session;

/* GET SESSIONS */

export interface GetSessionsParams extends Record<
    string,
    string | number | boolean | null | undefined
> {
    page?: number;
    limit?: number;
    status_filter?: SessionStatus;
}

/* SessionListResponse: flat, no wrapper */
export interface GetSessionsResponse {
    items: Session[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

/* GET SESSION BY ID */

/* get_session_by_id returns SessionData directly */
export type GetSessionByIdResponse = Session;

/* DELETE SESSION */

/* delete_session returns {"message": "..."} -> MessageResponse, genuinely has message */
export interface DeleteSessionResponse {
    message: string;
}

/* COURSE SESSIONS */

export interface GetCourseSessionsParams extends Record<
    string,
    string | number | boolean | null | undefined
> {
    page?: number;
    limit?: number;
    search?: string;
    status_filter?: SessionStatus;
}

/* SessionListResponse: flat, no wrapper */
export interface GetCourseSessionsResponse {
    items: Session[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

/* SESSION RESPONSE (accept/reject) */

export interface SessionResponsePayload {
    status: "ACCEPTED" | "REJECTED";
    message?: string | null;
}

/* respond_to_session_request returns SessionData directly */
export type SessionResponseActionResponse = Session;

/* COMPLETE SESSION */

/* complete_session returns SessionData directly */
export type CompleteSessionResponse = Session;