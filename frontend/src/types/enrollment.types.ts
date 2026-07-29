// enrollment.types.ts

export interface Enrollment {
    id: string;

    student_id: string;
    course_id: string;

    student_name: string;
    course_name: string;

    progress_percentage: number;
    is_completed: boolean;
    certificate_url: string | null;

    enrolled_at: string;
}

export interface EnrollStudentPayload {
    course_id: string;
}

export interface EnrollStudentResponse {
    message: string;
}

export interface DeleteEnrollmentResponse {
    message: string;
}