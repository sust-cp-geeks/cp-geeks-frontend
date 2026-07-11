// Central API base URL — reads from Vite environment variables.
// In development: .env.development  →  http://localhost:8080
// In production:  .env.production   →  your deployed backend URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
