import React, { useMemo } from "react";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    type ChartOptions,
    type TooltipItem,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import type { CourseRevenueItem } from "@/types/admin.types";

ChartJS.register(ArcElement, Tooltip);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
}

function truncate(str: string, max = 24): string {
    return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

// ─── Palette — matches dashboard accent + muted tones ─────────────────────────

const PALETTE = [
    "#10A37F", // brand green
    "#3B82F6", // blue-500
    "#F59E0B", // amber-500
    "#8B5CF6", // violet-500
    "#EC4899", // pink-500
    "#06B6D4", // cyan-500
    "#F97316", // orange-500
    "#14B8A6", // teal-500
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface CourseRevenueChartProps {
    data: CourseRevenueItem[];
    loading?: boolean;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DonutSkeleton() {
    return (
        <div className="flex items-center justify-center">
            <div className="w-36 h-36 rounded-full border-[14px] border-[#2A2A2A] animate-pulse" />
        </div>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-36 gap-2 text-[#E1E1E1]/20">
            <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
            </svg>
            <span className="text-xs">No revenue data</span>
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CourseRevenueChart: React.FC<CourseRevenueChartProps> = ({
    data,
    loading,
}) => {
    const total = useMemo(
        () => data.reduce((sum, d) => sum + d.revenue, 0),
        [data]
    );

    const hasData = data.some((d) => d.revenue > 0);

    const chartData = useMemo(
        () => ({
            labels: data.map((d) => d.course_name),
            datasets: [
                {
                    data: data.map((d) => d.revenue),
                    backgroundColor: data.map((_, i) => PALETTE[i % PALETTE.length]),
                    hoverBackgroundColor: data.map(
                        (_, i) => PALETTE[i % PALETTE.length] + "CC"
                    ),
                    borderColor: "#1E1E1E",
                    borderWidth: 3,
                    hoverBorderColor: "#1E1E1E",
                    hoverOffset: 6,
                },
            ],
        }),
        [data]
    );

    const options: ChartOptions<"doughnut"> = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            cutout: "72%",
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "#1E1E1E",
                    borderColor: "#343540",
                    borderWidth: 1,
                    titleColor: "#E1E1E1",
                    bodyColor: "rgba(225,225,225,0.6)",
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: (item: TooltipItem<"doughnut">) => {
                            const value = item.raw as number;
                            const pct =
                                total > 0
                                    ? ((value / total) * 100).toFixed(1)
                                    : "0.0";
                            return ` ${formatCurrency(value)}  (${pct}%)`;
                        },
                    },
                },
            },
        }),
        [total]
    );

    return (
        <div className="bg-[#1E1E1E] rounded-xl border border-[#343540] p-5 shadow-sm flex flex-col gap-4">
            {/* Header */}
            <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-semibold text-[#E1E1E1]">
                    Revenue by Course
                </h2>
                <p className="text-xs text-[#E1E1E1]/40">
                    {data.length} course{data.length !== 1 ? "s" : ""} · Lifetime totals
                </p>
            </div>

            {/* Chart + centre label */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Donut */}
                <div className="relative flex-shrink-0" style={{ width: 160, height: 160 }}>
                    {loading ? (
                        <DonutSkeleton />
                    ) : !hasData ? (
                        <EmptyState />
                    ) : (
                        <>
                            <Doughnut data={chartData} options={options} />
                            {/* Centre label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[10px] text-[#E1E1E1]/40 uppercase tracking-widest leading-none">
                                    Total
                                </span>
                                <span className="text-sm font-bold text-[#E1E1E1] leading-snug mt-0.5">
                                    {formatCurrency(total)}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* Legend */}
                {!loading && hasData && (
                    <div className="flex flex-col gap-2 flex-1 w-full">
                        {data.map((item, i) => {
                            const pct =
                                total > 0
                                    ? ((item.revenue / total) * 100).toFixed(1)
                                    : "0.0";
                            const color = PALETTE[i % PALETTE.length];
                            return (
                                <div
                                    key={item.course_name}
                                    className="flex items-center gap-2.5 group"
                                >
                                    <span
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: color }}
                                    />
                                    <span
                                        className="text-xs text-[#E1E1E1]/60 flex-1 truncate"
                                        title={item.course_name}
                                    >
                                        {truncate(item.course_name)}
                                    </span>
                                    <div className="flex items-center gap-2 text-right flex-shrink-0">
                                        <span className="text-xs font-semibold text-[#E1E1E1]">
                                            {formatCurrency(item.revenue)}
                                        </span>
                                        <span
                                            className="text-[10px] px-1.5 py-0.5 rounded-full"
                                            style={{
                                                backgroundColor: color + "1A",
                                                color,
                                            }}
                                        >
                                            {pct}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Loading legend placeholder */}
                {loading && (
                    <div className="flex flex-col gap-2 flex-1 w-full animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-2.5">
                                <div className="w-2 h-2 rounded-full bg-[#2A2A2A]" />
                                <div className="h-3 flex-1 bg-[#2A2A2A] rounded" />
                                <div className="h-3 w-16 bg-[#2A2A2A] rounded" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};