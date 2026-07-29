// enrollmentService.ts

import requestInstance from "@/api/requestInstance";
import { API_ENDPOINTS } from "@/api/apiEndpoints";

import type {
    EnrollStudentPayload,
    EnrollStudentResponse,
    DeleteEnrollmentResponse,
} from "@/types/enrollment.types";

class EnrollmentService {
    /* ENROLL STUDENT */
    enrollStudent(
        payload: EnrollStudentPayload,
    ): Promise<EnrollStudentResponse> {
        return requestInstance.post<EnrollStudentResponse>(
            API_ENDPOINTS.Enrollments.create,
            payload,
        );
    }

    /* DELETE ENROLLMENT */
    deleteEnrollment(
        enrollmentId: string,
    ): Promise<DeleteEnrollmentResponse> {
        return requestInstance.del<DeleteEnrollmentResponse>(
            API_ENDPOINTS.Enrollments.delete(enrollmentId),
        );
    }
}

export const enrollmentService = new EnrollmentService();