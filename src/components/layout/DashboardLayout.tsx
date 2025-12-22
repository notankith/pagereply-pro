import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileStack, 
  Activity, 
  BarChart3, 
  Settings, 
  Zap,
  ChevronLeft,
  ChevronRight,
  Shield,
  Power
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Overview', icon: LayoutDashboard, href: '/' },
  { label: 'Pages', icon: FileStack, href: '/pages' },
  { label: 'Insights', icon: BarChart3, href: '/insights' },
  { label: 'Activity', icon: Activity, href: '/activity' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [globalActive, setGlobalActive] = useState(true);
  const [shadowMode, setShadowMode] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">ReplyBot</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Status Controls */}
        <div className={cn("p-4 border-t border-sidebar-border space-y-4", collapsed && "px-2")}>
          {!collapsed ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Power className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Global</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={globalActive ? "success" : "muted"} className="text-xs">
                    {globalActive ? "Active" : "Paused"}
                  </Badge>
                  <Switch 
                    checked={globalActive} 
                    onCheckedChange={setGlobalActive}
                    className="data-[state=checked]:bg-success"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Shadow</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={shadowMode ? "warning" : "muted"} className="text-xs">
                    {shadowMode ? "On" : "Off"}
                  </Badge>
                  <Switch 
                    checked={shadowMode} 
                    onCheckedChange={setShadowMode}
                    className="data-[state=checked]:bg-warning"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 items-center">
              <div className={cn("w-2 h-2 rounded-full", globalActive ? "bg-success" : "bg-muted-foreground")} />
              <div className={cn("w-2 h-2 rounded-full", shadowMode ? "bg-warning" : "bg-muted-foreground")} />
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-secondary border border-border"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </Button>
      </aside>

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
