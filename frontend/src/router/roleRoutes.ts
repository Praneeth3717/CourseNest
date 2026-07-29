import type { RouteKey } from "@/router/routes.config";

export type UserRole =
  | "Admin"
  | "Teacher"
  | "Student"

const RoleRouteMap: Record<UserRole, RouteKey[]> = {
  "Admin": ["Profile", "AdminDashboard", "TeachersTable", "TeacherPage", "UpdateTeacherPage", "StudentsTable", "UpdateStudentPage", "StudentPage", "CreateCoursePage", "UpdateCoursePage", "CoursesPage", "CoursePage"],
  "Teacher": ["Profile", "TeacherDashboard", "AssignedCoursesPage", "AssignedCourseDetailsPage", "SessionDetailsPage"],
  "Student": ["Profile", "StudentDashboard", "ExploreCoursesPage", "CourseDetailsPage", "MyCoursesPage", "ChatPage"],
};

export default RoleRouteMap;