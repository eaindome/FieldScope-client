// Dashboard layout item - represents a view on the dashboard
export interface DashboardItem {
	id: string; // Unique ID for this item instance
	viewId: number; // Reference to the view
	x: number; // Grid column start (0-indexed)
	y: number; // Grid row start (0-indexed)
	width: number; // Grid columns to span
	height: number; // Grid rows to span
}

// Dashboard definition structure (saved to backend)
export interface DashboardDefinition {
	layout: DashboardItem[];
	gridColumns?: number; // Number of columns in grid (default 12)
	gridRowHeight?: number; // Height of each row in pixels (default 120)
	gridGap?: number; // Gap between grid items in pixels (default 16)
}

// Full dashboard object from API
export interface Dashboard {
	id: number;
	projectId: number;
	formId?: number; // For system dashboards linked to a specific form
	name: string;
	description?: string;
	definition: string; // JSON stringified DashboardDefinition
	metadata?: string; // JSON stringified extra metadata
	isSystem?: boolean; // True for auto-generated system dashboards
	isDefault?: boolean; // True if this is the default dashboard
	sourceDashboardId?: number; // Reference to original dashboard if cloned
	createdAt: string;
	updatedAt: string;
}

// View reference for dashboard building
export interface DashboardView {
	id: number;
	name: string;
	chartType: string;
	description?: string;
}
