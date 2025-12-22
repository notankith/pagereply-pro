import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ReplyChart } from '@/components/dashboard/ReplyChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { NextCronCard } from '@/components/dashboard/NextCronCard';
import { MessageSquare, Reply, Smile, Bot, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { useGlobalStats } from '@/hooks/useApi';

const Index = () => {
  const { data: stats, isLoading } = useGlobalStats();

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your Facebook comment automation at a glance.</p>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            <StatCard 
              title="Total Comments" 
              value={stats?.totalComments?.toLocaleString() || '0'} 
              change={`${stats?.pending || 0} pending`}
              changeType="neutral"
              icon={MessageSquare}
              delay={0}
            />
            <StatCard 
              title="Total Replies" 
              value={stats?.totalReplies?.toLocaleString() || '0'} 
              change={`${stats?.replyRate || 0}% reply rate`}
              changeType="positive"
              icon={Reply}
              delay={50}
            />
            <StatCard 
              title="Emoji Replies" 
              value={stats?.emojiReplies?.toLocaleString() || '0'} 
              change={stats?.totalReplies ? `${Math.round((stats.emojiReplies / stats.totalReplies) * 100)}% of total` : '0%'}
              changeType="neutral"
              icon={Smile}
              delay={100}
            />
            <StatCard 
              title="AI Replies" 
              value={stats?.aiReplies?.toLocaleString() || '0'} 
              change={stats?.totalReplies ? `${Math.round((stats.aiReplies / stats.totalReplies) * 100)}% of total` : '0%'}
              changeType="neutral"
              icon={Bot}
              delay={150}
            />
            <StatCard 
              title="Active Pages" 
              value={stats?.activePages || 0} 
              change={`of ${stats?.totalPages || 0} total`}
              changeType="positive"
              icon={TrendingUp}
              delay={200}
            />
            <StatCard 
              title="Skipped" 
              value={stats?.skipped?.toLocaleString() || '0'} 
              change={`${stats?.failed || 0} failed`}
              changeType="neutral"
              icon={AlertTriangle}
              delay={250}
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <ReplyChart />
          </div>
          
          {/* Next Cron Card */}
          <div>
            <NextCronCard />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6">
          <RecentActivity />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
