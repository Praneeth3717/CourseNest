import { ReactNode } from "react";
import {
    CommonTableProps,
    SortDirection,
    ActionButtonDef,
    SearchInputDef,
    RowActionsDef
} from "@/components/CommonTable/types";
import { TrashIcon, PencilIcon } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNestedValue(obj: unknown, key: string): unknown {
    return (key as string)
        .split(".")
        .reduce(
            (acc, part) =>
                acc && typeof acc === "object"
                    ? (acc as Record<string, unknown>)[part]
                    : undefined,
            obj
        );
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────

function SortIcon({ direction }: { direction: SortDirection }) {
    return (
        <span className="inline-flex flex-col ml-1 gap-[2px]">
            <span
                className={`block w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent transition-colors ${direction === "asc"
                    ? "border-b-[#10A37F]"
                    : "border-b-[#4A4B57]"
                    }`}
            />
            <span
                className={`block w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent transition-colors ${direction === "desc"
                    ? "border-t-[#10A37F]"
                    : "border-t-[#4A4B57]"
                    }`}
            />
        </span>
    );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow({ colCount }: { colCount: number }) {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: colCount }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 bg-[#2A2A2A] rounded w-full" />
                </td>
            ))}
        </tr>
    );
}

// ─── Variant styles for action buttons ───────────────────────────────────────

const variantStyles: Record<NonNullable<ActionButtonDef["variant"]>, string> = {
    primary:
        "bg-[#10A37F] hover:bg-[#0e8f70] text-white border border-[#10A37F] focus:ring-[#10A37F]/40",
    secondary:
        "bg-transparent hover:bg-[#2A2A2A] text-[#E1E1E1] border border-[#343540] focus:ring-[#343540]",
    danger:
        "bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/40 hover:text-red-300 focus:ring-red-500/30",
    ghost:
        "bg-transparent hover:bg-[#2A2A2A] text-[#E1E1E1]/70 border border-transparent hover:text-[#E1E1E1] focus:ring-[#343540]",
};

// ─── SearchInput ──────────────────────────────────────────────────────────────

function SearchField({ input }: { input: SearchInputDef }) {
    const base =
        "h-8 rounded-md border border-[#343540] bg-[#0C0C0C] text-sm text-[#E1E1E1] placeholder-[#E1E1E1]/30 px-3 focus:outline-none focus:ring-2 focus:ring-[#10A37F] transition w-full";

    if (input.type === "select") {
        return (
            <select
                value={input.value}
                onChange={(e) => input.onChange(e.target.value)}
                className={base}
            >
                <option value="">{input.placeholder ?? "All"}</option>
                {input.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        );
    }

    return (
        <div className="relative w-full">
            {input.type !== "date" && input.type !== "number" && (
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#E1E1E1]/30 pointer-events-none">
                    <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                    </svg>
                </span>
            )}
            <input
                type={input.type ?? "text"}
                value={input.value}
                onChange={(e) => input.onChange(e.target.value)}
                placeholder={input.placeholder}
                className={`${base} ${input.type !== "date" && input.type !== "number" ? "pl-8" : ""
                    }`}
            />
        </div>
    );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function PaginationBar({
    pagination,
}: {
    pagination: NonNullable<CommonTableProps<unknown>["pagination"]>;
}) {
    const {
        currentPage,
        pageSize,
        totalRows,
        pageSizeOptions,
        onPageChange,
        onPageSizeChange,
    } = pagination;

    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const start = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalRows);

    const btnBase =
        "min-w-[32px] h-8 px-2 rounded-md text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-[#10A37F]/40";
    const activeCls = "bg-[#10A37F] text-white border-[#10A37F]";
    const inactiveCls =
        "bg-transparent text-[#E1E1E1]/70 border-[#343540] hover:bg-[#2A2A2A] hover:text-[#E1E1E1]";
    const disabledCls = "opacity-40 cursor-not-allowed";

    function pageRange(): (number | "...")[] {
        if (totalPages <= 7)
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        const range: (number | "...")[] = [1];
        if (currentPage > 3) range.push("...");
        for (
            let i = Math.max(2, currentPage - 1);
            i <= Math.min(totalPages - 1, currentPage + 1);
            i++
        )
            range.push(i);
        if (currentPage < totalPages - 2) range.push("...");
        range.push(totalPages);
        return range;
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {onPageSizeChange && (
                <div className="flex items-center gap-1.5 text-sm text-[#E1E1E1]/50">
                    <span>Rows per page</span>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="h-8 rounded-md border border-[#343540] bg-[#0C0C0C] text-sm text-[#E1E1E1] px-2 focus:outline-none focus:ring-2 focus:ring-[#10A37F]"
                    >
                        {(pageSizeOptions ?? [10, 20, 50, 100]).map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`${btnBase} ${currentPage === 1
                    ? `${disabledCls} ${inactiveCls}`
                    : inactiveCls
                    }`}
                aria-label="Previous page"
            >
                ‹
            </button>

            {pageRange().map((p, i) =>
                p === "..." ? (
                    <span
                        key={`ellipsis-${i}`}
                        className="px-1 text-[#E1E1E1]/30 select-none"
                    >
                        …
                    </span>
                ) : (
                    <button
                        key={p}
                        onClick={() => onPageChange(p as number)}
                        className={`${btnBase} ${p === currentPage ? activeCls : inactiveCls
                            }`}
                        aria-label={`Page ${p}`}
                        aria-current={p === currentPage ? "page" : undefined}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`${btnBase} ${currentPage === totalPages
                    ? `${disabledCls} ${inactiveCls}`
                    : inactiveCls
                    }`}
                aria-label="Next page"
            >
                ›
            </button>

            <span className="text-sm text-[#E1E1E1]/50 whitespace-nowrap ml-1">
                {start}–{end} of {totalRows}
            </span>
        </div>
    );
}

// ─── CommonTable ──────────────────────────────────────────────────────────────

export function CommonTable<T>({
    title,
    columns,
    data,
    rowKey,
    searchInputs = [],
    actionButtons = [],
    extraHeaderElements = [],
    loading = false,
    emptyMessage = "No records found.",
    onRowClick,
    highlightRow,
    sortKey,
    sortDirection,
    onSort,
    pagination,
    className = "",
    maxHeight,
    rowActions,
}: CommonTableProps<T>) {
    function handleSort(key: string) {
        if (!onSort) return;
        if (sortKey !== key) {
            onSort(key, "asc");
        } else if (sortDirection === "asc") {
            onSort(key, "desc");
        } else {
            onSort(key, null);
        }
    }

    const leftExtras = extraHeaderElements.filter((e) => e.position === "left");
    const centreExtras = extraHeaderElements.filter((e) => e.position === "center");
    const rightExtras = extraHeaderElements.filter((e) => e.position === "right");

    const alignClass: Record<string, string> = {
        left: "text-left",
        center: "text-center",
        right: "text-right",
    };

    const hasHeader =
        title ||
        searchInputs.length > 0 ||
        actionButtons.length > 0 ||
        extraHeaderElements.length > 0;

    return (
        <div
            className={`flex flex-col w-full bg-[#1E1E1E] rounded-xl border border-[#343540] overflow-hidden shadow-sm ${className}`}
        >
            {/* ── Header ── */}
            {hasHeader && (
                <div className="flex flex-col gap-3 px-4 py-3 border-b border-[#343540] bg-[#161616]">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Left: title + left extras */}
                        <div className="flex items-center gap-2 flex-shrink-0 min-w-[120px]">
                            {title && (
                                <h2 className="text-base font-semibold text-[#E1E1E1] whitespace-nowrap">
                                    {title}
                                </h2>
                            )}
                            {leftExtras.map((e) => (
                                <div key={e.key}>{e.element}</div>
                            ))}
                        </div>

                        {/* Centre: search inputs + centre extras */}
                        {(searchInputs.length > 0 || centreExtras.length > 0) && (
                            <div className="flex flex-wrap items-center gap-2 flex-1 justify-center min-w-0">
                                {searchInputs.map((input) => (
                                    <div key={input.key} className="w-44">
                                        <SearchField input={input} />
                                    </div>
                                ))}
                                {centreExtras.map((e) => (
                                    <div key={e.key}>{e.element}</div>
                                ))}
                            </div>
                        )}

                        {/* Right: action buttons + right extras */}
                        {(actionButtons.length > 0 || rightExtras.length > 0) && (
                            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                                {rightExtras.map((e) => (
                                    <div key={e.key}>{e.element}</div>
                                ))}
                                {actionButtons.map((btn) => (
                                    <button
                                        key={btn.key}
                                        onClick={btn.onClick}
                                        disabled={btn.disabled}
                                        className={`
                                            inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium
                                            focus:outline-none focus:ring-2 transition-colors duration-200
                                            ${variantStyles[btn.variant ?? "secondary"]}
                                            ${btn.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                                        `}
                                    >
                                        {btn.icon && (
                                            <span className="w-3.5 h-3.5">{btn.icon}</span>
                                        )}
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Body ── */}
            <div
                className="overflow-auto"
                style={maxHeight ? { maxHeight } : undefined}
            >
                <table className="min-w-full text-sm table-auto border-collapse">
                    {/* Head */}
                    <thead className="sticky top-0 z-10 bg-[#161616] border-b border-[#343540]">
                        <tr>
                            {columns.map((col) => {
                                const colKey = col.key as string;
                                const isSorted = sortKey === colKey;
                                return (
                                    <th
                                        key={colKey}
                                        scope="col"
                                        onClick={() => col.sortable && handleSort(colKey)}
                                        className={`
                                            px-4 py-2.5 font-semibold text-xs uppercase tracking-wide
                                            text-[#E1E1E1]/50
                                            ${col.minWidth ?? ""}
                                            ${alignClass[col.align ?? "left"]}
                                            ${col.sortable
                                                ? "cursor-pointer select-none hover:text-[#E1E1E1]"
                                                : ""
                                            }
                                            whitespace-nowrap transition-colors duration-150
                                        `}
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            {col.label}
                                            {col.sortable && (
                                                <SortIcon
                                                    direction={
                                                        isSorted
                                                            ? (sortDirection ?? null)
                                                            : null
                                                    }
                                                />
                                            )}
                                        </span>
                                    </th>
                                );
                            })}
                            {rowActions && (
                                <th
                                    scope="col"
                                    className={`px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-[#E1E1E1]/50 whitespace-nowrap ${alignClass[rowActions.align ?? "right"]}`}
                                >
                                    {rowActions.header ?? "Actions"}
                                </th>
                            )}
                        </tr>
                    </thead>

                    {/* Body */}
                    <tbody className="divide-y divide-[#343540]/60">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <SkeletonRow key={i} colCount={columns.length} />
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-12 text-center text-[#E1E1E1]/30 text-sm"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <svg
                                            className="w-8 h-8 text-[#343540]"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={1.5}
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125V6A2.25 2.25 0 0 1 4.5 3.75h15A2.25 2.25 0 0 1 21.75 6v12.375m0 0a1.125 1.125 0 0 1-1.125 1.125m0 0h-1.5M6 18.375V6.75"
                                            />
                                        </svg>
                                        {emptyMessage}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => {
                                const isHighlighted = highlightRow?.(row);
                                return (
                                    <tr
                                        key={rowKey(row)}
                                        onClick={() => onRowClick?.(row)}
                                        className={`
                                            transition-colors duration-150
                                            ${onRowClick ? "cursor-pointer" : ""}
                                            ${isHighlighted
                                                ? "bg-[#10A37F]/10"
                                                : "bg-[#1E1E1E] hover:bg-[#2A2A2A]"
                                            }
                                        `}
                                    >
                                        {columns.map((col) => {
                                            const colKey = col.key as string;
                                            const rawValue = getNestedValue(row, colKey);
                                            const cell = col.render
                                                ? col.render(rawValue, row, rowIndex)
                                                : ((rawValue as ReactNode) ?? "—");
                                            return (
                                                <td
                                                    key={colKey}
                                                    className={`px-4 py-3 text-[#E1E1E1]/80 ${alignClass[col.align ?? "left"]} whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]`}
                                                >
                                                    {cell}
                                                </td>
                                            );
                                        })}
                                        {/* in each <tr>, after columns.map */}
                                        {rowActions && (
                                            <td
                                                className={`px-4 py-3 whitespace-nowrap ${alignClass[rowActions.align ?? "right"]}`}
                                                onClick={(e) => e.stopPropagation()} // prevent triggering onRowClick
                                            >
                                                <div className="inline-flex items-center gap-1.5">
                                                    {rowActions.onEdit && (
                                                        <button
                                                            onClick={() => rowActions.onEdit!(row)}
                                                            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-[#343540] text-[#E1E1E1]/70 hover:text-[#10A37F] hover:border-[#10A37F]/40 hover:bg-[#10A37F]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#10A37F]/40"
                                                            aria-label={rowActions.edit?.label ?? "Edit"}
                                                            title={rowActions.edit?.label ?? "Edit"}
                                                        >
                                                            {rowActions.edit?.icon ?? <PencilIcon className="h-4 w-4"/>}
                                                        </button>
                                                    )}
                                                    {rowActions.onDelete && (
                                                        <button
                                                            onClick={() => rowActions.onDelete!(row)}
                                                            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-[#343540] text-[#E1E1E1]/70 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30"
                                                            aria-label={rowActions.delete?.label ?? "Delete"}
                                                            title={rowActions.delete?.label ?? "Delete"}
                                                        >
                                                            {rowActions.delete?.icon ?? <TrashIcon className="h-4 w-4"/>}
                                                        </button>
                                                    )}
                                                    {rowActions.custom?.(row).map((btn) => (
                                                        <button
                                                            key={btn.key}
                                                            onClick={btn.onClick}
                                                            disabled={btn.disabled}
                                                            className={`h-8 w-8 inline-flex items-center justify-center rounded-md border transition-colors focus:outline-none focus:ring-2 ${variantStyles[btn.variant ?? "ghost"]} ${btn.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                                                            title={btn.label}
                                                            aria-label={btn.label}
                                                        >
                                                            {btn.icon}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Footer ── */}
            {pagination && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-[#343540] bg-[#161616]">
                    <p className="text-sm text-[#E1E1E1]/50 whitespace-nowrap">
                        Total{" "}
                        <span className="font-semibold text-[#E1E1E1]">
                            {pagination.totalRows}
                        </span>{" "}
                        {pagination.totalRows === 1 ? "record" : "records"}
                    </p>

                    <PaginationBar pagination={pagination} />
                </div>
            )}
        </div>
    );
}

export default CommonTable;

export type {
    ColumnDef,
    SearchInputDef,
    ActionButtonDef,
    ExtraHeaderElementDef,
    PaginationDef,
    CommonTableProps,
    SortDirection,
    RowActionsDef
} from "@/components/CommonTable/types";