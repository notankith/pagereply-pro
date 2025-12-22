import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTriggerReplies, useGlobalStats } from '@/hooks/useApi';
import { toast } from 'sonner';

export function NextCronCard() {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 23, seconds: 45 });
  const { data: stats } = useGlobalStats();
  const triggerReplies = useTriggerReplies();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 5;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRunNow = async () => {
    try {
      const result = await triggerReplies.mutateAsync(false);
      toast.success(`Processed ${result.results?.replied || 0} replies`);
    } catch (error) {
      toast.error('Failed to run process');
    }
  };

  const formatNumber = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Next Run</h3>
        </div>
        <Badge variant="success" className="text-xs">
          Scheduled
        </Badge>
      </div>
      
      <div className="flex items-center justify-center gap-2 my-6">
        <div className="bg-secondary rounded-lg px-4 py-3 min-w-[60px] text-center">
          <span className="text-2xl font-bold text-foreground">{formatNumber(timeLeft.hours)}</span>
          <p className="text-xs text-muted-foreground mt-1">hours</p>
        </div>
        <span className="text-2xl font-bold text-muted-foreground">:</span>
        <div className="bg-secondary rounded-lg px-4 py-3 min-w-[60px] text-center">
          <span className="text-2xl font-bold text-foreground">{formatNumber(timeLeft.minutes)}</span>
          <p className="text-xs text-muted-foreground mt-1">mins</p>
        </div>
        <span className="text-2xl font-bold text-muted-foreground">:</span>
        <div className="bg-secondary rounded-lg px-4 py-3 min-w-[60px] text-center">
          <span className="text-2xl font-bold text-foreground">{formatNumber(timeLeft.seconds)}</span>
          <p className="text-xs text-muted-foreground mt-1">secs</p>
        </div>
      </div>

      <div className="space-y-3">
        <Button 
          variant="glow" 
          className="w-full"
          onClick={handleRunNow}
          disabled={triggerReplies.isPending}
        >
          {triggerReplies.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {triggerReplies.isPending ? 'Processing...' : 'Run Now'}
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
          <AlertTriangle className="w-3 h-3" />
          <span>{stats?.pending || 0} pending comments across {stats?.activePages || 0} pages</span>
        </div>
      </div>
    </div>
  );
}
