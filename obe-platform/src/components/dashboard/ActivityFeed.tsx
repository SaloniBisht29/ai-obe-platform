'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Sparkles, Clock, PlusCircle, GitBranch, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: string;
  entityName: string;
  entityCode: string;
  description: string;
  timestamp: string;
}

const typeConfig: Record<string, { color: string; icon: React.ElementType; iconColor: string }> = {
  approved: { color: 'bg-green-500', icon: CheckCircle2, iconColor: 'text-green-600 dark:text-green-400' },
  generated: { color: 'bg-blue-500', icon: Sparkles, iconColor: 'text-blue-600 dark:text-blue-400' },
  pending: { color: 'bg-orange-500', icon: Clock, iconColor: 'text-orange-600 dark:text-orange-400' },
  created: { color: 'bg-green-500', icon: PlusCircle, iconColor: 'text-green-600 dark:text-green-400' },
  mapped: { color: 'bg-blue-500', icon: GitBranch, iconColor: 'text-blue-600 dark:text-blue-400' },
};

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/activity')
      .then(res => res.ok ? res.json() : { activities: [] })
      .then(data => setActivities(data.activities || []))
      .catch(e => console.error('Failed to fetch activities:', e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.4 }}>
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No recent activity yet
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-blue-500/20 via-purple-500/20 to-transparent" />
              <div className="space-y-0">
                {activities.map((activity, index) => {
                  const config = typeConfig[activity.type] || typeConfig.created;
                  const Icon = config.icon;
                  return (
                    <motion.div key={activity.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                      className="relative flex items-start gap-4 py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className={cn('relative z-10 h-[32px] w-[32px] rounded-full flex items-center justify-center shrink-0 ring-4 ring-card transition-transform group-hover:scale-110', `${config.color}/10`)}>
                        <div className={cn('h-2.5 w-2.5 rounded-full', config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold">{activity.entityName}</span>{' '}
                          <span className="text-muted-foreground font-mono text-xs">({activity.entityCode})</span>{' '}
                          <span className="text-muted-foreground">{activity.description}</span>
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">{activity.timestamp}</p>
                      </div>
                      <Icon className={cn('h-4 w-4 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity', config.iconColor)} />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
