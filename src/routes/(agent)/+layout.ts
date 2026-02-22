import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = () => {
	// Check authentication on client side
	if (typeof window !== 'undefined') {
		const token = localStorage.getItem('accessToken');
		const userStr = localStorage.getItem('user');

		if (!token) {
			throw redirect(307, '/login');
		}

		if (userStr) {
			try {
				const user = JSON.parse(userStr);
				// Only Agent can access this section
				if (user.role !== 'Agent') {
					throw redirect(307, '/login');
				}
			} catch {
				throw redirect(307, '/login');
			}
		} else {
			throw redirect(307, '/login');
		}
	}
};
