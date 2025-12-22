import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  MoreVertical, 
  MessageSquare, 
  Reply, 
  TrendingUp,
  ExternalLink,
  Pause,
  Play,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface FacebookPage {
  id: string;
  name: string;
  pageId: string;
  status: 'active' | 'paused';
  autoReply: boolean;
  stats: {
    comments: number;
    replies: number;
    pending: number;
    engagement: string;
  };
  avatar: string;
}

const mockPages: FacebookPage[] = [
  {
    id: '1',
    name: 'Tech News Daily',
    pageId: '123456789',
    status: 'active',
    autoReply: true,
    stats: { comments: 1247, replies: 1089, pending: 23, engagement: '+18%' },
    avatar: 'TN'
  },
  {
    id: '2',
    name: 'Fitness Hub',
    pageId: '987654321',
    status: 'active',
    autoReply: true,
    stats: { comments: 856, replies: 742, pending: 15, engagement: '+24%' },
    avatar: 'FH'
  },
  {
    id: '3',
    name: 'Food & Recipes',
    pageId: '456789123',
    status: 'paused',
    autoReply: false,
    stats: { comments: 534, replies: 398, pending: 0, engagement: '+12%' },
    avatar: 'FR'
  },
  {
    id: '4',
    name: 'Travel Adventures',
    pageId: '789123456',
    status: 'active',
    autoReply: true,
    stats: { comments: 210, replies: 112, pending: 14, engagement: '+31%' },
    avatar: 'TA'
  },
];

export default function Pages() {
  const [pages, setPages] = useState(mockPages);

  const toggleAutoReply = (pageId: string) => {
    setPages(prev => prev.map(page => 
      page.id === pageId ? { ...page, autoReply: !page.autoReply } : page
    ));
  };

  const toggleStatus = (pageId: string) => {
    setPages(prev => prev.map(page => 
      page.id === pageId ? { 
        ...page, 
        status: page.status === 'active' ? 'paused' : 'active' 
      } : page
    ));
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Pages</h1>
            <p className="text-muted-foreground">Manage your connected Facebook Pages.</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Connect Page
          </Button>
        </div>

        {/* Pages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pages.map((page, index) => (
            <div 
              key={page.id}
              className="glass rounded-xl p-6 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    {page.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{page.name}</h3>
                    <p className="text-sm text-muted-foreground">ID: {page.pageId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={page.status === 'active' ? 'success' : 'muted'}>
                    {page.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleStatus(page.id)}>
                        {page.status === 'active' ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" /> Pause Page
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" /> Activate Page
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ExternalLink className="w-4 h-4 mr-2" /> View on Facebook
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" /> Disconnect
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <MessageSquare className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-lg font-semibold text-foreground">{page.stats.comments.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Comments</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <Reply className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-lg font-semibold text-foreground">{page.stats.replies.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Replies</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <div className={cn(
                    "w-2 h-2 rounded-full mx-auto mb-2",
                    page.stats.pending > 0 ? "bg-warning animate-pulse" : "bg-muted-foreground"
                  )} />
                  <p className="text-lg font-semibold text-foreground">{page.stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <TrendingUp className="w-4 h-4 text-success mx-auto mb-1" />
                  <p className="text-lg font-semibold text-success">{page.stats.engagement}</p>
                  <p className="text-xs text-muted-foreground">Engagement</p>
                </div>
              </div>

              {/* Auto-Reply Toggle */}
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">Auto-Reply</p>
                  <p className="text-xs text-muted-foreground">Automatically respond to comments</p>
                </div>
                <Switch 
                  checked={page.autoReply}
                  onCheckedChange={() => toggleAutoReply(page.id)}
                  disabled={page.status === 'paused'}
                  className="data-[state=checked]:bg-success"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
