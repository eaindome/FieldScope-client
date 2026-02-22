import { isTestMode, API_BASE_URL, PROD_API_BASE_URL } from '$lib/config';
import {
	mockDashboardStats,
	mockOrganizations,
	mockInvitations,
	mockSystemHealth,
	mockUsers,
	mockAgentStatistics,
	mockSubmissions,
	mockProjects,
	mockForms,
	mockViews,
	mockDashboards,
	simulateDelay
} from '$lib/mock-data';
import { cacheProjects, getCachedProjects, cacheForms, getCachedForms } from '$lib/offline/cache';

// Status enums matching server-side definitions
export enum FormStatus {
	Draft = 0,
	Published = 1,
	Inactive = 2
}

export enum ContentStatus {
	Draft = 0,
	Published = 1
}

class ApiClient {
	private baseUrl: string;

	constructor(baseUrl: string = PROD_API_BASE_URL) {
		this.baseUrl = baseUrl;
	}

	private getAuthToken(): string | null {
		if (typeof window === 'undefined') return null;
		return localStorage.getItem('accessToken');
	}

	private getRefreshToken(): string | null {
		if (typeof window === 'undefined') return null;
		return localStorage.getItem('refreshToken');
	}

	private async refreshAccessToken(): Promise<boolean> {
		const refreshToken = this.getRefreshToken();
		if (!refreshToken) return false;

		try {
			const response = await fetch(`${this.baseUrl}/auth/refresh`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refreshToken })
			});

			if (response.ok) {
				const data = await response.json();
				localStorage.setItem('accessToken', data.accessToken);
				localStorage.setItem('refreshToken', data.refreshToken);
				return true;
			}
			return false;
		} catch {
			return false;
		}
	}

	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<{ data?: T; error?: string }> {
		const url = `${this.baseUrl}${endpoint}`;
		const token = this.getAuthToken();

		const headersToMerge: Record<string, string> = {};
		if (typeof options.headers === 'object' && options.headers !== null) {
			if (options.headers instanceof Headers) {
				options.headers.forEach((value, key) => {
					headersToMerge[key] = value;
				});
			} else {
				Object.assign(headersToMerge, options.headers);
			}
		}

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			...headersToMerge
		};

		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}

		try {
			let response = await fetch(url, { ...options, headers: headers as HeadersInit });

			// Handle 401 - Try to refresh token
			if (response.status === 401) {
				const refreshed = await this.refreshAccessToken();
				if (refreshed) {
					// Retry the request with new token
					const newToken = this.getAuthToken();
					if (newToken) {
						headers['Authorization'] = `Bearer ${newToken}`;
					}
					response = await fetch(url, { ...options, headers: headers as HeadersInit });
				} else {
					// Refresh failed - redirect to login
					if (typeof window !== 'undefined') {
						localStorage.removeItem('accessToken');
						localStorage.removeItem('refreshToken');
						window.location.href = '/login';
					}
					return { error: 'Authentication failed' };
				}
			}

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return { error: errorData.error || `HTTP ${response.status}: ${response.statusText}` };
			}

			const data = await response.json();
			return { data };
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Network error' };
		}
	}

	// Auth endpoints
	async login(email: string, password: string) {
		return this.request<{
			accessToken: string;
			refreshToken: string;
			expiresIn: number;
		}>('/auth/login', {
			method: 'POST',
			body: JSON.stringify({ email, password })
		});
	}

	async register(email: string, password: string, name?: string) {
		return this.request<{
			message: string;
			user: { id: number; email: string; name?: string };
		}>('/auth/register', {
			method: 'POST',
			body: JSON.stringify({ email, password, name })
		});
	}

	async logout() {
		if (typeof window !== 'undefined') {
			localStorage.removeItem('accessToken');
			localStorage.removeItem('refreshToken');
			window.location.href = '/login';
		}
	}

	async getCurrentUser() {
		// TEST MODE: Return mock data
		if (isTestMode()) {
			await simulateDelay(200);
			return {
				data: {
					id: 1,
					email: 'agent@example.com',
					role: 'Agent',
					organizationId: 1,
					organizationName: 'Test Organization'
				}
			};
		}

		try {
			// Try network first
			const result = await this.request<{ id: number; email: string; role: string; organizationId?: number; organizationName?: string }>(
				'/auth/me'
			);

			if (result.data && typeof window !== 'undefined') {
				// Cache user data in localStorage
				localStorage.setItem('cachedUser', JSON.stringify(result.data));
			}

			return result;
		} catch (error) {
			// Network error, try cache
			if (typeof window !== 'undefined') {
				const cached = localStorage.getItem('cachedUser');
				if (cached) {
					try {
						console.log('[FieldScope] Using cached user data (offline)');
						return { data: JSON.parse(cached), fromCache: true };
					} catch (e) {
						// Invalid cached data
					}
				}
			}
			console.warn('[FieldScope] No cached user data available');
			return { error: 'Unable to get user information' };
		}
	}

	async acceptInvitation(token: string, password: string) {
		return this.request<{
			message: string;
			email: string;
			role: string;
		}>('/invitations/accept', {
			method: 'POST',
			body: JSON.stringify({ token, password })
		});
	}

	async forgotPassword(email: string) {
		return this.request<{
			message: string;
		}>('/auth/forgot-password', {
			method: 'POST',
			body: JSON.stringify({ email })
		});
	}

	async resetPassword(token: string, newPassword: string) {
		return this.request<{
			message: string;
		}>('/auth/reset-password', {
			method: 'POST',
			body: JSON.stringify({ token, newPassword })
		});
	}

	async resetPasswordWithOtp(email: string, otp: string, newPassword: string) {
		return this.request<{
			message: string;
		}>('/auth/reset-password-otp', {
			method: 'POST',
			body: JSON.stringify({ email, otp, newPassword })
		});
	}

	// SuperAdmin - Dashboard Stats
	async getDashboardStats() {
		// TEST MODE: Return mock data
		if (isTestMode()) {
			await simulateDelay(300);
			return { data: mockDashboardStats };
		}

		return this.request<{
			organizations: {
				total: number;
				active: number;
				createdThisMonth: number;
				dormant: number;
			};
			users: {
				total: number;
				byRole: { superAdmin: number; admin: number; agent: number };
				active: number;
				inactive: number;
				averagePerOrganization: number;
			};
			projects: {
				total: number;
				byStatus: { draft: number; active: number; closed: number };
				averagePerOrganization: number;
			};
			submissions: {
				total: number;
				last7Days: number;
				last30Days: number;
				averagePerProject: number;
				topOrganizationsBySubmissions: Array<{
					organizationId: number;
					organizationName: string;
					submissionCount: number;
				}>;
			};
			invitations: {
				total: number;
				pending: number;
				accepted: number;
				expired: number;
				acceptanceRate: number;
			};
			generatedAt: string;
		}>('/admin/dashboard/stats');
	}

	// SuperAdmin - System Health
	async getSystemHealth() {
		// TEST MODE: Return mock data
		if (isTestMode()) {
			await simulateDelay(200);
			return { data: mockSystemHealth };
		}

		return this.request<{
			status: string;
			timestamp: string;
			database: {
				canConnect: boolean;
				provider: string;
				pendingMigrations: number;
				appliedMigrations: number;
				lastMigration: string;
			};
			backgroundJobs: {
				status: string;
				hangfireEnabled: boolean;
				activeJobs: number;
				scheduledJobs: number;
			};
			performance: {
				databaseResponseTimeMs: number;
				serverUptimeFormatted: string;
				memoryUsageMB: number;
			};
		}>('/admin/health');
	}

	// SuperAdmin - Organizations
	async getOrganizations() {
		// TEST MODE: Return mock data
		if (isTestMode()) {
			await simulateDelay(250);
			return { data: mockOrganizations };
		}

		return this.request<
			Array<{
				id: number;
				name: string;
				description?: string;
				address?: string;
				city?: string;
				country?: string;
				phone?: string;
				email?: string;
				website?: string;
				logoUrl?: string;
				timeZone?: string;
				isActive: boolean;
				createdAt: string;
				updatedAt: string;
			}>
		>('/organizations');
	}

	async createOrganization(data: {
		name: string;
		description?: string;
		address?: string;
		city?: string;
		country?: string;
		phone?: string;
		email?: string;
		website?: string;
		logoUrl?: string;
		timeZone?: string;
	}) {
		return this.request('/organizations', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	async createAdminForOrganization(organizationId: number, email: string) {
		return this.request<{
			id: number;
			email: string;
			token: string;
			status: string;
			expiresAt: string;
		}>(`/organizations/${organizationId}/admins`, {
			method: 'POST',
			body: JSON.stringify({ email })
		});
	}

	async updateOrganization(id: number, data: {
		name: string;
		description?: string;
		address?: string;
		city?: string;
		country?: string;
		phone?: string;
		email?: string;
		website?: string;
		timeZone?: string;
	}) {
		return this.request(`/organizations/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		});
	}

	async deleteOrganization(id: number) {
		return this.request(`/organizations/${id}`, {
			method: 'DELETE'
		});
	}

	// SuperAdmin - Invitations
	async getInvitationsBySuperAdmin(status?: 'Pending' | 'Accepted' | 'Expired') {
		// TEST MODE: Return mock data
		if (isTestMode()) {
			await simulateDelay(200);
			const filtered = status
				? mockInvitations.filter((inv) => inv.status === status)
				: mockInvitations;
			return { data: filtered };
		}

		const query = status ? `?status=${status}` : '';
		return this.request<
			Array<{
				id: number;
				email: string;
				role: string;
				status: string;
				expiresAt: string;
				sentByUserId: number;
				createdAt: string;
			}>
		>(`/invitations/by-superadmin${query}`);
	}

	// Admin - Invitations
	async getInvitations(status?: 'Pending' | 'Accepted' | 'Expired') {
		// TEST MODE: Return mock data
		if (isTestMode()) {
			await simulateDelay(200);
			const filtered = status
				? mockInvitations.filter((inv) => inv.status === status)
				: mockInvitations;
			return { data: filtered };
		}

		const query = status ? `?status=${status}` : '';
		return this.request<
			Array<{
				id: number;
				email: string;
				role: string;
				status: string;
				expiresAt: string;
				sentByUserId: number;
				createdAt: string;
			}>
		>(`/invitations${query}`);
	}

	async resendInvitation(id: number) {
		return this.request<{ token: string; expiresAt: string }>(`/invitations/${id}/resend`, {
			method: 'POST'
		});
	}

	async deleteInvitation(id: number) {
		return this.request(`/invitations/${id}`, {
			method: 'DELETE'
		});
	}

	// Admin - Projects
	async getProjects() {
		// TEST MODE: Return mock data
		if (isTestMode()) {
			await simulateDelay(200);
			return { data: mockProjects };
		}

		try {
			// Try network first
			const result = await this.request<any[]>('/projects');

			if (result.data) {
				// Success! Cache the data
				await cacheProjects(result.data);
				return { data: result.data, error: result.error };
			}

			// Network request failed, try cache
			const cached = await getCachedProjects();
			if (cached) {
				console.log('[FieldScope] Using cached projects data (offline)');
				return { data: cached, error: undefined, fromCache: true };
			}

			return result; // Return original error
		} catch (error) {
			// Network error, try cache
			const cached = await getCachedProjects();
			if (cached) {
				console.log('[FieldScope] Using cached projects data (offline)');
				return { data: cached, error: undefined, fromCache: true };
			}
			console.warn('[FieldScope] No cached projects available');
			return { error: 'No internet connection and no cached data available' };
		}
	}

	async getProject(id: number) {
		// TEST MODE: Return mock data
		if (isTestMode()) {
			await simulateDelay(200);
			const project = mockProjects.find((p) => p.id === id);
			return project ? { data: project } : { error: 'Project not found' };
		}

		try {
			// Try network first
			const result = await this.request<{
				id: number;
				name: string;
				description?: string;
				startDate: string;
				endDate: string;
				status: string;
				organizationId: number;
				createdAt: string;
				updatedAt: string;
			}>(`/projects/${id}`);

			return result;
		} catch (error) {
			// Network error, try to find in cached projects
			const cached = await getCachedProjects<any>();
			if (cached) {
				const project = cached.find((p: any) => p.id === id);
				if (project) {
					console.log(`[FieldScope] Using cached project ${id} (offline)`);
					return { data: project, fromCache: true };
				}
			}
			console.warn(`[FieldScope] Project ${id} not found in cache`);
			return { error: 'Project not found and no cached data available' };
		}
	}

	async createProject(data: {
		name: string;
		description?: string;
		startDate: string;
		endDate: string;
	}) {
		return this.request<{
			id: number;
			name: string;
			description?: string;
			startDate: string;
			endDate: string;
			status: string;
			createdAt: string;
			updatedAt: string;
		}>('/projects', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	async updateProject(
		id: number,
		data: {
			name?: string;
			description?: string;
			startDate?: string;
			endDate?: string;
			status?: string;
		}
	) {
		return this.request<{
			id: number;
			name: string;
			description?: string;
			startDate: string;
			endDate: string;
			status: string;
			createdAt: string;
			updatedAt: string;
		}>(`/projects/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		});
	}

	async deleteProject(id: number) {
		return this.request<{ success: boolean }>(`/projects/${id}`, {
			method: 'DELETE'
		});
	}

	// Admin - Users/Agents Management
	async getUsers() {
		// TEST MODE: Return mock data
		if (isTestMode()) {
			await simulateDelay(250);
			return { data: mockUsers };
		}

		return this.request<
			Array<{
				id: number;
				email: string;
				name?: string;
				role: string;
				organizationId: number;
				isActive: boolean;
				projectsAssigned?: number[];
				submissionCount?: number;
				lastActiveAt?: string;
				createdAt: string;
				updatedAt: string;
				stats?: {
					totalSubmissions: number;
					last7Days: number;
					last30Days: number;
					avgPerDay: number;
				};
			}>
		>('/users');
	}

	async getUser(userId: number) {
		// TEST MODE: Return mock data
		if (isTestMode()) {
			await simulateDelay(200);
			const user = mockUsers.find((u) => u.id === userId);
			return { data: user };
		}

		return this.request<{
			id: number;
			email: string;
			name?: string;
			role: string;
			organizationId: number;
			isActive: boolean;
			projectsAssigned?: number[];
			submissionCount?: number;
			lastActiveAt?: string;
			createdAt: string;
			updatedAt: string;
			stats?: {
				totalSubmissions: number;
				last7Days: number;
				last30Days: number;
				avgPerDay: number;
			};
		}>(`/users/${userId}`);
	}

	async updateUserStatus(userId: number, isActive: boolean) {
		// TEST MODE: Simulate success
		if (isTestMode()) {
			await simulateDelay(300);
			const user = mockUsers.find((u) => u.id === userId);
			if (user) {
				user.isActive = isActive;
			}
			return { data: { success: true } };
		}

		// Server uses DELETE /users/{id} to deactivate (sets isActive = false)
		// There's no endpoint to reactivate, so only support deactivation
		if (!isActive) {
			return this.request(`/users/${userId}`, {
				method: 'DELETE'
			});
		} else {
			// Reactivation not supported by server
			return { error: 'User reactivation is not supported' };
		}
	}

	async getUserSubmissions(
		userId: number,
		filters: {
			projectId?: number;
			formId?: number;
			startDate?: string;
			endDate?: string;
		}
	) {
		// TEST MODE: Return mock data
		if (isTestMode()) {
			await simulateDelay(300);
			let filtered = mockSubmissions.filter((sub) => sub.userId === userId);

			if (filters.projectId) {
				filtered = filtered.filter((sub) => sub.projectId === filters.projectId);
			}
			if (filters.formId) {
				filtered = filtered.filter((sub) => sub.formId === filters.formId);
			}
			if (filters.startDate) {
				filtered = filtered.filter((sub) => new Date(sub.createdAt) >= new Date(filters.startDate!));
			}
			if (filters.endDate) {
				filtered = filtered.filter((sub) => new Date(sub.createdAt) <= new Date(filters.endDate!));
			}

			return { data: filtered };
		}

		const params = new URLSearchParams();
		params.append('submittedBy', userId.toString());
		if (filters.projectId) params.append('projectId', filters.projectId.toString());
		if (filters.formId) params.append('formId', filters.formId.toString());
		if (filters.startDate) params.append('startDate', filters.startDate);
		if (filters.endDate) params.append('endDate', filters.endDate);

		const query = params.toString() ? `?${params.toString()}` : '';
		return this.request(`/submissions${query}`);
	}

	async getAgentStatistics(userId: number, period: string = '30days') {
		// TEST MODE: Return mock data
		if (isTestMode()) {
			await simulateDelay(250);
			return { data: mockAgentStatistics };
		}

		// Try to fetch statistics, but handle 404 gracefully (endpoint may not exist on server)
		try {
			const result = await this.request<{
				submissions: {
					total: number;
					last7Days: number;
					last30Days: number;
					avgPerDay: number;
					timeline: Array<{ date: string; count: number }>;
					byProject: Record<string, number>;
				};
				activity: {
					totalActiveDays: number;
					averageSubmissionsPerActiveDay: number;
				};
			}>(`/users/${userId}/statistics?period=${period}`);

			// Return undefined data if endpoint doesn't exist (404)
			if (result.error && result.error.includes('404')) {
				return { data: undefined };
			}

			return result;
		} catch (error) {
			// Gracefully handle errors
			return { data: undefined };
		}
	}

	// Admin - Invitations (for agents)
	async createInvitation(data: { email: string; role: string; projectIds?: number[] }) {
		// TEST MODE: Return mock token
		if (isTestMode()) {
			await simulateDelay(400);
			return {
				data: {
					id: Date.now(),
					token: `inv_${Math.random().toString(36).substring(2, 15)}`,
					email: data.email,
					role: data.role,
					status: 'Pending',
					expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
					createdAt: new Date().toISOString()
				}
			};
		}

		return this.request<{
			id: number;
			token: string;
			email: string;
			role: string;
			status: string;
			expiresAt: string;
		}>('/invitations', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	async bulkInviteAgents(data: { emails: string[]; role?: string; projectIds?: number[] }) {
		// TEST MODE: Return mock results
		if (isTestMode()) {
			await simulateDelay(800);
			const results = data.emails.map((email) => ({
				email: email,
				success: Math.random() > 0.1, // 90% success rate
				token: `inv_${Math.random().toString(36).substring(2, 15)}`,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
				error: Math.random() > 0.9 ? 'Email already exists' : undefined
			}));

			return {
				data: {
					totalCount: data.emails.length,
					successCount: results.filter((r) => r.success).length,
					failureCount: results.filter((r) => !r.success).length,
					duplicateCount: 0,
					results
				}
			};
		}

		return this.request<{
			totalCount: number;
			successCount: number;
			failureCount: number;
			duplicateCount: number;
			results: Array<{
				email: string;
				status: string;
				token?: string;
				message?: string;
			}>;
		}>('/invitations/bulk', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	// Admin - Invite user to their own organization
	async inviteUser(email: string) {
		// TEST MODE: Return mock token
		if (isTestMode()) {
			await simulateDelay(400);
			return {
				data: {
					id: Date.now(),
					token: `inv_${Math.random().toString(36).substring(2, 15)}`,
					email: email,
					status: 'Pending',
					expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
					createdAt: new Date().toISOString()
				}
			};
		}

		return this.request<{
			id: number;
			token: string;
			email: string;
			status: string;
			expiresAt: string;
		}>('/users/invite', {
			method: 'POST',
			body: JSON.stringify({ email })
		});
	}

	// Admin - Update agent project assignments
	async updateAgentProjects(agentId: number, projectIds: number[]) {
		// TEST MODE: Simulate success
		if (isTestMode()) {
			await simulateDelay(400);
			// Update mock data
			const agent = mockUsers.find((u) => u.id === agentId);
			if (agent) {
				agent.projectsAssigned = projectIds;
			}
			return { data: { success: true } };
		}

		return this.request(`/users/${agentId}/projects`, {
			method: 'PUT',
			body: JSON.stringify({ projectIds })
		});
	}

	// Agent - Projects
	async getAgentProjects() {
		// TEST MODE: Return mock data
		if (isTestMode()) {
			await simulateDelay(300);
			// Filter only active projects for the agent
			const agentProjects = mockProjects.map((p) => ({
				...p,
				formCount: 2, // Mock form count
				submissionCount: Math.floor(Math.random() * 50) // Mock submission count
			}));
			return { data: agentProjects };
		}

		try {
			// Try network first
			const result = await this.request<
				Array<{
					id: number;
					name: string;
					description?: string;
					startDate: string;
					endDate: string;
					status: string;
					formCount?: number;
					submissionCount?: number;
				}>
			>('/projects');

			if (result.data) {
				// Success! Cache the data (same as getProjects)
				await cacheProjects(result.data);
				return { data: result.data, error: result.error };
			}

			// Network request failed, try cache
			const cached = await getCachedProjects();
			if (cached) {
				console.log('[FieldScope] Using cached agent projects (offline)');
				return { data: cached, error: undefined, fromCache: true };
			}

			return result; // Return original error
		} catch (error) {
			// Network error, try cache
			const cached = await getCachedProjects();
			if (cached) {
				console.log('[FieldScope] Using cached agent projects (offline)');
				return { data: cached, error: undefined, fromCache: true };
			}
			console.warn('[FieldScope] No cached agent projects available');
			return { error: 'No internet connection and no cached data available' };
		}
	}

	// Agent | Admin - Forms for Project
	async getProjectForms(projectId: number) {
		// TEST MODE: Return mock data
		if (isTestMode()) {
			await simulateDelay(250);
			// Filter forms for this project from mockForms
			const projectForms = mockForms.filter((f) => f.projectId === projectId);

			// Convert to API format
			const formattedForms = projectForms.map((form) => ({
				id: form.id,
				organizationId: 1,
				projectId: form.projectId,
				name: form.title,
				schema: JSON.stringify({ fields: form.fields }),
				version: 1,
				status: form.status === 'published' ? FormStatus.Published : FormStatus.Draft,
				createdAt: form.createdAt,
				updatedAt: form.updatedAt
			}));

			return { data: formattedForms };
		}

		try {
			// Try network first
			const result = await this.request<
				Array<{
					id: number;
					organizationId: number;
					projectId: number;
					name: string;
					schema: string;
					status: FormStatus;
					version: number;
					createdAt: string;
					updatedAt: string;
				}>
			>(`/forms/by-project?projectId=${projectId}`);

			if (result.data) {
				// Success! Cache the data
				await cacheForms(result.data, projectId);
				return { data: result.data, error: result.error };
			}

			// Network request failed, try cache
			const cached = await getCachedForms(projectId);
			if (cached) {
				console.log(`[FieldScope] Using cached forms for project ${projectId} (offline)`);
				return { data: cached, error: undefined, fromCache: true };
			}

			return result; // Return original error
		} catch (error) {
			// Network error, try cache
			const cached = await getCachedForms(projectId);
			if (cached) {
				console.log(`[FieldScope] Using cached forms for project ${projectId} (offline)`);
				return { data: cached, error: undefined, fromCache: true };
			}
			console.warn(`[FieldScope] No cached forms available for project ${projectId}`);
			return { error: 'No internet connection and no cached forms available' };
		}
	}

	// Admin - Get single form
	async getForm(formId: number) {
		// TEST MODE: Return mock data
		if (isTestMode()) {
			await simulateDelay(200);
			const form = mockForms.find((f) => f.id === formId);
			if (form) {
				return {
					data: {
						id: form.id,
						projectId: form.projectId,
						name: form.title,
						schema: JSON.stringify({ fields: form.fields }),
						metadata: JSON.stringify({
							icon: '📋',
							primaryColor: '#4A90E2'
						}),
						version: 1,
						isActive: form.status === 'published',
						createdAt: form.createdAt
					}
				};
			}
			return { error: 'Form not found' };
		}

		return this.request<{
			id: number;
			projectId: number;
			name: string;
			schema: string;
			metadata?: string;
			version: number;
			isActive: boolean;
			createdAt: string;
		}>(`/forms/${formId}`);
	}

	// Admin - Create form
	async createForm(data: {
		projectId: number;
		name: string;
		description?: string;
		schema: any;  // Object with fields array
		metadata?: any;  // Object with formType, scoringEnabled, branding, etc.
	}) {
		// TEST MODE: Create mock form
		if (isTestMode()) {
			await simulateDelay(400);
			const newForm = {
				id: Date.now(),
				title: data.name,
				projectId: data.projectId,
				fields: data.schema.fields || [],
				status: 'draft',
				createdAt: new Date().toISOString(),
				description: data.description || '',
				scoringEnabled: data.metadata?.scoringEnabled || false,
				updatedAt: new Date().toISOString()
			};
			mockForms.push(newForm);
			return {
				data: {
					id: newForm.id,
					projectId: newForm.projectId,
					name: newForm.title,
					description: newForm.description,
					schema: data.schema,
					metadata: data.metadata,
					version: 1,
					isActive: false,
					createdAt: newForm.createdAt
				}
			};
		}

		return this.request<{
			id: number;
			projectId: number;
			name: string;
			description?: string;
			schema: any;
			metadata?: any;
			version: number;
			isActive: boolean;
			createdAt: string;
		}>('/forms', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	// Admin - Update form
	async updateForm(
		formId: number,
		data: {
			name: string;
			description?: string;
			schema: any;  // Object with fields array
			metadata?: any;  // Object with formType, scoringEnabled, branding, etc.
		}
	) {
		// TEST MODE: Update mock form
		if (isTestMode()) {
			await simulateDelay(400);
			const form = mockForms.find((f) => f.id === formId);
			if (form) {
				form.title = data.name;
				form.description = data.description || form.description;
				form.fields = data.schema.fields || [];
				form.scoringEnabled = data.metadata?.scoringEnabled ?? form.scoringEnabled;
				return {
					data: {
						id: form.id,
						projectId: form.projectId,
						name: form.title,
						description: form.description,
						schema: data.schema,
						metadata: data.metadata,
						version: 2,
						isActive: form.status === 'published',
						createdAt: form.createdAt
					}
				};
			}
			return { error: 'Form not found' };
		}

		return this.request<{
			id: number;
			projectId: number;
			name: string;
			description?: string;
			schema: any;
			metadata?: any;
			version: number;
			isActive: boolean;
			createdAt: string;
		}>(`/forms/${formId}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		});
	}

	// Admin - Delete form
	async deleteForm(formId: number) {
		// TEST MODE: Delete mock form
		if (isTestMode()) {
			await simulateDelay(300);
			const index = mockForms.findIndex((f) => f.id === formId);
			if (index !== -1) {
				mockForms.splice(index, 1);
				return { data: { success: true } };
			}
			return { error: 'Form not found' };
		}

		return this.request<{ success: boolean }>(`/forms/${formId}`, {
			method: 'DELETE'
		});
	}

	// Admin - Update form status (Publish/Draft/Inactive)
	async updateFormStatus(formId: number, status: FormStatus) {
		if (isTestMode()) {
			await simulateDelay(300);
			const form = mockForms.find((f) => f.id === formId);
			if (form) {
				form.status = status === FormStatus.Published ? 'published' : status === FormStatus.Draft ? 'draft' : 'inactive';
				return { data: { id: formId, status, message: `Form status updated to ${FormStatus[status]}` } };
			}
			return { error: 'Form not found' };
		}

		return this.request<{
			id: number;
			status: FormStatus;
			message: string;
		}>(`/forms/${formId}/status`, {
			method: 'PATCH',
			body: JSON.stringify({ status })
		});
	}

	// Agent - Submit data
	async submitData(data: {
		projectId: number;
		formId: number;
		answers: Record<string, any>;
		localSyncId: string;
	}) {
		// TEST MODE: Simulate success and store in localStorage
		if (isTestMode()) {
			await simulateDelay(400);

			const submission = {
				id: Date.now(),
				userId: 1,
				...data,
				createdAt: new Date().toISOString(),
				syncedAt: new Date().toISOString()
			};

			// Store in localStorage for persistence
			if (typeof window !== 'undefined') {
				const storageKey = `test_submissions_project_${data.projectId}`;
				const existing = localStorage.getItem(storageKey);
				const submissions = existing ? JSON.parse(existing) : [];
				submissions.unshift(submission); // Add to beginning
				localStorage.setItem(storageKey, JSON.stringify(submissions));
			}

			return { data: submission };
		}

		return this.request<{
			id: number;
			projectId: number;
			formId: number;
			answers: Record<string, any>;
			localSyncId: string;
			createdAt: string;
			syncedAt: string;
		}>('/submissions', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	// Agent - Bulk submit (for offline sync)
	async bulkSubmitData(submissions: Array<{
		projectId: number;
		formId: number;
		answers: Record<string, any>;
		localSyncId: string;
	}>) {
		// TEST MODE: Simulate success
		if (isTestMode()) {
			await simulateDelay(800);
			const results = submissions.map((sub) => ({
				localSyncId: sub.localSyncId,
				success: true,
				submissionId: Date.now() + Math.floor(Math.random() * 1000)
			}));

			return {
				data: {
					successful: results.filter((r) => r.success).length,
					failed: 0,
					results
				}
			};
		}

		return this.request<{
			successful: number;
			failed: number;
			results: Array<{
				localSyncId: string;
				success: boolean;
				submissionId?: number;
				error?: string;
			}>;
		}>('/submissions/bulk', {
			method: 'POST',
			body: JSON.stringify({ submissions })
		});
	}

	// Agent | Admin - Update submission
	async updateSubmission(submissionId: number, data: { answers?: Record<string, any>; respondentId?: number }) {
		// TEST MODE: Simulate success
		if (isTestMode()) {
			await simulateDelay(400);
			return { data: { success: true, message: 'Submission updated successfully' } };
		}

		return this.request<{
			success: boolean;
			message: string;
		}>(`/submissions/${submissionId}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		});
	}

	// Agent - Get project submissions
	async getProjectSubmissions(projectId: number) {
		// TEST MODE: Return data from localStorage
		if (isTestMode()) {
			await simulateDelay(300);

			// Read from localStorage
			if (typeof window !== 'undefined') {
				const storageKey = `test_submissions_project_${projectId}`;
				const existing = localStorage.getItem(storageKey);

				// If no data exists, seed with mock data for this project
				if (!existing) {
					const projectSubmissions = mockSubmissions.filter((s) => s.projectId === projectId);
					if (projectSubmissions.length > 0) {
						localStorage.setItem(storageKey, JSON.stringify(projectSubmissions));
						return { data: projectSubmissions };
					}
				}

				const submissions = existing ? JSON.parse(existing) : [];
				return { data: submissions };
			}

			return { data: [] };
		}

		return this.request<
			Array<{
				id: number;
				projectId: number;
				formId: number;
				formName?: string;
				answers: Record<string, any>;
				localSyncId: string;
				createdAt: string;
				syncedAt?: string;
			}>
		>(`/submissions/project/${projectId}`);
	}

	// Views CRUD
	async getProjectViews(projectId: number) {
		if (isTestMode()) {
			await simulateDelay(250);
			return { data: mockViews.filter((v) => v.projectId === projectId) };
		}
		return this.request<
			Array<{
				id: number;
				projectId: number;
				name: string;
				description?: string;
				definition: string;
				metadata?: string;
				createdAt: string;
				updatedAt: string;
			}>
		>(`/views/project/${projectId}`);
	}

	async createView(data: {
		projectId: number;
		name: string;
		description?: string;
		definition: string;
		metadata?: string;
	}) {
		if (isTestMode()) {
			await simulateDelay(400);
			const newView = {
				id: Date.now(),
				...data,
				description: data.description || '',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			mockViews.push(newView);
			return { data: newView };
		}
		return this.request<{
			id: number;
			projectId: number;
			name: string;
			description?: string;
			definition: string;
			metadata?: string;
			createdAt: string;
			updatedAt: string;
		}>('/views', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	async updateView(
		viewId: number,
		data: {
			name: string;
			description?: string;
			definition: string;
			metadata?: string;
		}
	) {
		if (isTestMode()) {
			await simulateDelay(400);
			const view = mockViews.find((v) => v.id === viewId);
			if (view) {
				Object.assign(view, { ...data, updatedAt: new Date().toISOString() });
				return { data: view };
			}
			return { error: 'View not found' };
		}
		return this.request<{
			id: number;
			projectId: number;
			name: string;
			description?: string;
			definition: string;
			metadata?: string;
			createdAt: string;
			updatedAt: string;
		}>(`/views/${viewId}`, {
			method: 'PUT',
			body: JSON.stringify(data)
		});
	}

	async deleteView(viewId: number) {
		if (isTestMode()) {
			await simulateDelay(300);
			const index = mockViews.findIndex((v) => v.id === viewId);
			if (index !== -1) {
				mockViews.splice(index, 1);
				return { data: { success: true } };
			}
			return { error: 'View not found' };
		}
		return this.request<{ success: boolean }>(`/views/${viewId}`, { method: 'DELETE' });
	}

	// Admin - Update view status (Publish/Draft)
	async updateViewStatus(viewId: number, status: ContentStatus) {
		if (isTestMode()) {
			await simulateDelay(300);
			const view = mockViews.find((v) => v.id === viewId);
			if (view) {
				// mockViews don't have status, so we just simulate success
				return { data: { id: viewId, status, message: `View status updated to ${ContentStatus[status]}` } };
			}
			return { error: 'View not found' };
		}

		return this.request<{
			id: number;
			status: ContentStatus;
			message: string;
		}>(`/views/${viewId}/status`, {
			method: 'PATCH',
			body: JSON.stringify({ status })
		});
	}

	// Dashboards CRUD
	async getProjectDashboards(projectId: number) {
		if (isTestMode()) {
			await simulateDelay(250);
			return { data: mockDashboards.filter((d) => d.projectId === projectId) };
		}
		return this.request<
			Array<{
				id: number;
				projectId: number;
				name: string;
				description?: string;
				definition: string;
				metadata?: string;
				createdAt: string;
				updatedAt: string;
			}>
		>(`/dashboards/project/${projectId}`);
	}

	async createDashboard(data: {
		projectId: number;
		name: string;
		description?: string;
		definition: string;
		metadata?: string;
	}) {
		if (isTestMode()) {
			await simulateDelay(400);
			const newDashboard = {
				id: Date.now(),
				...data,
				description: data.description || '',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			mockDashboards.push(newDashboard);
			return { data: newDashboard };
		}
		return this.request<{
			id: number;
			projectId: number;
			name: string;
			description?: string;
			definition: string;
			metadata?: string;
			createdAt: string;
			updatedAt: string;
		}>('/dashboards', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	async updateDashboard(
		dashboardId: number,
		data: {
			name: string;
			description?: string;
			definition: string;
			metadata?: string;
		}
	) {
		if (isTestMode()) {
			await simulateDelay(400);
			const dashboard = mockDashboards.find((d) => d.id === dashboardId);
			if (dashboard) {
				Object.assign(dashboard, { ...data, updatedAt: new Date().toISOString() });
				return { data: dashboard };
			}
			return { error: 'Dashboard not found' };
		}
		return this.request<{
			id: number;
			projectId: number;
			name: string;
			description?: string;
			definition: string;
			metadata?: string;
			createdAt: string;
			updatedAt: string;
		}>(`/dashboards/${dashboardId}`, {
			method: 'PUT',
			body: JSON.stringify(data)
		});
	}

	async deleteDashboard(dashboardId: number) {
		if (isTestMode()) {
			await simulateDelay(300);
			const index = mockDashboards.findIndex((d) => d.id === dashboardId);
			if (index !== -1) {
				mockDashboards.splice(index, 1);
				return { data: { success: true } };
			}
			return { error: 'Dashboard not found' };
		}
		return this.request<{ success: boolean }>(`/dashboards/${dashboardId}`, { method: 'DELETE' });
	}

	// Admin - Update dashboard status (Publish/Draft)
	async updateDashboardStatus(dashboardId: number, status: ContentStatus) {
		if (isTestMode()) {
			await simulateDelay(300);
			const dashboard = mockDashboards.find((d) => d.id === dashboardId);
			if (dashboard) {
				// mockDashboards don't have status, so we just simulate success
				return { data: { id: dashboardId, status, message: `Dashboard status updated to ${ContentStatus[status]}` } };
			}
			return { error: 'Dashboard not found' };
		}

		return this.request<{
			id: number;
			status: ContentStatus;
			message: string;
		}>(`/dashboards/${dashboardId}/status`, {
			method: 'PATCH',
			body: JSON.stringify({ status })
		});
	}

	// ============================================================================
	// SCORE ANALYTICS
	// ============================================================================

	/**
	 * Get aggregated score analytics with multi-level filtering
	 */
	async getScoreAnalytics(projectId: number, filters: {
		formId?: number;
		clusterField?: string;
		clusterValue?: string;
		vendorField?: string;
		vendorValue?: string;
		agentId?: number;
		startDate?: string;
		endDate?: string;
		groupBy?: string;
	} = {}) {
		const params = new URLSearchParams({
			projectId: projectId.toString(),
			...(filters.formId && { formId: filters.formId.toString() }),
			...(filters.clusterField && { clusterField: filters.clusterField }),
			...(filters.clusterValue && { clusterValue: filters.clusterValue }),
			...(filters.vendorField && { vendorField: filters.vendorField }),
			...(filters.vendorValue && { vendorValue: filters.vendorValue }),
			...(filters.agentId && { agentId: filters.agentId.toString() }),
			...(filters.startDate && { startDate: filters.startDate }),
			...(filters.endDate && { endDate: filters.endDate }),
			...(filters.groupBy && { groupBy: filters.groupBy })
		});

		return this.request<{
			overallAverage: number | null;
			pillarAverages: Record<string, number>;
			submissionCount: number;
			distribution: {
				critical: number;
				atRisk: number;
				healthy: number;
			};
			groupedData?: Array<{
				groupName: string;
				groupValue: string;
				averageScore: number;
				count: number;
				pillarAverages?: Record<string, number>;
			}>;
		}>(`/analytics/scores?${params.toString()}`);
	}

	/**
	 * Get score trends over time
	 */
	async getScoreTrends(projectId: number, formId?: number, groupBy: string = 'month') {
		const params = new URLSearchParams({
			projectId: projectId.toString(),
			groupBy,
			...(formId && { formId: formId.toString() })
		});

		return this.request<{
			trends: Array<{
				period: string;
				averageScore: number;
				count: number;
			}>;
			groupBy: string;
		}>(`/analytics/trends?${params.toString()}`);
	}
}

export const api = new ApiClient();
