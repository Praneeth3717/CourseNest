import requestInstance from "@/api/requestInstance";
import { API_ENDPOINTS } from "@/api/apiEndpoints";

import type {
    CreateCoursePayload,
    CreateCourseResponse,
    GetCoursesParams,
    GetCoursesResponse,
    GetCourseByIdResponse,
    UpdateCoursePayload,
    UpdateCourseResponse,
    DeleteCourseResponse,
    GetCourseDropdownParams,
    GetCourseDropdownResponse,
    AssignTeacherPayload,
    AssignTeacherResponse,
    RemoveTeacherResponse,
    GetCourseStudentsParams,
    GetCourseStudentsResponse,
} from "@/types/course.types";

class CourseService {
    /* CREATE COURSE */
    createCourse(
        payload: CreateCoursePayload,
    ): Promise<CreateCourseResponse> {
        const formData = new FormData();

        formData.append("name", payload.name);
        formData.append("code", payload.code);

        if (payload.description) {
            formData.append("description", payload.description);
        }

        if (
            payload.duration_hours !== undefined &&
            payload.duration_hours !== null
        ) {
            formData.append(
                "duration_hours",
                String(payload.duration_hours),
            );
        }

        if (payload.price !== undefined && payload.price !== null) {
            formData.append("price", String(payload.price));
        }

        if (payload.thumbnail) {
            formData.append("thumbnail", payload.thumbnail);
        }

        return requestInstance.post<CreateCourseResponse>(
            API_ENDPOINTS.Courses.create,
            formData,
        );
    }

    /* GET COURSES */
    getCourses(
        params?: GetCoursesParams,
    ): Promise<GetCoursesResponse> {
        return requestInstance.get<GetCoursesResponse>(
            API_ENDPOINTS.Courses.getAll,
            { params },
        );
    }

    /* GET COURSE BY ID */
    getCourseById(
        courseId: string,
    ): Promise<GetCourseByIdResponse> {
        return requestInstance.get<GetCourseByIdResponse>(
            API_ENDPOINTS.Courses.getById(courseId),
        );
    }

    /* UPDATE COURSE */
    updateCourse(
        courseId: string,
        payload: UpdateCoursePayload,
    ): Promise<UpdateCourseResponse> {
        const formData = new FormData();

        if (payload.name !== undefined && payload.name !== null) {
            formData.append("name", payload.name);
        }

        if (payload.code !== undefined && payload.code !== null) {
            formData.append("code", payload.code);
        }

        if (
            payload.description !== undefined &&
            payload.description !== null
        ) {
            formData.append("description", payload.description);
        }

        if (
            payload.duration_hours !== undefined &&
            payload.duration_hours !== null
        ) {
            formData.append(
                "duration_hours",
                String(payload.duration_hours),
            );
        }

        if (payload.price !== undefined && payload.price !== null) {
            formData.append("price", String(payload.price));
        }

        if (payload.status) {
            formData.append("status", payload.status);
        }

        if (payload.teacher_id) {
            formData.append("teacher_id", payload.teacher_id);
        }

        if (payload.thumbnail) {
            formData.append("thumbnail", payload.thumbnail);
        }

        return requestInstance.patch<UpdateCourseResponse>(
            API_ENDPOINTS.Courses.update(courseId),
            formData,
        );
    }

    /* DELETE COURSE */
    deleteCourse(
        courseId: string,
    ): Promise<DeleteCourseResponse> {
        return requestInstance.del<DeleteCourseResponse>(
            API_ENDPOINTS.Courses.delete(courseId),
        );
    }

    /* COURSE DROPDOWN */
    getCourseDropdown(
        params?: GetCourseDropdownParams,
    ): Promise<GetCourseDropdownResponse> {
        return requestInstance.get<GetCourseDropdownResponse>(
            API_ENDPOINTS.Courses.options,
            { params },
        );
    }

    /* ASSIGN TEACHER */
    assignTeacher(
        courseId: string,
        payload: AssignTeacherPayload,
    ): Promise<AssignTeacherResponse> {
        return requestInstance.patch<AssignTeacherResponse>(
            API_ENDPOINTS.Courses.assignTeacher(courseId),
            undefined,
            {
                params: {
                    teacher_id: payload.teacher_id,
                },
            },
        );
    }

    /* REMOVE TEACHER */
    removeTeacher(
        courseId: string,
    ): Promise<RemoveTeacherResponse> {
        return requestInstance.patch<RemoveTeacherResponse>(
            API_ENDPOINTS.Courses.removeTeacher(courseId),
        );
    }

    /* GET COURSE STUDENTS */
    getCourseStudents(
        courseId: string,
        params?: GetCourseStudentsParams,
    ): Promise<GetCourseStudentsResponse> {
        return requestInstance.get<GetCourseStudentsResponse>(
            API_ENDPOINTS.Courses.students(courseId),
            {
                params,
            },
        );
    }
}

export const courseService = new CourseService();