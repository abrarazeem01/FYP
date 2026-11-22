import {
  DashboardStats,
  ScrapedPost,
  InvestigationCase,
  ScraperStatus,
  ForensicAnalysisResponse,
  UserProfile,
} from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getStoredAuth = (): { token: string; role: string } => {
  let role = 'super_admin';
  try {
    const rawUser = localStorage.getItem('nexus_user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed?.role) {
        role = parsed.role;
      }
    }
  } catch {
    // fallback role
  }

  // 1. Check for Supabase session access_token in localStorage
  let supabaseToken: string | null = null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('sb-') || key.includes('supabase.auth.token')) &&
        key.endsWith('-auth-token')
      ) {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed?.access_token) {
            supabaseToken = parsed.access_token;
            break;
          }
        }
      }
    }
  } catch {
    // fallback
  }

  let token = supabaseToken || localStorage.getItem('nexus_token');
  if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
    token = `demo-token-${role}`;
  }

  return { token, role };
};

export const getAuthHeaders = (): Record<string, string> => {
  const { token, role } = getStoredAuth();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Demo-Role': role,
  };
};

export async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err: any) {
    if (
      err instanceof TypeError ||
      String(err).includes('Failed to fetch') ||
      String(err).includes('NetworkError') ||
      String(err?.message).includes('Failed to fetch')
    ) {
      throw new Error('Backend offline — run: python -m uvicorn main:app --port 8000');
    }
    throw err;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Authentication
  login: async (payload: { email: string; password: string }) => {
    const res = await safeFetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<{
      status: string;
      token: string;
      user: UserProfile;
    }>(res);
  },

  register: async (payload: {
    full_name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    hierarchy_level?: number;
  }) => {
    const res = await safeFetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<{
      status: string;
      token: string;
      user: UserProfile;
      message: string;
    }>(res);
  },

  // Health & Diagnostics
  checkHealth: async (): Promise<{ status: string; models_loaded: boolean }> => {
    try {
      const res = await safeFetch(`${API_BASE_URL}/api/health`);
      return await handleResponse<{ status: string; models_loaded: boolean }>(res);
    } catch {
      return { status: 'offline', models_loaded: false };
    }
  },

  // Auth & Security
  validateSignup: async (payload: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
  }) => {
    const res = await safeFetch(`${API_BASE_URL}/api/auth/validate-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ is_valid: boolean; errors: Record<string, string> }>(res);
  },

  setup2FA: async (email: string) => {
    const res = await safeFetch(`${API_BASE_URL}/api/auth/2fa/setup`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email }),
    });
    return handleResponse<{
      secret: string;
      provisioning_uri: string;
      qr_code_base64: string;
    }>(res);
  },

  verify2FA: async (secret: string, code: string, userId?: string) => {
    const res = await safeFetch(`${API_BASE_URL}/api/auth/2fa/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ secret, code, user_id: userId }),
    });
    return handleResponse<{ status: string; message: string }>(res);
  },

  // Dashboard Telemetry & Unified Hydration
  getDashboardData: async () => {
    const res = await safeFetch(`${API_BASE_URL}/api/dashboard`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{
      status: string;
      stats: DashboardStats;
      listings: ScrapedPost[];
      recent_posts: ScrapedPost[];
      alerts: any[];
      analyst: string;
      role_level: number;
    }>(res);
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await safeFetch(`${API_BASE_URL}/api/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<DashboardStats>(res);
  },

  // Posts Feed & Forensics
  getPosts: async (params?: {
    status?: string;
    min_risk?: number;
    limit?: number;
  }): Promise<ScrapedPost[]> => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.min_risk !== undefined) query.append('min_risk', String(params.min_risk));
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await safeFetch(`${API_BASE_URL}/api/posts?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ScrapedPost[]>(res);
  },

  analyzeListing: async (payload: {
    raw_text: string;
    group_name?: string;
    sender_phone?: string;
    manual_price?: number;
    image_url?: string;
    seller_name?: string;
  }): Promise<ForensicAnalysisResponse> => {
    const res = await safeFetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<ForensicAnalysisResponse>(res);
  },

  analyzePost: async (payload: {
    raw_text: string;
    group_name?: string;
    sender_phone?: string;
    manual_price?: number;
    image_url?: string;
    seller_name?: string;
  }): Promise<ForensicAnalysisResponse> => {
    const res = await safeFetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<ForensicAnalysisResponse>(res);
  },

  // Real Playwright URL Ingestion (Part 1, Req 2)
  executeScraper: async (url: string, limit: number = 15) => {
    const res = await safeFetch(`${API_BASE_URL}/api/scraper/execute`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ url, limit }),
    });
    return handleResponse<{
      status: string;
      count: number;
      total_scraped?: number;
      flagged_count?: number;
      critical_count?: number;
      resolved_url?: string;
      message: string;
      logs?: string[];
      listings?: ScrapedPost[];
    }>(res);
  },

  // Database Purge / Reset (Part 1, Req 1)
  resetDatabase: async () => {
    const res = await safeFetch(`${API_BASE_URL}/api/listings/reset`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ status: string; count: number; message: string }>(res);
  },

  // Verified ML & NLP Model Metrics (Part 2, Req 4)
  getModelMetrics: async () => {
    const res = await safeFetch(`${API_BASE_URL}/api/models/metrics`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  retrainModels: async () => {
    const res = await safeFetch(`${API_BASE_URL}/api/models/retrain`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  // Syndicate Entity Graph (Part 4, Req 8)
  getSyndicateGraph: async () => {
    const res = await safeFetch(`${API_BASE_URL}/api/graph/entities`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{
      nodes: any[];
      links: any[];
      total_nodes: number;
      total_links: number;
      status: string;
    }>(res);
  },

  // Manual Scan Listing Modal
  scanListing: async (payload: {
    raw_text: string;
    image_url?: string;
    seller_name?: string;
    manual_price?: number;
  }) => {
    const res = await safeFetch(`${API_BASE_URL}/api/listings/scan`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  // On-Demand Facebook Scraper (Phase 3)
  startLoginSession: async (timeoutSeconds: number = 60) => {
    const res = await safeFetch(`${API_BASE_URL}/api/scraper/login-session`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ timeout_seconds: timeoutSeconds }),
    });
    return handleResponse<{ status: string; message: string; session_dir: string }>(res);
  },

  startScrapeUrl: async (groupUrl: string, maxPosts: number = 15) => {
    const headers = getAuthHeaders();
    try {
      const res = await safeFetch(`${API_BASE_URL}/api/scraper/scrape-url`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ group_url: groupUrl, max_posts: maxPosts }),
      });
      return await handleResponse<{
        status: string;
        job_id: string;
        resolved_url?: string;
        group_url?: string;
        logs?: string[];
        listings?: ScrapedPost[];
        alerts?: any[];
        total_scraped?: number;
        flagged_count?: number;
        critical_count?: number;
        message?: string;
      }>(res);
    } catch (err: any) {
      if (err.message && (err.message.includes('404') || err.message.includes('Method Not Allowed'))) {
        const fallbackRes = await safeFetch(`${API_BASE_URL}/api/scrape`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ group_url: groupUrl, max_posts: maxPosts }),
        });
        return await handleResponse<any>(fallbackRes);
      }
      throw err;
    }
  },

  stopScraper: async () => {
    const res = await safeFetch(`${API_BASE_URL}/api/scraper/stop`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ status: string; message: string }>(res);
  },

  getScraperStatus: async (): Promise<ScraperStatus> => {
    const res = await safeFetch(`${API_BASE_URL}/api/scraper/status`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ScraperStatus>(res);
  },

  // Investigation Cases Management
  getCases: async (): Promise<InvestigationCase[]> => {
    const res = await safeFetch(`${API_BASE_URL}/api/cases`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<InvestigationCase[]>(res);
  },

  createCase: async (payload: {
    post_id: string;
    assigned_to?: string;
    priority: string;
    field_notes?: string;
  }): Promise<InvestigationCase> => {
    const res = await safeFetch(`${API_BASE_URL}/api/cases`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<InvestigationCase>(res);
  },

  updateCase: async (
    caseId: string,
    payload: {
      assigned_to?: string;
      priority?: string;
      field_notes?: string;
      verdict?: string;
    }
  ): Promise<InvestigationCase> => {
    const res = await safeFetch(`${API_BASE_URL}/api/cases/${caseId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<InvestigationCase>(res);
  },

  // Super Admin Governance (Miss Hiba - Level 1)
  getAdminUsers: async (): Promise<UserProfile[]> => {
    const res = await safeFetch(`${API_BASE_URL}/api/admin/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<UserProfile[]>(res);
  },

  updateUserRole: async (
    userId: string,
    role: string,
    hierarchyLevel: number
  ): Promise<{ message: string; user: any }> => {
    const res = await safeFetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role, hierarchy_level: hierarchyLevel }),
    });
    return handleResponse<{ message: string; user: any }>(res);
  },

  getAuditLogs: async (limit: number = 50): Promise<any[]> => {
    const query = new URLSearchParams({ limit: String(limit) });
    const res = await safeFetch(`${API_BASE_URL}/api/admin/audit-logs?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any[]>(res);
  },
};
