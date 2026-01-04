// API configuration for Vercel deployment
// In development: uses relative /api paths (proxied by Vite)
// In production: uses VITE_API_URL or relative paths

const getApiBase = () => {
  // For production Vercel deployment, use relative paths or configured URL
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Default to relative paths (works with Vercel)
  return '/api';
};

const API_BASE = getApiBase();

export interface PageStats {
  comments: number;
  replies: number;
  pending: number;
  engagement: string;
}

export interface FacebookPage {
  _id?: string;
  id?: string;
  name: string;
  pageId: string;
  accessToken: string;
  status: 'active' | 'paused';
  autoReply: boolean;
  createdAt?: string;
  activatedAt?: string;
  stats?: PageStats;
}

export interface Comment {
  _id: string;
  commentId: string;
  postId: string;
  pageId: string;
  fromId: string;
  fromName: string;
  message: string;
  createdTime: string;
  receivedAt: string;
  status: 'pending' | 'replied' | 'skipped' | 'failed';
  replyType?: 'emoji' | 'ai';
  replyMessage?: string;
  replyCommentId?: string;
  repliedAt?: string;
  skipReason?: string;
}

export interface GlobalStats {
  totalComments: number;
  totalReplies: number;
  emojiReplies: number;
  aiReplies: number;
  pending: number;
  skipped: number;
  failed: number;
  totalPages: number;
  activePages: number;
  replyRate: number;
}

export interface Settings {
  maxRepliesPerRun: number;
  minDelay: number;
  maxDelay: number;
  shortCommentThresholdWords: number;
  shortCommentThresholdChars: number;
  globalPause: boolean;
  shadowMode: boolean;
  autoPauseOnErrors: boolean;
  errorThreshold: number;
  aiTone: string;
}

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

// Pages API
export const pagesApi = {
  getAll: () => apiRequest<FacebookPage[]>('pages'),
  
  create: (page: Omit<FacebookPage, '_id' | 'id' | 'createdAt' | 'activatedAt'>) => 
    apiRequest<FacebookPage>('pages', {
      method: 'POST',
      body: JSON.stringify(page),
    }),
  
  update: (id: string, data: Partial<FacebookPage>) =>
    apiRequest<{ success: boolean }>('pages', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    }),
  
  delete: (id: string) =>
    apiRequest<{ success: boolean }>(`pages?id=${id}`, {
      method: 'DELETE',
    }),
};

// Stats API
export const statsApi = {
  getGlobal: () => apiRequest<GlobalStats>('stats'),
  getByPage: (pageId: string) => apiRequest<GlobalStats>(`stats?pageId=${pageId}`),
};

// Activity API
export const activityApi = {
  getRecent: (limit = 50, status?: string, pageId?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (status) params.append('status', status);
    if (pageId) params.append('pageId', pageId);
    return apiRequest<Comment[]>(`activity?${params}`);
  },
};

// Settings API
export const settingsApi = {
  get: () => apiRequest<Settings>('settings'),
  
  update: (settings: Partial<Settings>) =>
    apiRequest<{ success: boolean }>('settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    }),
};

// Runs API
export const runsApi = {
  getRecent: (limit = 10) => apiRequest<unknown[]>(`runs?limit=${limit}`),
};

// Chart data API
export const chartApi = {
  getData: (days = 7) => apiRequest<unknown[]>(`chart-data?days=${days}`),
};

// Process replies (manual trigger)
export const triggerProcessReplies = async (shadowMode = false) => {
  const response = await fetch(`${API_BASE}/process-replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ manual: true, shadowMode }),
  });
  
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text || 'Request failed');
  }
};

// Manual process replies with targeting options
export const manualProcessReplies = async (opts: { pageId?: string; postId?: string; limit?: number; shadowMode?: boolean; contentType?: string; accessToken?: string } = {}) => {
  const response = await fetch(`${API_BASE}/process-replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      manual: true,
      pageId: opts.pageId,
      postId: opts.postId,
      limit: opts.limit || 100,
      shadowMode: opts.shadowMode || false,
      contentType: opts.contentType || 'post',
      accessToken: opts.accessToken,
    }),
  });
  
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text || 'Request failed');
  }
};
