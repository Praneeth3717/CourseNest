export type CourseStatus =
    | "Draft"
    | "Active"
    | "Completed"
    | "Archived";

export type SessionStatus =
    | "Pending"
    | "Accepted"
    | "Rejected"
    | "Completed"
    | "Cancelled";

export interface DashboardCards {
    teachers: number;
    students: number;
    total_courses: number;
    active_courses: number;
    draft_courses: number;
    completed_courses: number;
    archived_courses: number;
}

export interface DashboardRevenue {
    total_revenue: number;
    this_month_revenue: number;
    monthly_avg_revenue: number;
}

export interface UpcomingSession {
    session_id: string;
    course_id: string;
    course_name: string;

    session_title: string;

    teacher_id: string | null;
    teacher_name: string | null;

    scheduled_start: string;
    duration_hours: number;

    status: SessionStatus;
}

export interface DashboardData {
    cards: DashboardCards;
    revenue: DashboardRevenue;
    upcoming_sessions: UpcomingSession[];
}

export interface MonthlyRevenueItem {
    month: string;
    year: number;
    revenue: number;
}

export interface CourseRevenueItem {
    course_name: string;
    revenue: number;
}

export interface DashboardAnalyticsResponse {
    monthly_revenue: MonthlyRevenueItem[];
    course_revenue: CourseRevenueItem[];
}