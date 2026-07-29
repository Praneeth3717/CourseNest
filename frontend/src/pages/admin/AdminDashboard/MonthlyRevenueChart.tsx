import React, { useMemo } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    type ChartOptions,
    type TooltipItem,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { MonthlyRevenueItem } from "@/types/admin.types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface MonthlyRevenueChartProps {
    data: MonthlyRevenueItem[];
    loading?: boolean;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton() {
    return (
        <div className="flex items-end gap-1.5 h-40 px-2">
            {Array.from({ length: 12 }).map((_, i) => (
                <div
                    key={i}
                    className="flex-1 bg-[#2A2A2A] rounded-sm animate-pulse"
                    style={{ height: `${20 + Math.random() * 60}%` }}
                />
            ))}
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({
    data,
    loading,
}) => {
    const totalRevenue = useMemo(
        () => data.reduce((sum, d) => sum + d.revenue, 0),
        [data]
    );

    const peakMonth = useMemo(() => {
        if (!data.length) return null;
        return data.reduce((prev, curr) =>
            curr.revenue > prev.revenue ? curr : prev
        );
    }, [data]);

    const chartData = useMemo(
        () => ({
            labels: data.map((d) => d.month),
            datasets: [
                {
                    data: data.map((d) => d.revenue),
                    backgroundColor: data.map((d) =>
                        d.revenue > 0 ? "#10A37F" : "#2A2A2A"
                    ),
                    hoverBackgroundColor: data.map((d) =>
                        d.revenue > 0 ? "#0D8A6A" : "#343540"
                    ),
                    borderRadius: 4,
                    borderSkipped: false,
                    barPercentage: 0.6,
                    categoryPercentage: 0.7,
                },
            ],
        }),
        [data]
    );

    const options: ChartOptions<"bar"> = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "#1E1E1E",
                    borderColor: "#343540",
                    borderWidth: 1,
                    titleColor: "#E1E1E1",
                    bodyColor: "#10A37F",
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        title: (items: TooltipItem<"bar">[]) => {
                            const idx = items[0].dataIndex;
                            return `${data[idx].month} ${data[idx].year}`;
                        },
                        label: (item: TooltipItem<"bar">) =>
                            formatCurrency(item.raw as number),
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        color: "rgba(225,225,225,0.35)",
                        font: { size: 11 },
                    },
                },
                y: {
                    grid: {
                        color: "rgba(52,53,64,0.6)",
                        lineWidth: 1,
                    },
                    border: { display: false, dash: [4, 4] },
                    ticks: {
                        color: "rgba(225,225,225,0.35)",
                        font: { size: 11 },
                        maxTicksLimit: 5,
                        callback: (value) => {
                            const n = value as number;
                            if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
                            if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
                            return `₹${n}`;
                        },
                    },
                },
            },
        }),
        [data]
    );

    return (
        <div className="bg-[#1E1E1E] rounded-xl border border-[#343540] p-5 shadow-sm flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-base font-semibold text-[#E1E1E1]">
                        Monthly Revenue
                    </h2>
                    <p className="text-xs text-[#E1E1E1]/40">
                        {data[0]?.year ?? ""} · Full year breakdown
                    </p>
                </div>

                <div className="flex items-end gap-4 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                        <span className="text-xs text-[#E1E1E1]/40 uppercase tracking-widest">
                            Total
                        </span>
                        <span className="text-lg font-bold text-[#10A37F] tracking-tight leading-none">
                            {formatCurrency(totalRevenue)}
                        </span>
                    </div>
                    {peakMonth && peakMonth.revenue > 0 && (
                        <div className="flex flex-col items-end gap-0.5">
                            <span className="text-xs text-[#E1E1E1]/40 uppercase tracking-widest">
                                Peak
                            </span>
                            <span className="text-sm font-semibold text-[#E1E1E1] leading-none">
                                {peakMonth.month}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Chart */}
            <div className="relative h-48">
                {loading ? (
                    <ChartSkeleton />
                ) : (
                    <Bar data={chartData} options={options} />
                )}
            </div>

            {/* Footer legend */}
            <div className="flex items-center gap-4 pt-1 border-t border-[#343540]">
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#10A37F]" />
                    <span className="text-xs text-[#E1E1E1]/40">Revenue earned</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#2A2A2A]" />
                    <span className="text-xs text-[#E1E1E1]/40">No revenue</span>
                </div>
            </div>
        </div>
    );
};