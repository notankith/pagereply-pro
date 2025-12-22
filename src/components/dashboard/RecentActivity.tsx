import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Smile, Bot, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'emoji' | 'ai';
  page: string;
  comment: string;
  reply: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
}

const activities: ActivityItem[] = [
  {
    id: '1',
    type: 'ai',
    page: 'Tech News Daily',
    comment: 'This is amazing! Can you tell me more about the new features?',
    reply: 'Thank you for your interest! The new features include improved performance, better UI, and enhanced security. Stay tuned for more updates!',
    status: 'success',
    timestamp: '2 min ago'
  },
  {
    id: '2',
    type: 'emoji',
    page: 'Fitness Hub',
    comment: 'Love it! 💪',
    reply: '❤️',
    status: 'success',
    timestamp: '5 min ago'
  },
  {
    id: '3',
    type: 'ai',
    page: 'Food & Recipes',
    comment: 'What ingredients do I need for this recipe?',
    reply: 'Great question! You\'ll need flour, eggs, butter, sugar, and vanilla extract. Full recipe in our bio link!',
    status: 'success',
    timestamp: '12 min ago'
  },
  {
    id: '4',
    type: 'emoji',
    page: 'Travel Adventures',
    comment: 'Nice!',
    reply: '🙌',
    status: 'pending',
    timestamp: '15 min ago'
  },
  {
    id: '5',
    type: 'ai',
    page: 'Tech News Daily',
    comment: 'Is this available in my country?',
    reply: '',
    status: 'failed',
    timestamp: '18 min ago'
  },
];

export function RecentActivity() {
  return (
    <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <Badge variant="secondary" className="text-xs">Last 24h</Badge>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div 
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              activity.type === 'emoji' ? "bg-warning/20" : "bg-primary/20"
            )}>
              {activity.type === 'emoji' ? (
                <Smile className="w-4 h-4 text-warning" />
              ) : (
                <Bot className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground truncate">{activity.page}</span>
                <Badge 
                  variant={
                    activity.status === 'success' ? 'success' : 
                    activity.status === 'failed' ? 'destructive' : 'warning'
                  }
                  className="text-xs"
                >
                  {activity.status === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {activity.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                  {activity.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                  {activity.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                <MessageCircle className="w-3 h-3 inline mr-1" />
                {activity.comment}
              </p>
              {activity.reply && (
                <p className="text-sm text-foreground/80 line-clamp-1">
                  → {activity.reply}
                </p>
              )}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{activity.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
