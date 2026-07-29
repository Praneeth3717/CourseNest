import React, { useMemo } from "react";
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    type ChartOptions,
    type TooltipItem,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip);

// ─── Hours Arc (Doughnut) ─────────────────────────────────────────────────────

interface HoursArcProps {
    completed: number;
    total: number;
}

export function HoursArc({ completed, total }: HoursArcProps) {
    const remaining = total - completed;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const chartData = useMemo(
        () => ({
            labels: ["Completed", "Remaining"],
            datasets: [
                {
                    data: [completed, remaining > 0 ? remaining : 0],
                    backgroundColor: ["#10A37F", "#2A2A2A"],
                    hoverBackgroundColor: ["#0D8A6A", "#343540"],
                    borderColor: "#1E1E1E",
                    borderWidth: 3,
                    hoverBorderColor: "#1E1E1E",
                    hoverOffset: 4,
                },
            ],
        }),
        [completed, remaining]
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
                        label: (item: TooltipItem<"doughnut">) =>
                            ` ${item.raw as number}h`,
                    },
                },
            },
        }),
        []
    );

    return (
        <div className="flex flex-col gap-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#E1E1E1]/40">
                Hours Progress
            </span>

            {/* Donut centred above stats */}
            <div className="flex flex-col items-center gap-4">
                <div className="relative flex-shrink-0" style={{ width: 110, height: 110 }}>
                    <Doughnut data={chartData} options={options} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] text-[#E1E1E1]/40 uppercase tracking-widest leading-none">
                            Done
                        </span>
                        <span className="text-base font-bold text-[#E1E1E1] leading-snug">
                            {pct}%
                        </span>
                    </div>
                </div>

                {/* Stats — 3-column grid filling full width */}
                <div className="grid grid-cols-3 w-full divide-x divide-[#343540]">
                    <div className="flex flex-col items-center gap-1 px-2">
                        <p className="text-[10px] text-[#E1E1E1]/40 uppercase tracking-widest">Completed</p>
                        <p className="text-sm font-bold text-[#10A37F]">{completed}h</p>
                    </div>
                    <div className="flex flex-col items-center gap-1 px-2">
                        <p className="text-[10px] text-[#E1E1E1]/40 uppercase tracking-widest">Remaining</p>
                        <p className="text-sm font-bold text-[#E1E1E1]">{remaining}h</p>
                    </div>
                    <div className="flex flex-col items-center gap-1 px-2">
                        <p className="text-[10px] text-[#E1E1E1]/40 uppercase tracking-widest">Total</p>
                        <p className="text-sm font-bold text-[#E1E1E1]">{total}h</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Session Bar Chart ────────────────────────────────────────────────────────

interface SessionBarChartProps {
    completed: number;
    upcoming: number;
    pending: number;
}

export function SessionBarChart({ completed, upcoming, pending }: SessionBarChartProps) {
    const bars = [
        { label: "Done", value: completed, color: "#10A37F" },
        { label: "Upcoming", value: upcoming, color: "#3B82F6" },
        { label: "Pending", value: pending, color: "#F59E0B" },
    ];

    const chartData = useMemo(
        () => ({
            labels: bars.map((b) => b.label),
            datasets: [
                {
                    data: bars.map((b) => b.value),
                    backgroundColor: bars.map((b) => b.color),
                    hoverBackgroundColor: bars.map((b) => b.color + "CC"),
                    borderRadius: 4,
                    borderSkipped: false,
                    barPercentage: 0.55,
                    categoryPercentage: 0.7,
                },
            ],
        }),
        [completed, upcoming, pending]
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
                    bodyColor: "rgba(225,225,225,0.6)",
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: (item: TooltipItem<"bar">) =>
                            ` ${item.raw as number} session${(item.raw as number) !== 1 ? "s" : ""}`,
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
                        maxTicksLimit: 4,
                        stepSize: 1,
                        callback: (value) => Number(value),
                    },
                },
            },
        }),
        []
    );

    const total = completed + upcoming + pending || 1;

    return (
        <div className="flex flex-col gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#E1E1E1]/40">
                Sessions
            </span>

            {/* Bar chart */}
            <div className="relative h-[120px]">
                <Bar data={chartData} options={options} />
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 pt-2 mt-1 border-t border-[#343540]">
                {bars.map((b) => (
                    <div key={b.label} className="flex items-center gap-1.5">
                        <span
                            className="w-2 h-2 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: b.color }}
                        />
                        <span className="text-[10px] text-[#E1E1E1]/40">
                            {b.label} · {Math.round((b.value / total) * 100)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}