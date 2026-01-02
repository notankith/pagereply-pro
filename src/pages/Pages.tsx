import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  MoreVertical, 
  MessageSquare, 
  Reply, 
  TrendingUp,
  ExternalLink,
  Pause,
  Play,
  Trash2,
  Loader2,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { usePages, useCreatePage, useUpdatePage, useDeletePage, useManualProcessReplies } from '@/hooks/useApi';
import { toast } from 'sonner';
import type { FacebookPage } from '@/lib/api';

export default function Pages() {
  const { data: pages, isLoading } = usePages();
  const createPage = useCreatePage();
  const updatePage = useUpdatePage();
  const deletePage = useDeletePage();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPage, setNewPage] = useState({
    name: '',
    pageId: '',
    accessToken: '',
  });

  const handleAddPage = async () => {
    if (!newPage.name || !newPage.pageId || !newPage.accessToken) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      await createPage.mutateAsync({
        name: newPage.name,
        pageId: newPage.pageId,
        accessToken: newPage.accessToken,
        status: 'active',
        autoReply: true,
      });
      toast.success('Page connected successfully');
      setIsAddDialogOpen(false);
      setNewPage({ name: '', pageId: '', accessToken: '' });
    } catch (error) {
      toast.error('Failed to connect page');
    }
  };

  const toggleAutoReply = async (page: FacebookPage) => {
    const id = page._id || page.id;
    if (!id) return;
    
    try {
      await updatePage.mutateAsync({ id, autoReply: !page.autoReply });
      toast.success(`Auto-reply ${page.autoReply ? 'disabled' : 'enabled'}`);
    } catch (error) {
      toast.error('Failed to update page');
    }
  };

  const toggleStatus = async (page: FacebookPage) => {
    const id = page._id || page.id;
    if (!id) return;
    
    try {
      const newStatus = page.status === 'active' ? 'paused' : 'active';
      await updatePage.mutateAsync({ id, status: newStatus });
      toast.success(`Page ${newStatus === 'active' ? 'activated' : 'paused'}`);
    } catch (error) {
      toast.error('Failed to update page');
    }
  };

  const handleDelete = async (page: FacebookPage) => {
    const id = page._id || page.id;
    if (!id) return;
    
    try {
      await deletePage.mutateAsync(id);
      toast.success('Page disconnected');
    } catch (error) {
      toast.error('Failed to disconnect page');
    }
  };

  // Manual reply functionality moved to a dedicated Manual Reply tab.
  // Pages view now only manages page-level configuration and status.

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Pages</h1>
            <p className="text-muted-foreground">Manage your connected Facebook Pages.</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Connect Page
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Facebook Page</DialogTitle>
                <DialogDescription>
                  Enter your Facebook Page details to start automating replies.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Page Name</Label>
                  <Input 
                    placeholder="My Business Page"
                    value={newPage.name}
                    onChange={(e) => setNewPage(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Page ID</Label>
                  <Input 
                    placeholder="123456789"
                    value={newPage.pageId}
                    onChange={(e) => setNewPage(prev => ({ ...prev, pageId: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Find this in your Page's About section</p>
                </div>
                <div className="space-y-2">
                  <Label>Page Access Token</Label>
                  <Input 
                    type="password"
                    placeholder="EAAGm..."
                    value={newPage.accessToken}
                    onChange={(e) => setNewPage(prev => ({ ...prev, accessToken: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Get this from Facebook Developer Console</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddPage} disabled={createPage.isPending}>
                  {createPage.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Connect
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : pages && pages.length > 0 ? (
          /* Pages Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pages.map((page, index) => (
              <div 
                key={page._id || page.id || index}
                className="glass rounded-xl p-6 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-semibold">
                      {page.name.substring(0, 2).toUpperCase()}
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
                        <DropdownMenuItem onClick={() => toggleStatus(page)}>
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
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(page)}
                        >
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
                    <p className="text-lg font-semibold text-foreground">{page.stats?.comments || 0}</p>
                    <p className="text-xs text-muted-foreground">Comments</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <Reply className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-lg font-semibold text-foreground">{page.stats?.replies || 0}</p>
                    <p className="text-xs text-muted-foreground">Replies</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <div className={cn(
                      "w-2 h-2 rounded-full mx-auto mb-2",
                      (page.stats?.pending || 0) > 0 ? "bg-warning animate-pulse" : "bg-muted-foreground"
                    )} />
                    <p className="text-lg font-semibold text-foreground">{page.stats?.pending || 0}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <TrendingUp className="w-4 h-4 text-success mx-auto mb-1" />
                    <p className="text-lg font-semibold text-success">{page.stats?.engagement || '--'}</p>
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
                    onCheckedChange={() => toggleAutoReply(page)}
                    disabled={page.status === 'paused'}
                    className="data-[state=checked]:bg-success"
                  />
                </div>
                <div className="mt-4 p-3 bg-secondary/5 rounded-lg">
                  <p className="text-sm">Manual reply controls moved to the <a href="/manual-reply" className="text-primary underline">Manual Reply</a> tab.</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="glass rounded-xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No pages connected</h3>
            <p className="text-muted-foreground mb-4">Connect your first Facebook Page to start automating replies.</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Connect Page
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
