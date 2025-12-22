import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Smile, Bot, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActivity } from '@/hooks/useApi';
import type { Comment } from '@/lib/api';

export function RecentActivity() {
  const { data: activities, isLoading } = useActivity(5);

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const displayActivities = activities && activities.length > 0 ? activities : [];

  return (
    <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <Badge variant="secondary" className="text-xs">Last 24h</Badge>
      </div>
      {displayActivities.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No activity yet. Connect a page to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayActivities.map((activity: Comment) => (
            <div 
              key={activity._id}
              className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                activity.replyType === 'emoji' ? "bg-warning/20" : "bg-primary/20"
              )}>
                {activity.replyType === 'emoji' ? (
                  <Smile className="w-4 h-4 text-warning" />
                ) : (
                  <Bot className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground truncate">{activity.fromName}</span>
                  <Badge 
                    variant={
                      activity.status === 'replied' ? 'success' : 
                      activity.status === 'failed' ? 'destructive' : 
                      activity.status === 'skipped' ? 'warning' : 'muted'
                    }
                    className="text-xs"
                  >
                    {activity.status === 'replied' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {activity.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                    {(activity.status === 'pending' || activity.status === 'skipped') && <Clock className="w-3 h-3 mr-1" />}
                    {activity.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                  <MessageCircle className="w-3 h-3 inline mr-1" />
                  {activity.message || '(no message)'}
                </p>
                {activity.replyMessage && (
                  <p className="text-sm text-foreground/80 line-clamp-1">
                    → {activity.replyMessage}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {activity.receivedAt ? new Date(activity.receivedAt).toLocaleTimeString() : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
