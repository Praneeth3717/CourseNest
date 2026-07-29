import { ReactNode } from "react";

// ─── Column Definition ────────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc" | null;

export interface ColumnDef<T> {
    /** Unique key matching a key in T (or any string for custom render) */
    key: keyof T | string;
    /** Column header label */
    label: string;
    /** Min-width Tailwind class, e.g. "min-w-[120px]" */
    minWidth?: string;
    /** Whether the column is sortable */
    sortable?: boolean;
    /** Align cell content */
    align?: "left" | "center" | "right";
    /** Custom cell renderer */
    render?: (value: unknown, row: T, rowIndex: number) => ReactNode;
}

// ─── Search Input ─────────────────────────────────────────────────────────────

export interface SearchInputDef {
    /** Unique id for this input */
    key: string;
    /** Placeholder text */
    placeholder?: string;
    /** Input type */
    type?: "text" | "date" | "number" | "select";
    /** Options for type="select" */
    options?: { label: string; value: string }[];
    /** Current value (controlled externally) */
    value: string;
    /** Callback when value changes */
    onChange: (value: string) => void;
}

// ─── Action Button ────────────────────────────────────────────────────────────

export interface ActionButtonDef {
    /** Unique key */
    key: string;
    /** Button label */
    label: string;
    /** Lucide icon name or any ReactNode */
    icon?: ReactNode;
    /** Button variant */
    variant?: "primary" | "secondary" | "danger" | "ghost";
    /** Disabled state */
    disabled?: boolean;
    /** Click handler */
    onClick: () => void;
}

// ─── Extra Header Element ─────────────────────────────────────────────────────

export interface ExtraHeaderElementDef {
    key: string;
    element: ReactNode;
    position: "left" | "center" | "right";
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationDef {
    currentPage: number;
    pageSize: number;
    totalRows: number;
    pageSizeOptions?: number[];
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
}

// ─── CommonTable Props ────────────────────────────────────────────────────────

export interface CommonTableProps<T> {
    /** Table title shown on the left of the header */
    title?: string;
    /** Column definitions */
    columns: ColumnDef<T>[];
    /** Row data */
    data: T[];
    /** Row key extractor */
    rowKey: (row: T) => string | number;

    // ── Header ──
    /** Search inputs rendered in the centre of the header */
    searchInputs?: SearchInputDef[];
    /** Action buttons rendered on the right of the header */
    actionButtons?: ActionButtonDef[];
    /** Extra elements that can slot into header left / centre / right */
    extraHeaderElements?: ExtraHeaderElementDef[];

    // ── Body ──
    /** Loading skeleton */
    loading?: boolean;
    /** Empty-state message */
    emptyMessage?: string;
    /** Callback when a row is clicked */
    onRowClick?: (row: T) => void;
    /** Highlight row predicate */
    highlightRow?: (row: T) => boolean;

    // ── Sorting (controlled externally) ──
    sortKey?: string;
    sortDirection?: SortDirection;
    onSort?: (key: string, direction: SortDirection) => void;

    // ── Footer ──
    pagination?: PaginationDef;

    // ── Misc ──
    className?: string;
    /** Table max-height for vertical scroll */
    maxHeight?: string;

    rowActions?: RowActionsDef<T>; // ← ADD THIS
}

export interface RowActionsDef<T> {
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    edit?: { label?: string; icon?: ReactNode };
    delete?: { label?: string; icon?: ReactNode };
    custom?: (row: T) => ActionButtonDef[]; // for extra per-row actions
    align?: "left" | "center" | "right";
    header?: string; // column header text, default "Actions"
}