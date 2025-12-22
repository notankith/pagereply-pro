import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Download, Calendar, TrendingUp, Clock, Smile, Bot, Loader2 } from 'lucide-react';
import { useChartData, useGlobalStats } from '@/hooks/useApi';

export default function Insights() {
  const { data: chartData, isLoading: chartLoading } = useChartData(7);
  const { data: stats, isLoading: statsLoading } = useGlobalStats();

  const isLoading = chartLoading || statsLoading;

  // Transform chart data for display
  const repliesPerWindow = React.useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    return chartData.map((item: { _id?: { date?: string; window?: number }; emoji?: number; ai?: number }) => ({
      window: `${item._id?.date || ''} ${String(item._id?.window || 0).padStart(2, '0')}:00`,
      emoji: item.emoji || 0,
      ai: item.ai || 0,
    }));
  }, [chartData]);

  // Calculate reply type distribution from stats
  const replyTypeData = React.useMemo(() => {
    if (!stats || stats.totalReplies === 0) {
      return [
        { name: 'AI Replies', value: 0, color: 'hsl(var(--primary))' },
        { name: 'Emoji Replies', value: 0, color: 'hsl(var(--warning))' },
      ];
    }
    const aiPercent = Math.round((stats.aiReplies / stats.totalReplies) * 100);
    const emojiPercent = 100 - aiPercent;
    return [
      { name: 'AI Replies', value: aiPercent, color: 'hsl(var(--primary))' },
      { name: 'Emoji Replies', value: emojiPercent, color: 'hsl(var(--warning))' },
    ];
  }, [stats]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Insights</h1>
            <p className="text-muted-foreground">Analyze your automation performance and engagement metrics.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Last 7 Days
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-xl p-4 animate-slide-up">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Reply Rate</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats?.replyRate || 0}%</p>
            <p className="text-xs text-success">of comments replied</p>
          </div>
          <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm text-muted-foreground">Total Replies</span>
            </div>
            <p className="text-2xl font-bold text-success">{stats?.totalReplies?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground">all time</p>
          </div>
          <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-2 mb-2">
              <Smile className="w-4 h-4 text-warning" />
              <span className="text-sm text-muted-foreground">Emoji Replies</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats?.emojiReplies?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground">{replyTypeData[1]?.value || 0}% of total</p>
          </div>
          <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">AI Replies</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats?.aiReplies?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground">{replyTypeData[0]?.value || 0}% of total</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Replies Per Window */}
          <div className="lg:col-span-2 glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Replies Per 6h Window</h3>
            {repliesPerWindow.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={repliesPerWindow}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="window" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="emoji" stackId="a" fill="hsl(var(--warning))" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="ai" stackId="a" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No reply data yet. Connect a page and start processing comments.
              </div>
            )}
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-sm text-muted-foreground">Emoji</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">AI</span>
              </div>
            </div>
          </div>

          {/* Reply Type Distribution */}
          <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '250ms' }}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Reply Distribution</h3>
            {stats?.totalReplies && stats.totalReplies > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={replyTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {replyTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No data yet
              </div>
            )}
            <div className="space-y-2 mt-4">
              {replyTypeData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending & Failed Summary */}
        <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Status Summary</h3>
            <Badge variant="secondary">All Time</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stats?.totalComments?.toLocaleString() || 0}</p>
              <p className="text-sm text-muted-foreground">Total Comments</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-warning">{stats?.pending?.toLocaleString() || 0}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{stats?.skipped?.toLocaleString() || 0}</p>
              <p className="text-sm text-muted-foreground">Skipped</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{stats?.failed?.toLocaleString() || 0}</p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
