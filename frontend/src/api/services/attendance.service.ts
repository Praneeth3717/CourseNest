import requestInstance from "@/api/requestInstance";
import { API_ENDPOINTS } from "@/api/apiEndpoints";

import type {
    MarkAttendancePayload,
    MarkAttendanceResponse,
    GetSessionAttendanceParams,
    GetSessionAttendanceResponse,
    UpdateAttendancePayload,
    UpdateAttendanceResponse,
} from "@/types/attendance.types";

class AttendanceService {
    /* MARK SESSION ATTENDANCE */
    markAttendance(
        sessionId: string,
        payload: MarkAttendancePayload,
    ): Promise<MarkAttendanceResponse> {
        return requestInstance.post<MarkAttendanceResponse>(
            API_ENDPOINTS.Attendance.mark(sessionId),
            payload,
        );
    }

    /* GET SESSION ATTENDANCE */
    getSessionAttendance(
        sessionId: string,
        params?: GetSessionAttendanceParams,
    ): Promise<GetSessionAttendanceResponse> {
        return requestInstance.get<GetSessionAttendanceResponse>(
            API_ENDPOINTS.Attendance.getBySession(sessionId),
            {
                params,
            },
        );
    }

    /* UPDATE ATTENDANCE */
    updateAttendance(
        attendanceId: string,
        payload: UpdateAttendancePayload,
    ): Promise<UpdateAttendanceResponse> {
        return requestInstance.patch<UpdateAttendanceResponse>(
            API_ENDPOINTS.Attendance.update(attendanceId),
            payload,
        );
    }
}

export const attendanceService = new AttendanceService();