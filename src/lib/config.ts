/**
 * Application Configuration
 */

// Set to 'test' for mock data, 'dev' for real API
export type AppMode = 'dev' | 'test';
// Read mode from Vite env when provided, otherwise default to 'dev'
export const APP_MODE: AppMode = (import.meta.env.VITE_APP_MODE as AppMode) ?? 'dev';

// Default backend URL when no VITE_API_BASE_URL is provided
const DEFAULT_BACKEND_URL = 'https://fieldscope-1.onrender.com';

// In dev we use the local dev proxy `/api` (configured in vite.config.ts).
// In non-dev builds prefer an explicit VITE_API_BASE_URL, falling back to the default backend.
export const API_BASE_URL: string = import.meta.env.DEV
	? '/api'
	: ((import.meta.env.VITE_API_BASE_URL as string) ?? DEFAULT_BACKEND_URL);

export const PROD_API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL as string) ?? DEFAULT_BACKEND_URL;

export const isTestMode = () => APP_MODE === 'test';
export const isDevMode = () => APP_MODE === 'dev';
