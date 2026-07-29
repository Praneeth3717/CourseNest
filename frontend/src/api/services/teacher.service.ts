import requestInstance from "@/api/requestInstance";
import { API_ENDPOINTS } from "@/api/apiEndpoints";

import type {
    CreateTeacherPayload,
    CreateTeacherResponse,
    GetTeachersParams,
    GetTeachersResponse,
    GetTeacherByIdResponse,
    UpdateTeacherPayload,
    UpdateTeacherResponse,
    DeleteTeacherResponse,
    GetTeacherCoursesParams,
    GetTeacherCoursesResponse,
    TeacherDashboardResponse,
    CourseSummaryResponse,
} from "@/types/teacher.types";

class TeacherService {
    /* CREATE TEACHER */
    createTeacher(
        payload: CreateTeacherPayload,
    ): Promise<CreateTeacherResponse> {
        return requestInstance.post<CreateTeacherResponse>(
            API_ENDPOINTS.Teachers.create,
            payload,
        );
    }

    /* GET TEACHERS */
    getTeachers(
        params?: GetTeachersParams,
    ): Promise<GetTeachersResponse> {
        return requestInstance.get<GetTeachersResponse>(
            API_ENDPOINTS.Teachers.getAll,
            {
                params,
            },
        );
    }

    /* GET TEACHER BY ID */
    getTeacherById(
        teacherId: string,
    ): Promise<GetTeacherByIdResponse> {
        return requestInstance.get<GetTeacherByIdResponse>(
            API_ENDPOINTS.Teachers.getById(teacherId),
        );
    }

    /* UPDATE TEACHER */
    updateTeacher(
        teacherId: string,
        payload: UpdateTeacherPayload,
    ): Promise<UpdateTeacherResponse> {
        const formData = new FormData();

        if (payload.full_name)
            formData.append("full_name", payload.full_name);

        if (payload.phone)
            formData.append("phone", payload.phone);

        if (payload.dob)
            formData.append("dob", payload.dob);

        if (payload.gender)
            formData.append("gender", payload.gender);

        if (payload.specialization)
            formData.append("specialization", payload.specialization);

        if (payload.qualification)
            formData.append("qualification", payload.qualification);

        if (payload.experience_years !== undefined &&
            payload.experience_years !== null) {
            formData.append(
                "experience_years",
                String(payload.experience_years),
            );
        }

        if (payload.address)
            formData.append("address", payload.address);

        if (payload.profile_image) {
            formData.append(
                "profile_image",
                payload.profile_image,
            );
        }

        return requestInstance.patch<UpdateTeacherResponse>(
            API_ENDPOINTS.Teachers.update(teacherId),
            formData,
        );
    }

    /* DELETE TEACHER */
    deleteTeacher(
        teacherId: string,
    ): Promise<DeleteTeacherResponse> {
        return requestInstance.del<DeleteTeacherResponse>(
            API_ENDPOINTS.Teachers.delete(teacherId),
        );
    }

    /* GET TEACHER COURSES */
    getTeacherCourses(
        teacherId: string,
        params?: GetTeacherCoursesParams,
    ): Promise<GetTeacherCoursesResponse> {
        return requestInstance.get<GetTeacherCoursesResponse>(
            API_ENDPOINTS.Teachers.getCourses(teacherId),
            {
                params,
            },
        );
    }

    /* GET DASHBOARD DATA */
    getDashboard(): Promise<TeacherDashboardResponse> {
        return requestInstance.get<TeacherDashboardResponse>(
            API_ENDPOINTS.Teachers.dashboard,
        );
    }

    /* GET COURSE SUMMARY */
    getCourseSummary(
        courseId: string,
    ): Promise<CourseSummaryResponse> {
        return requestInstance.get<CourseSummaryResponse>(
            API_ENDPOINTS.Teachers.courseSummary(courseId),
        );
    }
}

export const teacherService = new TeacherService();