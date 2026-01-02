import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pagesApi, statsApi, activityApi, settingsApi, runsApi, chartApi, triggerProcessReplies, manualProcessReplies } from '@/lib/api';
import type { FacebookPage, Settings } from '@/lib/api';

// Stats hooks
export function useGlobalStats() {
  return useQuery({
    queryKey: ['stats', 'global'],
    queryFn: statsApi.getGlobal,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Pages hooks
export function usePages() {
  return useQuery({
    queryKey: ['pages'],
    queryFn: pagesApi.getAll,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pagesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<FacebookPage>) => 
      pagesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    },
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pagesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

// Activity hooks
export function useActivity(limit = 50, status?: string, pageId?: string) {
  return useQuery({
    queryKey: ['activity', limit, status, pageId],
    queryFn: () => activityApi.getRecent(limit, status, pageId),
    refetchInterval: 30000,
  });
}

// Settings hooks
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

// Runs hooks
export function useRecentRuns(limit = 10) {
  return useQuery({
    queryKey: ['runs', limit],
    queryFn: () => runsApi.getRecent(limit),
  });
}

// Chart hooks
export function useChartData(days = 7) {
  return useQuery({
    queryKey: ['chart', days],
    queryFn: () => chartApi.getData(days),
  });
}

// Manual trigger hook
export function useTriggerReplies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shadowMode: boolean) => triggerProcessReplies(shadowMode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['runs'] });
    },
  });
}

// Manual process replies hook (scan or single post)
export function useManualProcessReplies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (opts: { pageId?: string; postId?: string; limit?: number; shadowMode?: boolean }) =>
      manualProcessReplies(opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['runs'] });
    },
  });
}
