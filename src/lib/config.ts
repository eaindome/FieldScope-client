/**
 * Application Configuration
 */

// Set to 'test' for mock data, 'dev' for real API
export type AppMode = 'dev' | 'test';
export const APP_MODE: AppMode = 'dev';

// Use proxy in development to avoid CORS issues
export const API_BASE_URL = import.meta.env.DEV ? '/api' : 'http://localhost:5083';

export const isTestMode = () => APP_MODE === 'test';
export const isDevMode = () => APP_MODE === 'dev';
