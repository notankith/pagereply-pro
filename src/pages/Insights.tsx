import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AreaChart, 
  Area, 
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
import { Download, Calendar, TrendingUp, Clock, Smile, Bot } from 'lucide-react';

const repliesPerWindow = [
  { window: 'Mon 00:00', emoji: 45, ai: 89 },
  { window: 'Mon 06:00', emoji: 52, ai: 102 },
  { window: 'Mon 12:00', emoji: 61, ai: 118 },
  { window: 'Mon 18:00', emoji: 38, ai: 95 },
  { window: 'Tue 00:00', emoji: 42, ai: 87 },
  { window: 'Tue 06:00', emoji: 55, ai: 112 },
  { window: 'Tue 12:00', emoji: 67, ai: 134 },
  { window: 'Tue 18:00', emoji: 48, ai: 98 },
];

const engagementData = [
  { name: 'Before', value: 2400 },
  { name: 'After', value: 3200 },
];

const replyTypeData = [
  { name: 'AI Replies', value: 62, color: 'hsl(var(--primary))' },
  { name: 'Emoji Replies', value: 38, color: 'hsl(var(--warning))' },
];

const topPosts = [
  { id: '1', title: 'New Product Launch Announcement', comments: 342, replies: 298, page: 'Tech News Daily' },
  { id: '2', title: '10 Tips for Better Workouts', comments: 256, replies: 234, page: 'Fitness Hub' },
  { id: '3', title: 'Easy Pasta Recipe in 15 Minutes', comments: 189, replies: 156, page: 'Food & Recipes' },
  { id: '4', title: 'Hidden Gems in Bali', comments: 167, replies: 145, page: 'Travel Adventures' },
  { id: '5', title: 'AI Updates Coming This Week', comments: 145, replies: 132, page: 'Tech News Daily' },
];

export default function Insights() {
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
              <span className="text-sm text-muted-foreground">Avg Reply Delay</span>
            </div>
            <p className="text-2xl font-bold text-foreground">12.4s</p>
            <p className="text-xs text-success">Within target range (5-20s)</p>
          </div>
          <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm text-muted-foreground">Engagement Lift</span>
            </div>
            <p className="text-2xl font-bold text-success">+24%</p>
            <p className="text-xs text-muted-foreground">vs. before automation</p>
          </div>
          <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-2 mb-2">
              <Smile className="w-4 h-4 text-warning" />
              <span className="text-sm text-muted-foreground">Emoji Reply Rate</span>
            </div>
            <p className="text-2xl font-bold text-foreground">38%</p>
            <p className="text-xs text-muted-foreground">892 of 2,341 total</p>
          </div>
          <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">AI Reply Rate</span>
            </div>
            <p className="text-2xl font-bold text-foreground">62%</p>
            <p className="text-xs text-muted-foreground">1,449 of 2,341 total</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Replies Per Window */}
          <div className="lg:col-span-2 glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Replies Per 6h Window</h3>
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

        {/* Top Posts Table */}
        <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Top Posts by Comment Volume</h3>
            <Badge variant="secondary">Last 7 days</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-sm font-medium text-muted-foreground py-3 px-4">Post</th>
                  <th className="text-left text-sm font-medium text-muted-foreground py-3 px-4">Page</th>
                  <th className="text-right text-sm font-medium text-muted-foreground py-3 px-4">Comments</th>
                  <th className="text-right text-sm font-medium text-muted-foreground py-3 px-4">Replies</th>
                  <th className="text-right text-sm font-medium text-muted-foreground py-3 px-4">Rate</th>
                </tr>
              </thead>
              <tbody>
                {topPosts.map((post) => (
                  <tr key={post.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-foreground">{post.title}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">{post.page}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-foreground">{post.comments}</td>
                    <td className="py-3 px-4 text-right text-sm text-foreground">{post.replies}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-medium text-success">
                        {Math.round((post.replies / post.comments) * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
