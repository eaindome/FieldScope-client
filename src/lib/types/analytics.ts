// Analytics filters for score queries
export interface AnalyticsFilters {
	formId?: number;
	clusterField?: string;
	clusterValue?: string;
	vendorField?: string;
	vendorValue?: string;
	agentId?: number;
	startDate?: string;
	endDate?: string;
	groupBy?: string;
}

// Score analytics response
export interface ScoreAnalytics {
	overallAverage: number | null;
	pillarAverages: Record<string, number>;
	submissionCount: number;
	distribution: ScoreDistribution;
	groupedData?: GroupedScores[];
}

// Score distribution by health category
export interface ScoreDistribution {
	critical: number; // 0-59
	atRisk: number; // 60-79
	healthy: number; // 80-100
}

// Grouped scores by dimension
export interface GroupedScores {
	groupName: string;
	groupValue: string;
	averageScore: number;
	count: number;
	pillarAverages?: Record<string, number>;
}

// Trend data over time
export interface TrendDataPoint {
	period: string;
	averageScore: number;
	count: number;
}

export interface ScoreTrends {
	trends: TrendDataPoint[];
	groupBy: string;
}

// Submission with score (extends base Submission type)
export interface ScoredSubmission {
	id: number;
	formId: number;
	projectId: number;
	respondentId?: number;
	submittedByUserId: number;
	answers: Record<string, any>;
	overallScore?: number;
	sectionScores?: Record<string, number>;
	scoreCalculated: boolean;
	createdAt: string;
	updatedAt: string;
}
