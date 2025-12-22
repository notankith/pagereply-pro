import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ReplyChart } from '@/components/dashboard/ReplyChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { NextCronCard } from '@/components/dashboard/NextCronCard';
import { MessageSquare, Reply, Smile, Bot, TrendingUp, AlertTriangle } from 'lucide-react';

const Index = () => {
  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your Facebook comment automation at a glance.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard 
            title="Total Comments" 
            value="2,847" 
            change="+12% from last week"
            changeType="positive"
            icon={MessageSquare}
            delay={0}
          />
          <StatCard 
            title="Total Replies" 
            value="2,341" 
            change="82% reply rate"
            changeType="positive"
            icon={Reply}
            delay={50}
          />
          <StatCard 
            title="Emoji Replies" 
            value="892" 
            change="38% of total"
            changeType="neutral"
            icon={Smile}
            delay={100}
          />
          <StatCard 
            title="AI Replies" 
            value="1,449" 
            change="62% of total"
            changeType="neutral"
            icon={Bot}
            delay={150}
          />
          <StatCard 
            title="Engagement Lift" 
            value="+24%" 
            change="vs. pre-automation"
            changeType="positive"
            icon={TrendingUp}
            delay={200}
          />
          <StatCard 
            title="Skipped" 
            value="506" 
            change="Self-replies filtered"
            changeType="neutral"
            icon={AlertTriangle}
            delay={250}
          />
        </div>

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
