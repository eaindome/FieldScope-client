import { goto } from '$app/navigation';

export type UserRole = 'SuperAdmin' | 'Admin' | 'Agent';

export interface User {
	id: number;
	email: string;
	role: UserRole;
	organizationId?: number;
}

/**
 * Get the currently logged-in user from localStorage
 */
export function getCurrentUser(): User | null {
	if (typeof window === 'undefined') return null;

	const userStr = localStorage.getItem('user');
	if (!userStr) return null;

	try {
		return JSON.parse(userStr) as User;
	} catch {
		return null;
	}
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
	if (typeof window === 'undefined') return false;
	return !!localStorage.getItem('accessToken');
}

/**
 * Get the default route for a user based on their role
 */
export function getDefaultRouteForRole(role: UserRole): string {
	switch (role) {
		case 'SuperAdmin':
			return '/dashboard';
		case 'Admin':
			return '/admin/dashboard';
		case 'Agent':
			return '/agent/projects';
		default:
			return '/login';
	}
}

/**
 * Redirect to login if not authenticated
 */
export function requireAuth() {
	if (!isAuthenticated()) {
		goto('/login');
		return false;
	}
	return true;
}

/**
 * Redirect to appropriate dashboard if already authenticated
 */
export function redirectIfAuthenticated() {
	if (isAuthenticated()) {
		const user = getCurrentUser();
		if (user) {
			goto(getDefaultRouteForRole(user.role));
			return true;
		}
	}
	return false;
}

/**
 * Check if user has required role
 */
export function hasRole(requiredRole: UserRole): boolean {
	const user = getCurrentUser();
	return user?.role === requiredRole;
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(requiredRoles: UserRole[]): boolean {
	const user = getCurrentUser();
	if (!user) return false;
	return requiredRoles.includes(user.role);
}

/**
 * Logout and redirect to login page
 */
export function logout() {
	if (typeof window !== 'undefined') {
		localStorage.removeItem('accessToken');
		localStorage.removeItem('refreshToken');
		localStorage.removeItem('user');
		goto('/login');
	}
}
