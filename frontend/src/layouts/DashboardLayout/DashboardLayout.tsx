import { Outlet } from "react-router-dom";

import Sidebar from "@/layouts/DashboardLayout/Sidebar";
import Navbar from "@/layouts/DashboardLayout/Navbar";

import type { UserRole } from "@/router/roleRoutes";

interface Props {
    role: UserRole;
}

const DashboardLayout = ({ role }: Props) => {
    return (
        <div className="flex h-screen bg-[#141414] overflow-hidden">
            <Sidebar role={role} />

            <div className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden">
                <Navbar role={role} />

                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;