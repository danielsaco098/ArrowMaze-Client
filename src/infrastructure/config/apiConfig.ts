/**
 * Backend API configuration. The base URL can be overridden via the
 * `EXPO_PUBLIC_API_URL` environment variable; it defaults to localhost for
 * local development.
 */
export interface ApiConfig {
  baseUrl: string;
}

export const apiConfig: ApiConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
};
