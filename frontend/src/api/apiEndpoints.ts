// api/apiEndpoints.ts

export const API_ENDPOINTS = {
  Auth: {
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",

    getMe: "/auth/me",

    setupPassword: "/auth/setup-password",
    resetPassword: "/auth/reset-password",
    requestPasswordReset: "/auth/request-password-reset",
    changePassword: "/auth/change-password",
    resendSetupEmail: (userId: string) => `/auth/${userId}/resend-setup-email`,
  },
  Admin: {
    dashboard: "/admin/dashboard",
    dashboardCharts: "/admin/dashboard/charts",
  },
  Teachers: {
    create: "/teachers/",
    getAll: "/teachers/",
    delete: (teacherId: string) => `/teachers/${teacherId}`,
    getById: (teacherId: string) => `/teachers/${teacherId}`,
    update: (teacherId: string) => `/teachers/${teacherId}`,
    getCourses: (teacherId: string) => `/teachers/${teacherId}/courses`,
    dashboard: "/teachers/dashboard",
    courseSummary: (courseId: string) => `/teachers/dashboard/course/${courseId}`,
  },
  Students: {
    create: "/students/",
    getAll: "/students/",
    delete: (studentId: string) => `/students/${studentId}`,
    getById: (studentId: string) => `/students/${studentId}`,
    update: (studentId: string) => `/students/${studentId}`,
    getCourses: (studentId: string) => `/students/${studentId}/courses`,
    dashboard: "/students/dashboard",
    courseSummary: (courseId: string) => `/students/dashboard/course/${courseId}`,
  },
  Courses: {
    create: "/courses/",
    getAll: "/courses/",
    delete: (courseId: string) => `/courses/${courseId}`,
    getById: (courseId: string) => `/courses/${courseId}`,
    update: (courseId: string) => `/courses/${courseId}`,

    options: "/courses/options",
    assignTeacher: (courseId: string) => `/courses/${courseId}/assign-teacher`,
    removeTeacher: (courseId: string) => `/courses/${courseId}/remove-teacher`,

    students: (courseId: string) => `/courses/${courseId}/students`,

    getSessions: (courseId: string) => `/courses/${courseId}/sessions`,
    createSession: (courseId: string) => `/courses/${courseId}/sessions`,
  },
  Sessions: {
    create: (courseId: string) => `/courses/${courseId}/sessions`,
    getAll: "/courses/sessions",
    getById: (sessionId: string) => `/courses/sessions/${sessionId}`,
    update: (sessionId: string) => `/courses/sessions/${sessionId}`,
    delete: (sessionId: string) => `/courses/sessions/${sessionId}`,
    getCourseSessions: (courseId: string) => `/courses/${courseId}/sessions`,
    respond: (sessionId: string) => `/courses/sessions/${sessionId}/respond`,
    complete: (sessionId: string) => `/courses/sessions/${sessionId}/complete`,
  },
  Enrollments: {
    create: "/enrollments",
    updateProgress: (id: string) => `/enrollments/${id}/progress`,
    issueCertificate: (id: string) => `/enrollments/${id}/certificate`,
    delete: (id: string) => `/enrollments/${id}`,
  },
  Attendance: {
    mark: (sessionId: string) => `/attendance/${sessionId}`,
    getBySession: (sessionId: string) => `/attendance/${sessionId}`,
    update: (attendanceId: string) =>
      `/attendance/${attendanceId}`,
  },
  Chat: {
    send: "/chat",
    conversations: "/chat/conversations",
    conversationDetail: (conversationId: string) => `/chat/conversations/${conversationId}`,
  },
};