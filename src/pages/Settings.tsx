import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { 
  Save, 
  Shield, 
  Clock, 
  MessageSquare, 
  AlertTriangle,
  Zap,
  Bot
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const [settings, setSettings] = useState({
    maxRepliesPerRun: 100,
    minDelay: 5,
    maxDelay: 20,
    shortCommentThresholdWords: 6,
    shortCommentThresholdChars: 40,
    globalPause: false,
    shadowMode: false,
    autoPauseOnErrors: true,
    errorThreshold: 5,
    aiTone: "You are a friendly and helpful social media manager. Respond to comments in a warm, professional manner. Keep responses concise but engaging. Never be defensive or argumentative."
  });

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Configure your automation preferences and safety controls.</p>
        </div>

        <div className="space-y-8">
          {/* Reply Configuration */}
          <div className="glass rounded-xl p-6 animate-slide-up">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Reply Configuration</h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Short Comment Threshold (words)</Label>
                  <Input 
                    type="number"
                    value={settings.shortCommentThresholdWords}
                    onChange={(e) => setSettings(s => ({ ...s, shortCommentThresholdWords: parseInt(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Comments with ≤ this many words get emoji replies</p>
                </div>
                <div className="space-y-2">
                  <Label>Short Comment Threshold (characters)</Label>
                  <Input 
                    type="number"
                    value={settings.shortCommentThresholdChars}
                    onChange={(e) => setSettings(s => ({ ...s, shortCommentThresholdChars: parseInt(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">OR comments with &lt; this many characters</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max Replies Per Run</Label>
                <div className="flex items-center gap-4">
                  <Slider 
                    value={[settings.maxRepliesPerRun]}
                    onValueChange={([v]) => setSettings(s => ({ ...s, maxRepliesPerRun: v }))}
                    max={500}
                    min={10}
                    step={10}
                    className="flex-1"
                  />
                  <span className="text-lg font-medium text-foreground w-16 text-right">{settings.maxRepliesPerRun}</span>
                </div>
                <p className="text-xs text-muted-foreground">Safety cap to prevent excessive API usage</p>
              </div>
            </div>
          </div>

          {/* Timing Configuration */}
          <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Timing</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Reply Delay Range (seconds)</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    type="number"
                    value={settings.minDelay}
                    onChange={(e) => setSettings(s => ({ ...s, minDelay: parseInt(e.target.value) }))}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input 
                    type="number"
                    value={settings.maxDelay}
                    onChange={(e) => setSettings(s => ({ ...s, maxDelay: parseInt(e.target.value) }))}
                    className="w-24"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Random delay between replies to appear organic</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Cron Schedule</p>
                  <p className="text-sm text-muted-foreground">Runs every 6 hours automatically</p>
                </div>
                <Badge variant="success">Every 6h</Badge>
              </div>
            </div>
          </div>

          {/* AI Tone */}
          <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-2 mb-6">
              <Bot className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">AI Tone (Global)</h2>
            </div>

            <div className="space-y-2">
              <Label>System Prompt</Label>
              <Textarea 
                value={settings.aiTone}
                onChange={(e) => setSettings(s => ({ ...s, aiTone: e.target.value }))}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">This tone applies to all AI-generated replies across all pages</p>
            </div>
          </div>

          {/* Safety Controls */}
          <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Safety Controls</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Global Pause</p>
                  <p className="text-sm text-muted-foreground">Stop all reply activity immediately</p>
                </div>
                <Switch 
                  checked={settings.globalPause}
                  onCheckedChange={(v) => setSettings(s => ({ ...s, globalPause: v }))}
                  className="data-[state=checked]:bg-destructive"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Shadow Mode</p>
                  <p className="text-sm text-muted-foreground">Simulate replies without posting</p>
                </div>
                <Switch 
                  checked={settings.shadowMode}
                  onCheckedChange={(v) => setSettings(s => ({ ...s, shadowMode: v }))}
                  className="data-[state=checked]:bg-warning"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-foreground">Auto-Pause on Errors</p>
                  <p className="text-sm text-muted-foreground">Pause page if API errors exceed threshold</p>
                </div>
                <div className="flex items-center gap-3">
                  <Input 
                    type="number"
                    value={settings.errorThreshold}
                    onChange={(e) => setSettings(s => ({ ...s, errorThreshold: parseInt(e.target.value) }))}
                    className="w-16 h-8"
                    disabled={!settings.autoPauseOnErrors}
                  />
                  <Switch 
                    checked={settings.autoPauseOnErrors}
                    onCheckedChange={(v) => setSettings(s => ({ ...s, autoPauseOnErrors: v }))}
                    className="data-[state=checked]:bg-success"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button size="lg" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
