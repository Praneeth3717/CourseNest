import requestInstance from "@/api/requestInstance";
import { API_ENDPOINTS } from "@/api/apiEndpoints";

import type {
    DashboardData,
    DashboardAnalyticsResponse,
} from "@/types/admin.types";

class AdminService {
    /* GET DASHBOARD */
    getDashboard(): Promise<DashboardData> {
        return requestInstance.get<DashboardData>(
            API_ENDPOINTS.Admin.dashboard,
        );
    }

    /* GET DASHBOARD CHARTS */
    getDashboardCharts(): Promise<DashboardAnalyticsResponse> {
        return requestInstance.get<DashboardAnalyticsResponse>(
            API_ENDPOINTS.Admin.dashboardCharts,
        );
    }
}

export const adminService = new AdminService();