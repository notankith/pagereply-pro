const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`;

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
  const response = await fetch(`${API_BASE}?action=${endpoint}`, {
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
    apiRequest<{ success: boolean }>(`pages&id=${id}`, {
      method: 'DELETE',
    }),
};

// Stats API
export const statsApi = {
  getGlobal: () => apiRequest<GlobalStats>('stats'),
  getByPage: (pageId: string) => apiRequest<GlobalStats>(`stats&pageId=${pageId}`),
};

// Activity API
export const activityApi = {
  getRecent: (limit = 50, status?: string, pageId?: string) => {
    let endpoint = `activity&limit=${limit}`;
    if (status) endpoint += `&status=${status}`;
    if (pageId) endpoint += `&pageId=${pageId}`;
    return apiRequest<Comment[]>(endpoint);
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
  getRecent: (limit = 10) => apiRequest<any[]>(`runs&limit=${limit}`),
};

// Chart data API
export const chartApi = {
  getData: (days = 7) => apiRequest<any[]>(`chart-data&days=${days}`),
};

// Process replies (manual trigger)
export const triggerProcessReplies = async (shadowMode = false) => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-replies`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manual: true, shadowMode }),
    }
  );
  return response.json();
};
