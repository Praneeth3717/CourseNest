import requestInstance from "@/api/requestInstance";
import { API_ENDPOINTS } from "@/api/apiEndpoints";

import type {
    CreateSessionPayload,
    CreateSessionResponse,
    UpdateSessionPayload,
    UpdateSessionResponse,
    GetSessionsParams,
    GetSessionsResponse,
    GetSessionByIdResponse,
    DeleteSessionResponse,
    GetCourseSessionsParams,
    GetCourseSessionsResponse,
    SessionResponsePayload,
    SessionResponseActionResponse,
    CompleteSessionResponse,
} from "@/types/session.types";

class SessionService {
    /* CREATE SESSION */
    createSession(
        courseId: string,
        payload: CreateSessionPayload,
    ): Promise<CreateSessionResponse> {
        return requestInstance.post<CreateSessionResponse>(
            API_ENDPOINTS.Sessions.create(courseId),
            payload,
        );
    }

    /* GET ALL SESSIONS */
    getSessions(
        params?: GetSessionsParams,
    ): Promise<GetSessionsResponse> {
        return requestInstance.get<GetSessionsResponse>(
            API_ENDPOINTS.Sessions.getAll,
            { params },
        );
    }

    /* GET SESSION BY ID */
    getSessionById(
        sessionId: string,
    ): Promise<GetSessionByIdResponse> {
        return requestInstance.get<GetSessionByIdResponse>(
            API_ENDPOINTS.Sessions.getById(sessionId),
        );
    }

    /* UPDATE SESSION */
    updateSession(
        sessionId: string,
        payload: UpdateSessionPayload,
    ): Promise<UpdateSessionResponse> {
        return requestInstance.patch<UpdateSessionResponse>(
            API_ENDPOINTS.Sessions.update(sessionId),
            payload,
        );
    }

    /* DELETE SESSION */
    deleteSession(
        sessionId: string,
    ): Promise<DeleteSessionResponse> {
        return requestInstance.del<DeleteSessionResponse>(
            API_ENDPOINTS.Sessions.delete(sessionId),
        );
    }

    /* GET COURSE SESSIONS */
    getCourseSessions(
        courseId: string,
        params?: GetCourseSessionsParams,
    ): Promise<GetCourseSessionsResponse> {
        return requestInstance.get<GetCourseSessionsResponse>(
            API_ENDPOINTS.Sessions.getCourseSessions(courseId),
            { params },
        );
    }

    /* RESPOND TO SESSION */
    respondToSession(
        sessionId: string,
        payload: SessionResponsePayload,
    ): Promise<SessionResponseActionResponse> {
        return requestInstance.patch<SessionResponseActionResponse>(
            API_ENDPOINTS.Sessions.respond(sessionId),
            payload,
        );
    }

    /* COMPLETE SESSION */
    completeSession(
        sessionId: string,
    ): Promise<CompleteSessionResponse> {
        return requestInstance.patch<CompleteSessionResponse>(
            API_ENDPOINTS.Sessions.complete(sessionId),
        );
    }
}

export const sessionService = new SessionService();