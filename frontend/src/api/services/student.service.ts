import requestInstance from "@/api/requestInstance";
import { API_ENDPOINTS } from "@/api/apiEndpoints";

import type {
    CreateStudentPayload,
    CreateStudentResponse,
    GetStudentsParams,
    GetStudentsResponse,
    GetStudentByIdResponse,
    UpdateStudentPayload,
    UpdateStudentResponse,
    DeleteStudentResponse,
    GetStudentCoursesParams,
    GetStudentCoursesResponse,
    StudentDashboardResponse,
    StudentCourseSummaryResponse,
} from "@/types/student.types";

class StudentService {
    /* CREATE STUDENT */
    createStudent(
        payload: CreateStudentPayload,
    ): Promise<CreateStudentResponse> {
        return requestInstance.post<CreateStudentResponse>(
            API_ENDPOINTS.Students.create,
            payload,
        );
    }

    /* GET STUDENTS */
    getStudents(
        params?: GetStudentsParams,
    ): Promise<GetStudentsResponse> {
        return requestInstance.get<GetStudentsResponse>(
            API_ENDPOINTS.Students.getAll,
            { params },
        );
    }

    /* GET STUDENT BY ID */
    getStudentById(
        studentId: string,
    ): Promise<GetStudentByIdResponse> {
        return requestInstance.get<GetStudentByIdResponse>(
            API_ENDPOINTS.Students.getById(studentId),
        );
    }

    /* UPDATE STUDENT */
    updateStudent(
        studentId: string,
        payload: UpdateStudentPayload,
    ): Promise<UpdateStudentResponse> {
        const formData = new FormData();

        if (payload.full_name)
            formData.append("full_name", payload.full_name);
        if (payload.phone)
            formData.append("phone", payload.phone);
        if (payload.dob)
            formData.append("dob", payload.dob);
        if (payload.gender)
            formData.append("gender", payload.gender);
        if (payload.address)
            formData.append("address", payload.address);
        if (payload.profile_image)
            formData.append("profile_image", payload.profile_image);

        return requestInstance.patch<UpdateStudentResponse>(
            API_ENDPOINTS.Students.update(studentId),
            formData,
        );
    }

    /* DELETE STUDENT */
    deleteStudent(
        studentId: string,
    ): Promise<DeleteStudentResponse> {
        return requestInstance.del<DeleteStudentResponse>(
            API_ENDPOINTS.Students.delete(studentId),
        );
    }

    /* GET STUDENT COURSES */
    getStudentCourses(
        studentId: string,
        params?: GetStudentCoursesParams,
    ): Promise<GetStudentCoursesResponse> {
        return requestInstance.get<GetStudentCoursesResponse>(
            API_ENDPOINTS.Students.getCourses(studentId),
            { params },
        );
    }

    /* GET STUDENT DASHBOARD */
    getStudentDashboard(): Promise<StudentDashboardResponse> {
        return requestInstance.get<StudentDashboardResponse>(
            API_ENDPOINTS.Students.dashboard,
        );
    }

    /* GET COURSE SUMMARY */
    getStudentCourseSummary(
        courseId: string,
    ): Promise<StudentCourseSummaryResponse> {
        return requestInstance.get<StudentCourseSummaryResponse>(
            API_ENDPOINTS.Students.courseSummary(courseId),
        );
    }
}

export const studentService = new StudentService();