import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Clock,
  Smile,
  Bot,
  MessageSquare
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ActivityLog {
  id: string;
  type: 'emoji' | 'ai';
  page: string;
  postTitle: string;
  comment: string;
  reply: string;
  status: 'success' | 'failed' | 'skipped' | 'pending';
  skipReason?: string;
  timestamp: string;
  commentId: string;
}

const activityLogs: ActivityLog[] = [
  {
    id: '1',
    type: 'ai',
    page: 'Tech News Daily',
    postTitle: 'New Product Launch',
    comment: 'This looks amazing! When will it be available in Europe?',
    reply: 'Thank you for your interest! We\'re planning to launch in Europe by Q2 2024. Stay tuned for updates!',
    status: 'success',
    timestamp: '2024-01-15 14:32:45',
    commentId: '12345678'
  },
  {
    id: '2',
    type: 'emoji',
    page: 'Fitness Hub',
    postTitle: 'Morning Workout Routine',
    comment: '💪🔥',
    reply: '🙌',
    status: 'success',
    timestamp: '2024-01-15 14:30:12',
    commentId: '12345679'
  },
  {
    id: '3',
    type: 'ai',
    page: 'Food & Recipes',
    postTitle: 'Quick Pasta Recipe',
    comment: 'Can I substitute the cream with coconut milk?',
    reply: 'Absolutely! Coconut milk works great as a dairy-free alternative. It adds a subtle sweetness too!',
    status: 'success',
    timestamp: '2024-01-15 14:28:33',
    commentId: '12345680'
  },
  {
    id: '4',
    type: 'ai',
    page: 'Tech News Daily',
    postTitle: 'New Product Launch',
    comment: '',
    reply: '',
    status: 'skipped',
    skipReason: 'Self-reply (same Page ID)',
    timestamp: '2024-01-15 14:25:01',
    commentId: '12345681'
  },
  {
    id: '5',
    type: 'ai',
    page: 'Travel Adventures',
    postTitle: 'Hidden Gems in Bali',
    comment: 'What\'s the best time to visit?',
    reply: '',
    status: 'failed',
    skipReason: 'API rate limit exceeded',
    timestamp: '2024-01-15 14:22:18',
    commentId: '12345682'
  },
  {
    id: '6',
    type: 'emoji',
    page: 'Fitness Hub',
    postTitle: '30-Day Challenge',
    comment: 'Nice',
    reply: '❤️',
    status: 'pending',
    timestamp: '2024-01-15 14:20:00',
    commentId: '12345683'
  },
  {
    id: '7',
    type: 'ai',
    page: 'Tech News Daily',
    postTitle: 'AI Updates',
    comment: 'Will this work with the new API version?',
    reply: 'Yes! Full backwards compatibility is maintained. Check our docs for migration guide.',
    status: 'success',
    timestamp: '2024-01-15 14:18:45',
    commentId: '12345684'
  },
  {
    id: '8',
    type: 'ai',
    page: 'Food & Recipes',
    postTitle: 'Healthy Breakfast Ideas',
    comment: '',
    reply: '',
    status: 'skipped',
    skipReason: 'Comment too old (before activation)',
    timestamp: '2024-01-15 14:15:22',
    commentId: '12345685'
  },
];

const statusColors = {
  success: 'success',
  failed: 'destructive',
  skipped: 'warning',
  pending: 'muted'
} as const;

const statusIcons = {
  success: CheckCircle,
  failed: XCircle,
  skipped: Clock,
  pending: Clock
};

export default function Activity() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = log.page.toLowerCase().includes(search.toLowerCase()) ||
                         log.comment.toLowerCase().includes(search.toLowerCase()) ||
                         log.postTitle.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Activity Log</h1>
          <p className="text-muted-foreground">Track every reply with timestamps and status.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search pages, posts, or comments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="emoji">Emoji</SelectItem>
              <SelectItem value="ai">AI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activity List */}
        <div className="space-y-3">
          {filteredLogs.map((log, index) => {
            const StatusIcon = statusIcons[log.status];
            return (
              <div 
                key={log.id}
                className="glass rounded-xl p-4 animate-slide-up hover:bg-card/90 transition-colors"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    log.type === 'emoji' ? "bg-warning/20" : "bg-primary/20"
                  )}>
                    {log.type === 'emoji' ? (
                      <Smile className="w-5 h-5 text-warning" />
                    ) : (
                      <Bot className="w-5 h-5 text-primary" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-foreground">{log.page}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-sm text-muted-foreground truncate">{log.postTitle}</span>
                      <Badge variant={statusColors[log.status]} className="text-xs ml-auto shrink-0">
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {log.status}
                      </Badge>
                    </div>
                    
                    {log.comment && (
                      <div className="flex items-start gap-2 mb-2">
                        <MessageSquare className="w-3 h-3 text-muted-foreground mt-1 shrink-0" />
                        <p className="text-sm text-muted-foreground">{log.comment}</p>
                      </div>
                    )}
                    
                    {log.reply && (
                      <div className="bg-secondary/50 rounded-lg p-2 mb-2">
                        <p className="text-sm text-foreground">→ {log.reply}</p>
                      </div>
                    )}

                    {log.skipReason && (
                      <p className="text-sm text-warning">{log.skipReason}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span>{log.timestamp}</span>
                      <span>ID: {log.commentId}</span>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">No activity found</p>
            <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
