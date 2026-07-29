import type { ReactNode } from "react";

import Login from "@/pages/auth/Login";
import AdminDashboard from "@/pages/admin/AdminDashboard/AdminDashboard";
import PasswordFormPage from "@/pages/auth/PasswordFormPage";
import TeachersTable from "@/pages/admin/Teachers/TeachersTable";
import TeacherPage from "@/pages/admin/Teachers/TeacherPage";
import UpdateTeacherPage from "@/pages/admin/Teachers/UpdateTeacherPage";
import StudentsTable from "@/pages/admin/Students/StudentsTable";
import UpdateStudentPage from "@/pages/admin/Students/UpdateStudentPage";
import StudentPage from "@/pages/admin/Students/StudentPage";
import CoursesPage from "@/pages/admin/Courses/CoursesPage";
import CoursePage from "@/pages/admin/Courses/CoursePage";
import CourseFormPage from "@/pages/admin/Courses/CourseFormPage";
import ExploreCourses from "@/pages/student/ExploreCourses/ExploreCourses";
import CourseDetailsPage from "@/pages/student/CourseDetails/CourseDetailsPage";
import ProfilePage from "@/pages/Profile/ProfilePage";
import MyCourses from "@/pages/student/MyCourses/MyCourses";
import AssignedCourses from "@/pages/Teacher/AssignedCourses/AssignedCourses";
import AssignedCourseDetails from "@/pages/Teacher/AssignedCourseDetails/AssignedCourseDetails";
import SessionDetails from "@/pages/Teacher/SessionDetails/SessionDetails";
import TeacherDashboard from "@/pages/Teacher/TeacherDashboard/TeacherDashboard";
import StudentDashboard from "@/pages/student/Dashboard/StudentDashboard";
import Chat from "@/pages/chat/Chat";

export interface AppRoute {
  path: string;
  element: ReactNode;
  isPublic?: boolean;
  isDefault?: boolean;
}

export const routes: Record<string, AppRoute> = {
  Profile: {
    path: "/profile",
    element: <ProfilePage />,
  },
  AdminDashboard: {
    path: "/admin/dashboard",
    element: <AdminDashboard />,
    isDefault: true,
  },
  TeachersTable: {
    path: "/admin/teachers",
    element: <TeachersTable />,
  },
  TeacherPage: {
    path: "/admin/teachers/:teacherId",
    element: <TeacherPage />,
  },
  UpdateTeacherPage: {
    path: "/admin/teachers/:teacherId/edit",
    element: <UpdateTeacherPage />,
  },
  StudentsTable: {
    path: "/admin/students",
    element: <StudentsTable />,
  },
  StudentPage: {
    path: "/admin/students/:studentId",
    element: <StudentPage />,
  },
  UpdateStudentPage: {
    path: "/admin/students/:studentId/edit",
    element: <UpdateStudentPage />,
  },
  CreateCoursePage: {
    path: "/admin/courses/create",
    element: <CourseFormPage />,
  },
  UpdateCoursePage: {
    path: "/admin/courses/edit/:courseId",
    element: <CourseFormPage />,
  },
  CoursesPage: {
    path: "/admin/courses",
    element: <CoursesPage />,
  },
  CoursePage: {
    path: "/admin/courses/:courseId",
    element: <CoursePage />,
  },
  StudentDashboard: {
    path: "/student/dashboard",
    element: <StudentDashboard />,
    isDefault: true
  },
  MyCoursesPage: {
    path: "/student/my-courses",
    element: <MyCourses />
  },
  ExploreCoursesPage: {
    path: "/student/explore-courses",
    element: <ExploreCourses />,
  },
  CourseDetailsPage: {
    path: "/student/courses/:courseId",
    element: <CourseDetailsPage />,
  },
  /* Teacher Pages */
  TeacherDashboard: {
    path: "/teacher/dashboard",
    element: <TeacherDashboard />,
    isDefault: true
  },
  AssignedCoursesPage: {
    path: "/teacher/assigned-courses",
    element: <AssignedCourses />
  },
  AssignedCourseDetailsPage: {
    path: "/teacher/assigned-courses/:courseId",
    element: <AssignedCourseDetails />
  },
  SessionDetailsPage: {
    path: "/courses/:courseId/sessions/:sessionId",
    element: <SessionDetails />,
  },
  /* Chat Page */
  ChatPage: {
    path: "/student/chat",
    element: <Chat />
  },
  /* Login Pages */
  login: {
    path: "/login",
    element: <Login />,
    isPublic: true,
  },
  setupPassword: {
    path: "/setup-password",
    element: <PasswordFormPage />,
    isPublic: true,
  },
  resetPassword: {
    path: "/reset-password",
    element: <PasswordFormPage />,
    isPublic: true,
  },
};

export type RouteKey = keyof typeof routes;

export const publicRoutes = Object.values(routes).filter((r) => r.isPublic === true);
export const privateRoutes = Object.values(routes).filter((r) => r.isPublic !== true);
