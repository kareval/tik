import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const API_BASE = "/api/factorial"; // Proxied locally to https://api.factorialhr.com/api/v1
// Note: Proxies might be needed for CORS in browser.
// Ideally usage of Firebase Functions.

interface TokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
}

export class FactorialService {
    private static async getConfig() {
        // SECURITY ALERT: Credentials must strictly come from Firestore/Backend, never hardcoded.
        const docRef = doc(db, 'settings', 'factorial');
        const snapshot = await getDoc(docRef);
        return snapshot.exists() ? snapshot.data() : null;
    }

    // No longer used, but kept for reference
    static async exchangeCodeForToken(code: string, redirectUri: string) {
        // ... previous OAuth logic ...
        return null;
    }

    static async getEmployees() {
        const config = await this.getConfig();
        const token = config?.apiKey || config?.accessToken;

        if (!token) throw new Error("Not authenticated (No API Key configured in Settings)");

        // Updated endpoint per user request (2025-01-01 version)
        const response = await fetch(`${API_BASE}/api/2025-01-01/resources/employees/employees`, {
            headers: {
                'accept': 'application/json',
                'x-api-key': token
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Factorial API Error (${response.status}):`, errorText);
            throw new Error(`Failed to fetch employees: ${response.status} - ${errorText}`);
        }

        const jsonData = await response.json();
        // Handle both array (v1 style sometimes) or object with data property (v2 style)
        if (Array.isArray(jsonData)) {
            return jsonData;
        } else if (jsonData && Array.isArray(jsonData.data)) {
            return jsonData.data;
        } else {
            console.warn("Unexpected Factorial API response structure:", jsonData);
            return []; // Return empty array to prevent crash
        }
    }

    static async getTimeEntries() {
        const config = await this.getConfig();
        const token = config?.apiKey || config?.accessToken;

        if (!token) throw new Error("Not authenticated (No API Key configured in Settings)");

        // Structure: /api/2025-01-01/resources/attendance/shifts
        const response = await fetch(`${API_BASE}/api/2025-01-01/resources/attendance/shifts`, {
            headers: {
                'accept': 'application/json',
                'x-api-key': token
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Factorial API Error (${response.status}):`, errorText);
            // Fallback or try another endpoint if shifts not available?
            // For now throw
            throw new Error(`Failed to fetch time entries: ${response.status} - ${errorText}`);
        }

        const jsonData = await response.json();
        // Handle both array or object with data property
        if (Array.isArray(jsonData)) {
            return jsonData;
        } else if (jsonData && Array.isArray(jsonData.data)) {
            return jsonData.data;
        } else {
            console.warn("Unexpected Factorial API response structure (Time):", jsonData);
            return [];
        }
    }


    static async getProjects() {
        const config = await this.getConfig();
        const token = config?.apiKey || config?.accessToken;

        if (!token) throw new Error("Not authenticated (No API Key configured in Settings)");

        // Updated to V2 Project Management endpoint per user documentation
        const response = await fetch(`${API_BASE}/api/2025-01-01/resources/project_management/projects`, {
            headers: {
                'accept': 'application/json',
                'x-api-key': token
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Factorial API Error (${response.status}):`, errorText);
            throw new Error(`Failed to fetch projects: ${response.status} - ${errorText}`);
        }

        const jsonData = await response.json();
        // Handle both array or object with data property
        if (Array.isArray(jsonData)) {
            return jsonData;
        } else if (jsonData && Array.isArray(jsonData.data)) {
            return jsonData.data;
        } else {
            console.warn("Unexpected Factorial API response structure (Projects):", jsonData);
            return [];
        }
    }
}
