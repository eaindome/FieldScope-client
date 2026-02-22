// Form field types
export type FieldType =
	| 'text'
	| 'textarea'
	| 'number'
	| 'date'
	| 'radio'
	| 'checkbox'
	| 'file'
	| 'location'
	| 'email'
	| 'phone'
	| 'url'
	| 'pageBreak';

// Option for radio/checkbox fields (with optional score)
export interface FieldOption {
	label: string;
	value: string;
	score?: number; // Score for this option (only when form.scoringEnabled = true)
}

// Base field interface
export interface FormField {
	id: string;
	type: FieldType;
	label: string;
	description?: string;
	placeholder?: string;
	required: boolean;
	order: number;

	// Type-specific properties
	options?: FieldOption[]; // For radio/checkbox
	validation?: { min?: number; max?: number }; // For number fields
	weight?: number; // For pageBreak fields when scoring enabled (percentage 0-100)
}

// Form interface
export interface Form {
	id: number;
	projectId: number;
	title: string;
	description?: string;
	status: 'draft' | 'published';
	scoringEnabled?: boolean; // Enable/disable scoring for entire form
	fields: FormField[];
	createdAt: string;
	updatedAt: string;
}

// Scoring configuration (optional metadata)
export interface FormScoringConfig {
	enabled: boolean;
	sections: Array<{
		sectionId: string; // pageBreak field ID
		weight: number; // Percentage (should sum to 100)
	}>;
	scoredFields: Array<{
		fieldId: string; // radio/checkbox field ID
		options: Array<{
			value: string;
			score: number;
		}>;
	}>;
}
