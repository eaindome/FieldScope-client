/**
 * Mock data for testing UI without backend
 */

export const mockDashboardStats = {
	organizations: {
		total: 12,
		active: 9,
		createdThisMonth: 3,
		dormant: 3
	},
	users: {
		total: 156,
		byRole: {
			superAdmin: 2,
			admin: 18,
			agent: 136
		},
		active: 142,
		inactive: 14,
		averagePerOrganization: 13.0
	},
	projects: {
		total: 45,
		byStatus: {
			draft: 8,
			active: 28,
			closed: 9
		},
		averagePerOrganization: 3.75
	},
	submissions: {
		total: 8547,
		last7Days: 423,
		last30Days: 1876,
		averagePerProject: 189.93,
		topOrganizationsBySubmissions: [
			{
				organizationId: 3,
				organizationName: 'East Africa Wildlife Foundation',
				submissionCount: 2341
			},
			{
				organizationId: 7,
				organizationName: 'Kenya Wildlife Service',
				submissionCount: 1893
			},
			{
				organizationId: 5,
				organizationName: 'Tanzania Conservation Initiative',
				submissionCount: 1654
			},
			{
				organizationId: 1,
				organizationName: 'Serengeti Research Institute',
				submissionCount: 1247
			},
			{
				organizationId: 9,
				organizationName: 'Amboseli Elephant Research',
				submissionCount: 967
			}
		]
	},
	invitations: {
		total: 87,
		pending: 12,
		accepted: 68,
		expired: 7,
		acceptanceRate: 85.0
	},
	generatedAt: new Date().toISOString()
};

export const mockOrganizations = [
	{
		id: 1,
		name: 'East Africa Wildlife Foundation',
		description: 'Wildlife conservation and research organization focusing on elephant protection',
		address: '123 Conservation Drive',
		city: 'Nairobi',
		country: 'Kenya',
		phone: '+254-20-1234567',
		email: 'info@eawf.org',
		website: 'https://eawf.org',
		logoUrl: null,
		timeZone: 'Africa/Nairobi',
		isActive: true,
		createdAt: '2025-01-15T10:30:00Z',
		updatedAt: '2026-02-10T14:20:00Z'
	},
	{
		id: 2,
		name: 'Kenya Wildlife Service',
		description: 'National wildlife conservation and management authority',
		address: '456 Wildlife Avenue',
		city: 'Nairobi',
		country: 'Kenya',
		phone: '+254-20-9876543',
		email: 'contact@kws.go.ke',
		website: 'https://kws.go.ke',
		logoUrl: null,
		timeZone: 'Africa/Nairobi',
		isActive: true,
		createdAt: '2024-11-20T09:00:00Z',
		updatedAt: '2026-01-28T11:15:00Z'
	},
	{
		id: 3,
		name: 'Tanzania Conservation Initiative',
		description: 'Community-based conservation programs across Tanzania',
		address: '789 Uhuru Street',
		city: 'Arusha',
		country: 'Tanzania',
		phone: '+255-27-2501234',
		email: 'info@tci.or.tz',
		website: 'https://tci.or.tz',
		logoUrl: null,
		timeZone: 'Africa/Dar_es_Salaam',
		isActive: true,
		createdAt: '2025-03-05T13:45:00Z',
		updatedAt: '2026-02-14T16:30:00Z'
	},
	{
		id: 4,
		name: 'Serengeti Research Institute',
		description: 'Scientific research and ecosystem monitoring',
		city: 'Seronera',
		country: 'Tanzania',
		email: 'research@serengeti.org',
		isActive: true,
		createdAt: '2024-08-12T08:00:00Z',
		updatedAt: '2025-12-20T10:00:00Z'
	},
	{
		id: 5,
		name: 'Uganda Wildlife Authority',
		description: 'Protected area management and wildlife conservation',
		city: 'Kampala',
		country: 'Uganda',
		phone: '+256-41-4355000',
		email: 'info@ugandawildlife.org',
		website: 'https://ugandawildlife.org',
		isActive: false,
		createdAt: '2025-06-18T12:00:00Z',
		updatedAt: '2026-01-05T09:30:00Z'
	}
];

export const mockInvitations = [
	{
		id: 1,
		email: 'john.doe@eawf.org',
		role: 'Admin',
		status: 'Accepted',
		expiresAt: '2026-01-25T12:00:00Z',
		sentByUserId: 1,
		createdAt: '2026-01-18T10:30:00Z'
	},
	{
		id: 2,
		email: 'sarah.wilson@kws.go.ke',
		role: 'Agent',
		status: 'Pending',
		expiresAt: '2026-02-22T15:00:00Z',
		sentByUserId: 1,
		createdAt: '2026-02-15T09:00:00Z'
	},
	{
		id: 3,
		email: 'james.kamau@tci.or.tz',
		role: 'Agent',
		status: 'Accepted',
		expiresAt: '2026-02-10T12:00:00Z',
		sentByUserId: 2,
		createdAt: '2026-02-03T14:20:00Z'
	},
	{
		id: 4,
		email: 'maria.gonzalez@serengeti.org',
		role: 'Admin',
		status: 'Pending',
		expiresAt: '2026-02-28T10:00:00Z',
		sentByUserId: 1,
		createdAt: '2026-02-21T11:15:00Z'
	},
	{
		id: 5,
		email: 'peter.omondi@eawf.org',
		role: 'Agent',
		status: 'Expired',
		expiresAt: '2026-01-15T12:00:00Z',
		sentByUserId: 2,
		createdAt: '2026-01-08T08:00:00Z'
	},
	{
		id: 6,
		email: 'amina.hassan@kws.go.ke',
		role: 'Agent',
		status: 'Accepted',
		expiresAt: '2026-02-05T16:00:00Z',
		sentByUserId: 1,
		createdAt: '2026-01-29T13:30:00Z'
	},
	{
		id: 7,
		email: 'david.ngugi@ugandawildlife.org',
		role: 'Admin',
		status: 'Pending',
		expiresAt: '2026-02-25T09:00:00Z',
		sentByUserId: 1,
		createdAt: '2026-02-18T10:45:00Z'
	},
	{
		id: 8,
		email: 'fatima.ibrahim@tci.or.tz',
		role: 'Agent',
		status: 'Expired',
		expiresAt: '2026-01-20T14:00:00Z',
		sentByUserId: 3,
		createdAt: '2026-01-13T12:00:00Z'
	}
];

export const mockSystemHealth = {
	status: 'Healthy',
	timestamp: new Date().toISOString(),
	database: {
		canConnect: true,
		provider: 'Npgsql.EntityFrameworkCore.PostgreSQL',
		pendingMigrations: 0,
		appliedMigrations: 5,
		lastMigration: '20260214142244_AddMetadataToFormViewDashboard'
	},
	backgroundJobs: {
		status: 'Healthy',
		hangfireEnabled: true,
		activeJobs: 2,
		scheduledJobs: 15
	},
	performance: {
		databaseResponseTimeMs: 12.34,
		serverUptimeFormatted: '15.08:24:36',
		memoryUsageMB: 347.82
	}
};

// Mock Projects
export const mockProjects = [
	{
		id: 1,
		name: 'Wildlife Census 2026',
		description: 'Annual wildlife population survey across Serengeti National Park',
		startDate: '2026-03-01T00:00:00Z',
		endDate: '2026-04-30T23:59:59Z',
		status: 'active',
		organizationId: 1,
		createdAt: '2026-01-15T10:30:00Z',
		updatedAt: '2026-02-10T14:20:00Z'
	},
	{
		id: 2,
		name: 'Elephant Migration Study',
		description: 'Tracking elephant movement patterns during dry season',
		startDate: '2026-06-01T00:00:00Z',
		endDate: '2026-09-30T23:59:59Z',
		status: 'draft',
		organizationId: 1,
		createdAt: '2026-02-01T09:00:00Z',
		updatedAt: '2026-02-14T16:30:00Z'
	},
	{
		id: 3,
		name: 'Community Conservation Survey',
		description: 'Assessing community participation in conservation efforts',
		startDate: '2025-11-01T00:00:00Z',
		endDate: '2026-01-31T23:59:59Z',
		status: 'closed',
		organizationId: 2,
		createdAt: '2025-10-15T08:00:00Z',
		updatedAt: '2026-02-01T10:00:00Z'
	},
	{
		id: 4,
		name: 'Bird Species Documentation',
		description: 'Comprehensive survey of bird species in protected areas',
		startDate: '2026-02-15T00:00:00Z',
		endDate: '2026-05-15T23:59:59Z',
		status: 'active',
		organizationId: 2,
		createdAt: '2026-01-20T12:00:00Z',
		updatedAt: '2026-02-10T09:30:00Z'
	},
	{
		id: 5,
		name: 'Water Resource Assessment',
		description: 'Mapping water sources and quality for wildlife',
		startDate: '2026-04-01T00:00:00Z',
		endDate: '2026-06-30T23:59:59Z',
		status: 'draft',
		organizationId: 3,
		createdAt: '2026-02-05T14:00:00Z',
		updatedAt: '2026-02-12T11:20:00Z'
	},
	{
		id: 6,
		name: 'Wetland Biodiversity Survey',
		description: 'Comprehensive survey of wetland ecosystems and species',
		startDate: '2026-02-10T00:00:00Z',
		endDate: '2026-08-31T23:59:59Z',
		status: 'active',
		organizationId: 1,
		createdAt: '2026-01-25T10:00:00Z',
		updatedAt: '2026-02-10T15:00:00Z'
	}
];

// Mock Forms with comprehensive field types
export const mockForms = [
	{
		id: 1,
		projectId: 1,
		title: 'Wildlife Sighting Form',
		description: 'Record details of wildlife observations in the field',
		status: 'published',
		fields: [
			{
				id: 'f1-1',
				type: 'text',
				label: 'Observer Name',
				description: 'Enter your full name',
				placeholder: 'John Doe',
				required: true,
				order: 1
			},
			{
				id: 'f1-2',
				type: 'date',
				label: 'Observation Date',
				description: 'When did you make this observation?',
				required: true,
				order: 2
			},
			{
				id: 'f1-3',
				type: 'location',
				label: 'GPS Location',
				description: 'Record the coordinates of the sighting',
				required: true,
				order: 3
			},
			{
				id: 'f1-4',
				type: 'radio',
				label: 'Animal Type',
				description: 'Select the type of animal observed',
				required: true,
				options: [
					{ label: 'Elephant', value: 'elephant' },
					{ label: 'Lion', value: 'lion' },
					{ label: 'Giraffe', value: 'giraffe' },
					{ label: 'Buffalo', value: 'buffalo' },
					{ label: 'Other', value: 'other' }
				],
				order: 4
			},
			{
				id: 'f1-5',
				type: 'number',
				label: 'Number of Animals',
				description: 'How many animals did you observe?',
				required: true,
				validation: { min: 1, max: 1000 },
				order: 5
			},
			{
				id: 'f1-6',
				type: 'checkbox',
				label: 'Behavior Observed',
				description: 'Select all behaviors you observed',
				options: [
					{ label: 'Feeding', value: 'feeding' },
					{ label: 'Resting', value: 'resting' },
					{ label: 'Moving', value: 'moving' },
					{ label: 'Social interaction', value: 'social' },
					{ label: 'Drinking', value: 'drinking' }
				],
				order: 6
			},
			{
				id: 'f1-7',
				type: 'textarea',
				label: 'Additional Notes',
				description: 'Any other observations or details',
				placeholder: 'Enter detailed observations here...',
				required: false,
				order: 7
			},
			{
				id: 'f1-8',
				type: 'file',
				label: 'Photo Evidence',
				description: 'Upload photos of the sighting',
				required: false,
				order: 8
			}
		],
		createdAt: '2026-01-20T10:00:00Z',
		updatedAt: '2026-02-05T14:30:00Z'
	},
	{
		id: 2,
		projectId: 1,
		title: 'Habitat Assessment Form',
		description: 'Evaluate habitat conditions and environmental factors',
		status: 'published',
		fields: [
			{
				id: 'f2-1',
				type: 'text',
				label: 'Site Name',
				required: true,
				order: 1
			},
			{
				id: 'f2-2',
				type: 'radio',
				label: 'Vegetation Density',
				required: true,
				options: [
					{ label: 'Dense', value: 'dense' },
					{ label: 'Moderate', value: 'moderate' },
					{ label: 'Sparse', value: 'sparse' },
					{ label: 'None', value: 'none' }
				],
				order: 2
			},
			{
				id: 'f2-3',
				type: 'number',
				label: 'Temperature (°C)',
				required: true,
				validation: { min: -10, max: 50 },
				order: 3
			}
		],
		createdAt: '2026-01-22T11:00:00Z',
		updatedAt: '2026-02-01T09:15:00Z'
	},
	{
		id: 3,
		projectId: 2,
		title: 'Elephant Tracking Form',
		description: 'Track individual elephants and their movements',
		status: 'draft',
		fields: [
			{
				id: 'f3-1',
				type: 'text',
				label: 'Elephant ID',
				placeholder: 'e.g., ELE-001',
				required: true,
				order: 1
			},
			{
				id: 'f3-2',
				type: 'radio',
				label: 'Age Group',
				required: true,
				options: [
					{ label: 'Calf (0-2 years)', value: 'calf' },
					{ label: 'Juvenile (3-10 years)', value: 'juvenile' },
					{ label: 'Adult (11+ years)', value: 'adult' }
				],
				order: 2
			},
			{
				id: 'f3-3',
				type: 'location',
				label: 'Current Location',
				required: true,
				order: 3
			}
		],
		createdAt: '2026-02-05T13:00:00Z',
		updatedAt: '2026-02-10T16:45:00Z'
	},
	{
		id: 4,
		projectId: 4,
		title: 'Bird Species Survey',
		description: 'Document bird species and their characteristics',
		status: 'published',
		fields: [
			{
				id: 'f4-1',
				type: 'text',
				label: 'Species Name',
				placeholder: 'Common or scientific name',
				required: true,
				order: 1
			},
			{
				id: 'f4-2',
				type: 'number',
				label: 'Flock Size',
				validation: { min: 1, max: 10000 },
				required: true,
				order: 2
			},
			{
				id: 'f4-3',
				type: 'email',
				label: 'Observer Email',
				required: true,
				order: 3
			},
			{
				id: 'f4-4',
				type: 'phone',
				label: 'Contact Number',
				required: false,
				order: 4
			}
		],
		createdAt: '2026-02-01T08:30:00Z',
		updatedAt: '2026-02-08T12:00:00Z'
	},
	{
		id: 5,
		projectId: 5,
		title: 'Water Source Documentation',
		description: 'Map and assess water sources in the area',
		status: 'draft',
		fields: [
			{
				id: 'f5-1',
				type: 'text',
				label: 'Water Source Name',
				required: true,
				order: 1
			},
			{
				id: 'f5-2',
				type: 'radio',
				label: 'Source Type',
				required: true,
				options: [
					{ label: 'River', value: 'river' },
					{ label: 'Lake', value: 'lake' },
					{ label: 'Pond', value: 'pond' },
					{ label: 'Spring', value: 'spring' },
					{ label: 'Borehole', value: 'borehole' }
				],
				order: 2
			},
			{
				id: 'f5-3',
				type: 'url',
				label: 'Map Link',
				description: 'Link to map or external resource',
				required: false,
				order: 3
			}
		],
		createdAt: '2026-02-10T10:00:00Z',
		updatedAt: '2026-02-12T14:20:00Z'
	},
	{
		id: 6,
		projectId: 3,
		title: 'Community Engagement Survey',
		description: 'Assess community involvement in conservation activities',
		status: 'published',
		fields: [
			{
				id: 'f6-1',
				type: 'text',
				label: 'Community Name',
				placeholder: 'Name of the community',
				required: true,
				order: 1
			},
			{
				id: 'f6-2',
				type: 'number',
				label: 'Number of Participants',
				validation: { min: 1, max: 1000 },
				required: true,
				order: 2
			},
			{
				id: 'f6-3',
				type: 'radio',
				label: 'Engagement Level',
				required: true,
				options: [
					{ label: 'Very Active', value: 'very_active' },
					{ label: 'Active', value: 'active' },
					{ label: 'Moderate', value: 'moderate' },
					{ label: 'Low', value: 'low' }
				],
				order: 3
			},
			{
				id: 'f6-4',
				type: 'textarea',
				label: 'Activities Undertaken',
				placeholder: 'Describe conservation activities...',
				required: true,
				order: 4
			},
			{
				id: 'f6-5',
				type: 'email',
				label: 'Contact Person Email',
				required: true,
				order: 5
			}
		],
		createdAt: '2025-11-10T09:00:00Z',
		updatedAt: '2025-12-15T11:30:00Z'
	},
	{
		id: 7,
		projectId: 6,
		title: 'Wetland Flora Survey',
		description: 'Document plant species in wetland areas',
		status: 'published',
		fields: [
			{
				id: 'f7-1',
				type: 'text',
				label: 'Plant Species',
				placeholder: 'Common or scientific name',
				required: true,
				order: 1
			},
			{
				id: 'f7-2',
				type: 'location',
				label: 'GPS Coordinates',
				required: true,
				order: 2
			},
			{
				id: 'f7-3',
				type: 'radio',
				label: 'Abundance',
				required: true,
				options: [
					{ label: 'Rare', value: 'rare' },
					{ label: 'Common', value: 'common' },
					{ label: 'Abundant', value: 'abundant' }
				],
				order: 3
			},
			{
				id: 'f7-4',
				type: 'textarea',
				label: 'Notes',
				placeholder: 'Additional observations',
				required: false,
				order: 4
			}
		],
		createdAt: '2026-02-01T10:00:00Z',
		updatedAt: '2026-02-08T14:00:00Z'
	},
	{
		id: 8,
		projectId: 6,
		title: 'Wetland Fauna Survey',
		description: 'Record animal species found in wetland habitats',
		status: 'published',
		fields: [
			{
				id: 'f8-1',
				type: 'text',
				label: 'Species Name',
				placeholder: 'Common or scientific name',
				required: true,
				order: 1
			},
			{
				id: 'f8-2',
				type: 'radio',
				label: 'Species Type',
				required: true,
				options: [
					{ label: 'Amphibian', value: 'amphibian' },
					{ label: 'Reptile', value: 'reptile' },
					{ label: 'Bird', value: 'bird' },
					{ label: 'Mammal', value: 'mammal' },
					{ label: 'Fish', value: 'fish' }
				],
				order: 2
			},
			{
				id: 'f8-3',
				type: 'number',
				label: 'Count',
				validation: { min: 1, max: 10000 },
				required: true,
				order: 3
			},
			{
				id: 'f8-4',
				type: 'date',
				label: 'Observation Date',
				required: true,
				order: 4
			}
		],
		createdAt: '2026-02-01T10:00:00Z',
		updatedAt: '2026-02-08T14:00:00Z'
	},
	{
		id: 9,
		projectId: 1,
		title: 'FanMilk Vendor Satisfaction Scorecard',
		description: 'Comprehensive vendor satisfaction assessment with weighted sections',
		status: 'published',
		scoringEnabled: true,
		fields: [
			// SECTION 1: Product Availability & Quality (25%)
			{
				id: 'pb-1',
				type: 'pageBreak',
				label: 'Product Availability & Quality',
				description: 'Stock consistency, cold-chain integrity, product freshness',
				required: false,
				order: 1,
				weight: 25
			},
			{
				id: 'f9-1',
				type: 'radio',
				label: 'I usually receive enough FanMilk products to meet my daily sales needs',
				required: true,
				options: [
					{ label: 'Strongly Agree', value: 'strongly_agree', score: 5 },
					{ label: 'Agree', value: 'agree', score: 4 },
					{ label: 'Neutral', value: 'neutral', score: 3 },
					{ label: 'Disagree', value: 'disagree', score: 2 },
					{ label: 'Strongly Disagree', value: 'strongly_disagree', score: 1 }
				],
				order: 2
			},
			{
				id: 'f9-2',
				type: 'radio',
				label: 'Product deliveries arrive on time as promised',
				required: true,
				options: [
					{ label: 'Strongly Agree', value: 'strongly_agree', score: 5 },
					{ label: 'Agree', value: 'agree', score: 4 },
					{ label: 'Neutral', value: 'neutral', score: 3 },
					{ label: 'Disagree', value: 'disagree', score: 2 },
					{ label: 'Strongly Disagree', value: 'strongly_disagree', score: 1 }
				],
				order: 3
			},
			{
				id: 'f9-3',
				type: 'radio',
				label: 'Products are always in good frozen condition when supplied',
				required: true,
				options: [
					{ label: 'Strongly Agree', value: 'strongly_agree', score: 5 },
					{ label: 'Agree', value: 'agree', score: 4 },
					{ label: 'Neutral', value: 'neutral', score: 3 },
					{ label: 'Disagree', value: 'disagree', score: 2 },
					{ label: 'Strongly Disagree', value: 'strongly_disagree', score: 1 }
				],
				order: 4
			},

			// SECTION 2: Agent Relationships (20%)
			{
				id: 'pb-2',
				type: 'pageBreak',
				label: 'Agent Relationships',
				description: 'Daily engagement quality, respect, responsiveness',
				required: false,
				order: 5,
				weight: 20
			},
			{
				id: 'f9-4',
				type: 'radio',
				label: 'My agent treats me with respect and professionalism',
				required: true,
				options: [
					{ label: 'Strongly Agree', value: 'strongly_agree', score: 5 },
					{ label: 'Agree', value: 'agree', score: 4 },
					{ label: 'Neutral', value: 'neutral', score: 3 },
					{ label: 'Disagree', value: 'disagree', score: 2 },
					{ label: 'Strongly Disagree', value: 'strongly_disagree', score: 1 }
				],
				order: 6
			},
			{
				id: 'f9-5',
				type: 'radio',
				label: 'My agent responds quickly when I raise issues',
				required: true,
				options: [
					{ label: 'Strongly Agree', value: 'strongly_agree', score: 5 },
					{ label: 'Agree', value: 'agree', score: 4 },
					{ label: 'Neutral', value: 'neutral', score: 3 },
					{ label: 'Disagree', value: 'disagree', score: 2 },
					{ label: 'Strongly Disagree', value: 'strongly_disagree', score: 1 }
				],
				order: 7
			},

			// SECTION 3: Organizational Relationship (20%)
			{
				id: 'pb-3',
				type: 'pageBreak',
				label: 'Organizational Relationship',
				description: 'Trust in FanMilk, communication clarity, issue resolution',
				required: false,
				order: 8,
				weight: 20
			},
			{
				id: 'f9-6',
				type: 'radio',
				label: 'I trust FanMilk to act in the best interest of vendors',
				required: true,
				options: [
					{ label: 'Strongly Agree', value: 'strongly_agree', score: 5 },
					{ label: 'Agree', value: 'agree', score: 4 },
					{ label: 'Neutral', value: 'neutral', score: 3 },
					{ label: 'Disagree', value: 'disagree', score: 2 },
					{ label: 'Strongly Disagree', value: 'strongly_disagree', score: 1 }
				],
				order: 9
			},
			{
				id: 'f9-7',
				type: 'radio',
				label: 'FanMilk communicates changes clearly and on time',
				required: true,
				options: [
					{ label: 'Strongly Agree', value: 'strongly_agree', score: 5 },
					{ label: 'Agree', value: 'agree', score: 4 },
					{ label: 'Neutral', value: 'neutral', score: 3 },
					{ label: 'Disagree', value: 'disagree', score: 2 },
					{ label: 'Strongly Disagree', value: 'strongly_disagree', score: 1 }
				],
				order: 10
			},

			// SECTION 4: Vendor Motivation (20%)
			{
				id: 'pb-4',
				type: 'pageBreak',
				label: 'Vendor Motivation',
				description: 'Earnings satisfaction, incentives, pride in brand',
				required: false,
				order: 11,
				weight: 20
			},
			{
				id: 'f9-8',
				type: 'radio',
				label: 'My earnings from selling FanMilk products are satisfactory',
				required: true,
				options: [
					{ label: 'Strongly Agree', value: 'strongly_agree', score: 5 },
					{ label: 'Agree', value: 'agree', score: 4 },
					{ label: 'Neutral', value: 'neutral', score: 3 },
					{ label: 'Disagree', value: 'disagree', score: 2 },
					{ label: 'Strongly Disagree', value: 'strongly_disagree', score: 1 }
				],
				order: 12
			},
			{
				id: 'f9-9',
				type: 'radio',
				label: 'I am proud to sell FanMilk products',
				required: true,
				options: [
					{ label: 'Strongly Agree', value: 'strongly_agree', score: 5 },
					{ label: 'Agree', value: 'agree', score: 4 },
					{ label: 'Neutral', value: 'neutral', score: 3 },
					{ label: 'Disagree', value: 'disagree', score: 2 },
					{ label: 'Strongly Disagree', value: 'strongly_disagree', score: 1 }
				],
				order: 13
			},

			// SECTION 5: Equipment State (15%)
			{
				id: 'pb-5',
				type: 'pageBreak',
				label: 'Equipment State',
				description: 'Functional and visual condition of carts, bicycles, freezers',
				required: false,
				order: 14,
				weight: 15
			},
			{
				id: 'f9-10',
				type: 'radio',
				label: 'My cart/bicycle/freezer works properly',
				required: true,
				options: [
					{ label: 'Strongly Agree', value: 'strongly_agree', score: 5 },
					{ label: 'Agree', value: 'agree', score: 4 },
					{ label: 'Neutral', value: 'neutral', score: 3 },
					{ label: 'Disagree', value: 'disagree', score: 2 },
					{ label: 'Strongly Disagree', value: 'strongly_disagree', score: 1 }
				],
				order: 15
			},
			{
				id: 'f9-11',
				type: 'radio',
				label: 'Equipment breakdowns are fixed quickly',
				required: true,
				options: [
					{ label: 'Strongly Agree', value: 'strongly_agree', score: 5 },
					{ label: 'Agree', value: 'agree', score: 4 },
					{ label: 'Neutral', value: 'neutral', score: 3 },
					{ label: 'Disagree', value: 'disagree', score: 2 },
					{ label: 'Strongly Disagree', value: 'strongly_disagree', score: 1 }
				],
				order: 16
			}
		],
		createdAt: '2026-02-10T10:00:00Z',
		updatedAt: '2026-02-15T14:00:00Z'
	}
];

// Mock Users/Agents
export const mockUsers = [
	{
		id: 101,
		email: 'john.smith@eawf.org',
		name: 'John Smith',
		role: 'Agent',
		organizationId: 1,
		isActive: true,
		projectsAssigned: [1, 2],
		submissionCount: 45,
		lastActiveAt: '2026-02-16T14:30:00Z',
		createdAt: '2026-01-10T09:00:00Z',
		updatedAt: '2026-02-16T14:30:00Z',
		stats: {
			totalSubmissions: 45,
			last7Days: 8,
			last30Days: 32,
			avgPerDay: 1.5
		}
	},
	{
		id: 102,
		email: 'mary.johnson@eawf.org',
		name: 'Mary Johnson',
		role: 'Agent',
		organizationId: 1,
		isActive: true,
		projectsAssigned: [1],
		submissionCount: 67,
		lastActiveAt: '2026-02-17T10:15:00Z',
		createdAt: '2025-12-05T08:30:00Z',
		updatedAt: '2026-02-17T10:15:00Z',
		stats: {
			totalSubmissions: 67,
			last7Days: 12,
			last30Days: 51,
			avgPerDay: 2.2
		}
	},
	{
		id: 103,
		email: 'david.wilson@eawf.org',
		name: 'David Wilson',
		role: 'Agent',
		organizationId: 1,
		isActive: false,
		projectsAssigned: [2],
		submissionCount: 23,
		lastActiveAt: '2026-01-28T16:45:00Z',
		createdAt: '2026-01-15T11:00:00Z',
		updatedAt: '2026-02-10T09:20:00Z',
		stats: {
			totalSubmissions: 23,
			last7Days: 0,
			last30Days: 5,
			avgPerDay: 0.8
		}
	},
	{
		id: 104,
		email: 'sarah.brown@eawf.org',
		name: 'Sarah Brown',
		role: 'Agent',
		organizationId: 1,
		isActive: true,
		projectsAssigned: [1, 2],
		submissionCount: 89,
		lastActiveAt: '2026-02-17T09:00:00Z',
		createdAt: '2025-11-20T07:15:00Z',
		updatedAt: '2026-02-17T09:00:00Z',
		stats: {
			totalSubmissions: 89,
			last7Days: 15,
			last30Days: 62,
			avgPerDay: 3.0
		}
	},
	{
		id: 105,
		email: 'james.davis@eawf.org',
		name: 'James Davis',
		role: 'Agent',
		organizationId: 1,
		isActive: true,
		projectsAssigned: [1],
		submissionCount: 34,
		lastActiveAt: '2026-02-16T18:20:00Z',
		createdAt: '2026-01-08T10:30:00Z',
		updatedAt: '2026-02-16T18:20:00Z',
		stats: {
			totalSubmissions: 34,
			last7Days: 7,
			last30Days: 28,
			avgPerDay: 1.1
		}
	}
];

// Mock Agent Statistics
export const mockAgentStatistics = {
	submissions: {
		total: 45,
		last7Days: 8,
		last30Days: 32,
		avgPerDay: 1.5,
		timeline: [
			{ date: '2026-01-18', count: 2 },
			{ date: '2026-01-19', count: 1 },
			{ date: '2026-01-20', count: 3 },
			{ date: '2026-01-21', count: 0 },
			{ date: '2026-01-22', count: 2 },
			{ date: '2026-01-23', count: 4 },
			{ date: '2026-01-24', count: 1 },
			{ date: '2026-01-25', count: 2 },
			{ date: '2026-01-26', count: 3 },
			{ date: '2026-01-27', count: 1 },
			{ date: '2026-01-28', count: 2 },
			{ date: '2026-01-29', count: 0 },
			{ date: '2026-01-30', count: 3 },
			{ date: '2026-01-31', count: 2 }
		],
		byProject: {
			'1': 28,
			'2': 17
		}
	},
	activity: {
		totalActiveDays: 24,
		averageSubmissionsPerActiveDay: 1.9
	}
};

// Mock Submissions
export const mockSubmissions = [
	{
		id: 1001,
		userId: 101,
		projectId: 1,
		projectName: 'Wildlife Census 2026',
		formId: 1,
		formName: 'Wildlife Sighting Form',
		answers: {
			'f1-1': 'John Smith',
			'f1-2': '2026-02-16',
			'f1-3': '-2.3333, 34.8333',
			'f1-4': 'Elephant',
			'f1-5': 12,
			'f1-6': ['Feeding', 'Moving']
		},
		localSyncId: 'sub-1001-abc123',
		createdAt: '2026-02-16T14:30:00Z',
		syncedAt: '2026-02-16T14:35:00Z'
	},
	{
		id: 1002,
		userId: 101,
		projectId: 1,
		projectName: 'Wildlife Census 2026',
		formId: 1,
		formName: 'Wildlife Sighting Form',
		answers: {
			'f1-1': 'John Smith',
			'f1-2': '2026-02-15',
			'f1-3': '-2.3456, 34.8567',
			'f1-4': 'Lion',
			'f1-5': 3,
			'f1-6': ['Resting']
		},
		localSyncId: 'sub-1002-def456',
		createdAt: '2026-02-15T11:20:00Z',
		syncedAt: '2026-02-15T11:25:00Z'
	},
	{
		id: 1003,
		userId: 101,
		projectId: 2,
		projectName: 'Elephant Migration Study',
		formId: 3,
		formName: 'Elephant Tracking Form',
		answers: {
			'Elephant ID': 'ELE-042',
			'Age Group': 'Adult',
			'Current Location': '34.5544° S, 18.4216° E'
		},
		localSyncId: 'sub-1003-ghi789',
		createdAt: '2026-02-14T09:45:00Z',
		syncedAt: '2026-02-14T09:50:00Z'
	},
	{
		id: 1004,
		userId: 102,
		projectId: 1,
		projectName: 'Wildlife Census 2026',
		formId: 1,
		formName: 'Wildlife Sighting Form',
		answers: {
			'f1-1': 'Mary Johnson',
			'f1-2': '2026-02-17',
			'f1-3': '-2.3789, 34.8901',
			'f1-4': 'Giraffe',
			'f1-5': 8,
			'f1-6': ['Feeding', 'Social interaction']
		},
		localSyncId: 'sub-1004-jkl012',
		createdAt: '2026-02-17T10:15:00Z',
		syncedAt: '2026-02-17T10:20:00Z'
	},
	{
		id: 1005,
		userId: 102,
		projectId: 1,
		projectName: 'Wildlife Census 2026',
		formId: 2,
		formName: 'Habitat Assessment Form',
		answers: {
			'f2-1': 'Serengeti Plains - North',
			'f2-2': 'Moderate',
			'f2-3': 28
		},
		localSyncId: 'sub-1005-mno345',
		createdAt: '2026-02-16T15:30:00Z',
		syncedAt: '2026-02-16T15:35:00Z'
	},
	{
		id: 1008,
		userId: 101,
		projectId: 1,
		projectName: 'Wildlife Census 2026',
		formId: 1,
		formName: 'Wildlife Sighting Form',
		answers: {
			'f1-1': 'Sarah Williams',
			'f1-2': '2026-02-18',
			'f1-3': '-2.3901, 34.9012',
			'f1-4': 'Buffalo',
			'f1-5': 25,
			'f1-6': ['Moving', 'Drinking']
		},
		localSyncId: 'sub-1008-xyz789',
		createdAt: '2026-02-18T08:15:00Z',
		syncedAt: '2026-02-18T08:20:00Z'
	},
	{
		id: 1009,
		userId: 102,
		projectId: 1,
		projectName: 'Wildlife Census 2026',
		formId: 1,
		formName: 'Wildlife Sighting Form',
		answers: {
			'f1-1': 'Tom Davis',
			'f1-2': '2026-02-18',
			'f1-3': '-2.4012, 34.9234',
			'f1-4': 'Elephant',
			'f1-5': 18,
			'f1-6': ['Feeding', 'Social interaction']
		},
		localSyncId: 'sub-1009-uvw456',
		createdAt: '2026-02-18T09:30:00Z',
		syncedAt: '2026-02-18T09:35:00Z'
	},
	{
		id: 1010,
		userId: 101,
		projectId: 1,
		projectName: 'Wildlife Census 2026',
		formId: 1,
		formName: 'Wildlife Sighting Form',
		answers: {
			'f1-1': 'Emma Brown',
			'f1-2': '2026-02-19',
			'f1-3': '-2.4123, 34.9345',
			'f1-4': 'Giraffe',
			'f1-5': 6,
			'f1-6': ['Feeding']
		},
		localSyncId: 'sub-1010-rst123',
		createdAt: '2026-02-19T07:45:00Z',
		syncedAt: '2026-02-19T07:50:00Z'
	},
	{
		id: 1011,
		userId: 102,
		projectId: 1,
		projectName: 'Wildlife Census 2026',
		formId: 2,
		formName: 'Habitat Assessment Form',
		answers: {
			'f2-1': 'Serengeti Plains - South',
			'f2-2': 'Dense',
			'f2-3': 26
		},
		localSyncId: 'sub-1011-abc890',
		createdAt: '2026-02-18T14:20:00Z',
		syncedAt: '2026-02-18T14:25:00Z'
	},
	{
		id: 1012,
		userId: 101,
		projectId: 1,
		projectName: 'Wildlife Census 2026',
		formId: 2,
		formName: 'Habitat Assessment Form',
		answers: {
			'f2-1': 'Serengeti Plains - East',
			'f2-2': 'Sparse',
			'f2-3': 31
		},
		localSyncId: 'sub-1012-def567',
		createdAt: '2026-02-19T10:10:00Z',
		syncedAt: '2026-02-19T10:15:00Z'
	},
	{
		id: 1006,
		userId: 101,
		projectId: 3,
		projectName: 'Community Conservation Survey',
		formId: 6,
		formName: 'Community Engagement Survey',
		answers: {
			'f6-1': 'Maasai Village - Kimana',
			'f6-2': 45,
			'f6-3': 'very_active',
			'f6-4': 'Tree planting, wildlife monitoring, anti-poaching patrols, community education programs',
			'f6-5': 'kimana.chief@email.com'
		},
		localSyncId: 'sub-1006-pqr678',
		createdAt: '2026-01-15T10:30:00Z',
		syncedAt: '2026-01-15T10:35:00Z'
	},
	{
		id: 1007,
		userId: 101,
		projectId: 3,
		projectName: 'Community Conservation Survey',
		formId: 6,
		formName: 'Community Engagement Survey',
		answers: {
			'f6-1': 'Samburu Settlement - Archer\'s Post',
			'f6-2': 32,
			'f6-3': 'active',
			'f6-4': 'Water conservation, livestock management training, eco-tourism initiatives',
			'f6-5': 'archerspost@email.com'
		},
		localSyncId: 'sub-1007-stu901',
		createdAt: '2026-01-20T14:15:00Z',
		syncedAt: '2026-01-20T14:20:00Z'
	},
	{
		id: 1008,
		userId: 102,
		projectId: 3,
		projectName: 'Community Conservation Survey',
		formId: 6,
		formName: 'Community Engagement Survey',
		answers: {
			'f6-1': 'Turkana Community - Lokitaung',
			'f6-2': 28,
			'f6-3': 'moderate',
			'f6-4': 'Wildlife protection awareness, grazing land management',
			'f6-5': 'lokitaung.leader@email.com'
		},
		localSyncId: 'sub-1008-vwx234',
		createdAt: '2026-01-25T11:45:00Z',
		syncedAt: '2026-01-25T11:50:00Z'
	}
];

// Mock Views
export const mockViews = [
	{
		id: 1,
		projectId: 1,
		name: 'Wildlife Sightings by Animal Type',
		description: 'Bar chart showing count of sightings per animal type',
		definition: JSON.stringify({
			chartType: 'bar',
			description: 'Distribution of wildlife sightings',
			config: {
				formId: 1,
				aggregation: 'count',
				xAxis: 'f1-4', // Animal Type field
				yAxis: 'f1-5', // Number of Animals field
				colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
			}
		}),
		createdAt: '2026-02-10T10:00:00Z',
		updatedAt: '2026-02-15T14:30:00Z'
	},
	{
		id: 2,
		projectId: 1,
		name: 'Total Animals Observed',
		description: 'Number card showing total count',
		definition: JSON.stringify({
			chartType: 'number',
			description: 'Total animals counted',
			config: {
				formId: 1,
				aggregation: 'sum',
				field: 'f1-5' // Number of Animals
			}
		}),
		createdAt: '2026-02-12T11:00:00Z',
		updatedAt: '2026-02-12T11:00:00Z'
	},
	{
		id: 3,
		projectId: 4,
		name: 'Bird Species Distribution',
		description: 'Doughnut chart of flock sizes by species',
		definition: JSON.stringify({
			chartType: 'doughnut',
			description: 'Bird population by species',
			config: {
				formId: 4,
				aggregation: 'sum',
				groupBy: 'f4-1', // Species Name
				field: 'f4-2', // Flock Size
				colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
			}
		}),
		createdAt: '2026-02-14T09:00:00Z',
		updatedAt: '2026-02-14T09:00:00Z'
	}
];

// Mock Dashboards
export const mockDashboards = [
	{
		id: 1,
		projectId: 1,
		name: 'Wildlife Overview',
		description: 'Main dashboard showing wildlife census data',
		definition: JSON.stringify({
			layout: [
				{
					id: 'item-1',
					viewId: 1,
					x: 0,
					y: 0,
					width: 8,
					height: 3
				},
				{
					id: 'item-2',
					viewId: 2,
					x: 8,
					y: 0,
					width: 4,
					height: 3
				}
			],
			gridColumns: 12,
			gridRowHeight: 120
		}),
		createdAt: '2026-02-15T10:00:00Z',
		updatedAt: '2026-02-16T14:30:00Z'
	},
	{
		id: 2,
		projectId: 4,
		name: 'Bird Species Analytics',
		description: 'Comprehensive view of bird survey data',
		definition: JSON.stringify({
			layout: [
				{
					id: 'item-1',
					viewId: 3,
					x: 0,
					y: 0,
					width: 12,
					height: 4
				}
			],
			gridColumns: 12,
			gridRowHeight: 120
		}),
		createdAt: '2026-02-14T11:00:00Z',
		updatedAt: '2026-02-14T11:00:00Z'
	}
];

// Helper to simulate API delay
export const simulateDelay = (ms: number = 500) =>
	new Promise((resolve) => setTimeout(resolve, ms));
