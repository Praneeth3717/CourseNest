import React, { useState } from "react";
import {
    NavLink,
    useNavigate,
} from "react-router-dom";

import {
    LayoutDashboard,
    Users,
    BookOpen,
    ClipboardCheck,
    GraduationCap,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Bot,
} from "lucide-react";

import { UserRole } from "@/types/role";

import { useAppDispatch } from "@/store/hooks";
import { logoutUserThunk } from "@/store/thunks/authThunk";

export interface NavItem {
    label: string;
    path: string;
}

export const navigation: Record<UserRole, NavItem[]> = {
    Admin: [
        { label: "Dashboard", path: "/admin/dashboard" },
        { label: "Teachers", path: "/admin/teachers" },
        { label: "Students", path: "/admin/students" },
        { label: "Courses", path: "/admin/courses" },
    ],

    Teacher: [
        { label: "Dashboard", path: "/teacher/dashboard" },
        { label: "Assigned Courses", path: "/teacher/assigned-courses" },
    ],

    Student: [
        { label: "Dashboard", path: "/student/dashboard" },
        { label: "My Courses", path: "/student/my-courses" },
        { label: "Explore Courses", path: "/student/explore-courses" },
        { label: "AI Assistant", path: "/student/chat" },
    ],
};

interface SidebarProps {
    role: UserRole;
}

const iconMap: Record<string, React.ElementType> = {
    Dashboard: LayoutDashboard,
    Teachers: Users,
    Students: GraduationCap,
    Courses: BookOpen,
    "Assigned Courses": BookOpen,
    Attendance: ClipboardCheck,
    "My Courses": BookOpen,
    "Explore Courses": GraduationCap,
    "AI Assistant": Bot,
};

const Sidebar: React.FC<SidebarProps> = ({
    role,
}) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const [expanded, setExpanded] = useState(false);

    const links = navigation[role];

    const handleLogout = async () => {
        await dispatch(logoutUserThunk());
        navigate("/login");
    };

    return (
        <aside
            className={`relative overflow-visible flex h-screen flex-col border-r border-[#343540] bg-[#1E1E1E] transition-all duration-300 ${expanded ? "w-64" : "w-20"
                }`}
        >
            {/* Toggle */}
            <button
                onClick={() =>
                    setExpanded(!expanded)
                }
                className="absolute right-0 top-6 z-50 flex h-6 w-6 translate-x-1/2 items-center justify-center rounded-full border border-[#343540] bg-[#1E1E1E] text-[#E1E1E1] shadow-lg transition hover:bg-[#2A2A2A]"
            >
                {expanded ? (
                    <ChevronLeft size={16} />
                ) : (
                    <ChevronRight size={16} />
                )}
            </button>

            {/* Logo */}
            <div className="flex h-20 items-center border-b border-[#343540] px-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10A37F] text-white font-bold">
                        P
                    </div>

                    {expanded && (
                        <h2 className="text-lg font-semibold text-[#E1E1E1]">
                            Portal
                        </h2>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-3">
                {links.map((item) => {
                    const Icon =
                        iconMap[item.label] ??
                        LayoutDashboard;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `group flex h-12 items-center rounded-lg transition-all duration-200 ${isActive
                                    ? "bg-[#10A37F]/15 text-[#10A37F]"
                                    : "text-[#E1E1E1]/70 hover:bg-[#2A2A2A] hover:text-[#E1E1E1]"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div
                                        className={`flex w-16 justify-center ${isActive
                                            ? "text-[#10A37F]"
                                            : ""
                                            }`}
                                    >
                                        <Icon
                                            size={20}
                                        />
                                    </div>

                                    {expanded && (
                                        <span className="text-sm font-medium tracking-wide">
                                            {item.label}
                                        </span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="border-t border-[#343540] p-3">
                <button
                    onClick={handleLogout}
                    className={`flex h-12 w-full items-center rounded-lg text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300 ${expanded
                        ? "px-4"
                        : "justify-center"
                        }`}
                >
                    <LogOut size={20} />

                    {expanded && (
                        <span className="ml-3 text-sm font-medium">
                            Logout
                        </span>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;