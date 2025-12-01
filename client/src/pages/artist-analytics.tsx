import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Music, Play, Heart, Users, TrendingUp, TrendingDown, 
  DollarSign, GraduationCap, Clock, Star, Disc, Award,
  Activity, Zap, Target, Trophy
} from 'lucide-react';
import type { ArtistProfile } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';

interface EnhancedAnalyticsData {
  totalPlays: number;
  totalLikes: number;
  trackCount: number;
  uniqueListeners: number;
  followerCount: number;
  totalSupport: number;
  playsTrend: number;
  likesTrend: number;
  listenersTrend: number;
  followersTrend: number;
  playsOverTime: { date: string; plays: number }[];
  topTracks: { 
    id: string;
    title: string;
    coverArt: string | null;
    plays: number;
    likes: number;
    shares: number;
  }[];
  listenersByUniversity: { university: string; count: number }[];
  peakListeningHours: { hour: number; count: number }[];
  recentActivity: {
    type: 'play' | 'like' | 'follow' | 'support' | 'share';
    userId: string;
    userName: string;
    trackTitle?: string;
    amount?: number;
    timestamp: string;
  }[];
  milestones: {
    id: string;
    title: string;
    description: string;
    achieved: boolean;
    progress: number;
    target: number;
    icon: string;
  }[];
}

function TrendBadge({ value, label }: { value: number; label: string }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <Badge 
      variant={isPositive ? "default" : "secondary"} 
      className={`text-xs ${isPositive ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}
    >
      {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
      {isPositive ? '+' : ''}{value}% {label}
    </Badge>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  trendLabel,
  color = "primary"
}: { 
  icon: typeof Play;
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  color?: string;
}) {
  return (
    <Card className="p-5" data-testid={`stat-card-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg bg-primary/10`}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          </div>
        </div>
        {trend !== undefined && trendLabel && (
          <TrendBadge value={trend} label={trendLabel} />
        )}
      </div>
    </Card>
  );
}

function getMilestoneIcon(iconName: string) {
  const icons: Record<string, typeof Music> = {
    'music': Music,
    'disc': Disc,
    'play': Play,
    'star': Star,
    'heart': Heart,
    'users': Users,
    'dollar-sign': DollarSign,
    'graduation-cap': GraduationCap,
  };
  return icons[iconName] || Trophy;
}

function MilestoneCard({ milestone }: { milestone: EnhancedAnalyticsData['milestones'][0] }) {
  const Icon = getMilestoneIcon(milestone.icon);
  const progressPercent = Math.min((milestone.progress / milestone.target) * 100, 100);
  
  return (
    <Card 
      className={`p-4 ${milestone.achieved ? 'border-primary/50 bg-primary/5' : ''}`}
      data-testid={`milestone-${milestone.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${milestone.achieved ? 'bg-primary/20' : 'bg-muted'}`}>
          <Icon className={`h-5 w-5 ${milestone.achieved ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-semibold ${milestone.achieved ? 'text-primary' : ''}`}>
              {milestone.title}
            </p>
            {milestone.achieved && (
              <Badge variant="default" className="text-xs bg-primary/20 text-primary border-primary/30">
                Achieved
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{milestone.description}</p>
          {!milestone.achieved && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{milestone.progress} / {milestone.target}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ActivityItem({ activity }: { activity: EnhancedAnalyticsData['recentActivity'][0] }) {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'play': return <Play className="h-4 w-4 text-blue-400" />;
      case 'like': return <Heart className="h-4 w-4 text-red-400" />;
      case 'follow': return <Users className="h-4 w-4 text-green-400" />;
      case 'support': return <DollarSign className="h-4 w-4 text-yellow-400" />;
      case 'share': return <Zap className="h-4 w-4 text-purple-400" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityText = () => {
    switch (activity.type) {
      case 'play': return `played "${activity.trackTitle}"`;
      case 'like': return `liked "${activity.trackTitle}"`;
      case 'follow': return 'started following you';
      case 'support': return `sent you $${((activity.amount || 0) / 100).toFixed(2)}`;
      case 'share': return `shared "${activity.trackTitle}"`;
      default: return 'interacted with your content';
    }
  };

  return (
    <div className="flex items-center gap-3 py-2" data-testid={`activity-item-${activity.type}`}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">
          {activity.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{activity.userName}</span>{' '}
          <span className="text-muted-foreground">{getActivityText()}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
        </p>
      </div>
      {getActivityIcon()}
    </div>
  );
}

export default function ArtistAnalytics() {
  const { user } = useAuth();

  const { data: artistProfile } = useQuery<ArtistProfile>({
    queryKey: ['/api/artist/profile'],
    enabled: !!user,
  });

  const { data: analytics, isLoading } = useQuery<EnhancedAnalyticsData>({
    queryKey: ['/api/artists', artistProfile?.id, 'enhanced-analytics'],
    enabled: !!artistProfile?.id,
  });

  if (!user || user.role !== 'artist') {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">You must be an artist to view analytics</p>
      </div>
    );
  }

  const formatHour = (hour: number) => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    return hour > 12 ? `${hour - 12}pm` : `${hour}am`;
  };

  const achievedMilestones = analytics?.milestones.filter(m => m.achieved) || [];
  const pendingMilestones = analytics?.milestones.filter(m => !m.achieved) || [];

  return (
    <div className="space-y-6 pb-32" data-testid="analytics-dashboard">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg">
          <Activity className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-1" data-testid="text-dashboard-title">Analytics Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            {artistProfile?.stageName} - Performance Metrics
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-lg" />
        </div>
      ) : analytics ? (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList data-testid="analytics-tabs">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="audience" data-testid="tab-audience">Audience</TabsTrigger>
            <TabsTrigger value="content" data-testid="tab-content">Content</TabsTrigger>
            <TabsTrigger value="goals" data-testid="tab-goals">Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                icon={Play} 
                label="Total Plays" 
                value={analytics.totalPlays}
                trend={analytics.playsTrend}
                trendLabel="vs last month"
              />
              <StatCard 
                icon={Heart} 
                label="Total Likes" 
                value={analytics.totalLikes}
                trend={analytics.likesTrend}
                trendLabel="vs last month"
              />
              <StatCard 
                icon={Users} 
                label="Unique Listeners" 
                value={analytics.uniqueListeners}
              />
              <StatCard 
                icon={DollarSign} 
                label="Total Support" 
                value={`$${(analytics.totalSupport / 100).toFixed(2)}`}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="col-span-2 p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Plays Over Time (Last 30 Days)
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.playsOverTime}>
                    <defs>
                      <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E84A5F" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#E84A5F" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#888"
                      tickFormatter={(value) => new Date(value).getDate().toString()}
                    />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="plays" 
                      stroke="#E84A5F" 
                      fillOpacity={1} 
                      fill="url(#colorPlays)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activity
                </h2>
                <ScrollArea className="h-[280px]">
                  {analytics.recentActivity.length > 0 ? (
                    <div className="divide-y">
                      {analytics.recentActivity.slice(0, 10).map((activity, idx) => (
                        <ActivityItem key={idx} activity={activity} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No recent activity yet</p>
                      <p className="text-sm">Share your music to get more engagement!</p>
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard icon={Music} label="Total Tracks" value={analytics.trackCount} />
              <StatCard icon={Users} label="Followers" value={analytics.followerCount} />
              <StatCard 
                icon={Award} 
                label="Milestones Achieved" 
                value={`${achievedMilestones.length} / ${analytics.milestones.length}`} 
              />
            </div>
          </TabsContent>

          <TabsContent value="audience" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Listeners by University
                </h2>
                {analytics.listenersByUniversity.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.listenersByUniversity.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis type="number" stroke="#888" />
                      <YAxis 
                        type="category" 
                        dataKey="university" 
                        stroke="#888" 
                        width={120}
                        tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      />
                      <Bar dataKey="count" fill="#E84A5F" radius={[0, 4, 4, 0]}>
                        {analytics.listenersByUniversity.slice(0, 8).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#E84A5F' : '#E84A5F80'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No university data yet</p>
                    <p className="text-sm">Listeners from different campuses will appear here</p>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Peak Listening Hours
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.peakListeningHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="#888"
                      tickFormatter={formatHour}
                      interval={2}
                    />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      labelFormatter={(value) => formatHour(value as number)}
                    />
                    <Bar dataKey="count" fill="#E84A5F" radius={[4, 4, 0, 0]}>
                      {analytics.peakListeningHours.map((entry, index) => {
                        const maxCount = Math.max(...analytics.peakListeningHours.map(h => h.count));
                        const opacity = entry.count > 0 ? 0.3 + (entry.count / maxCount) * 0.7 : 0.2;
                        return <Cell key={`cell-${index}`} fill={`rgba(232, 74, 95, ${opacity})`} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Audience Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-3xl font-bold">{analytics.uniqueListeners}</p>
                  <p className="text-sm text-muted-foreground">Unique Listeners</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <GraduationCap className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-3xl font-bold">{analytics.listenersByUniversity.length}</p>
                  <p className="text-sm text-muted-foreground">Universities Reached</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-3xl font-bold">
                    {analytics.uniqueListeners > 0 
                      ? (analytics.totalPlays / analytics.uniqueListeners).toFixed(1) 
                      : '0'}
                  </p>
                  <p className="text-sm text-muted-foreground">Plays per Listener</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                Top Tracks Performance
              </h2>
              {analytics.topTracks.length > 0 ? (
                <div className="space-y-4">
                  {analytics.topTracks.map((track, index) => (
                    <div 
                      key={track.id} 
                      className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg"
                      data-testid={`top-track-${track.id}`}
                    >
                      <div className="text-2xl font-bold text-muted-foreground w-8 text-center">
                        {index + 1}
                      </div>
                      <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                        {track.coverArt ? (
                          <img src={track.coverArt} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <Music className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{track.title}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Play className="h-3 w-3" /> {track.plays.toLocaleString()} plays
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" /> {track.likes} likes
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" /> {track.shares} shares
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{track.plays.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">plays</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Music className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No tracks uploaded yet</p>
                  <p className="text-sm">Upload your first track to see performance metrics</p>
                </div>
              )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 text-center">
                <Play className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold">{analytics.totalPlays.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Plays</p>
              </Card>
              <Card className="p-6 text-center">
                <Heart className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold">{analytics.totalLikes.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Likes</p>
              </Card>
              <Card className="p-6 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold">
                  {analytics.totalPlays > 0 
                    ? ((analytics.totalLikes / analytics.totalPlays) * 100).toFixed(1) 
                    : '0'}%
                </p>
                <p className="text-sm text-muted-foreground">Like Rate</p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Achieved Milestones ({achievedMilestones.length})
                </h2>
                {achievedMilestones.length > 0 ? (
                  <div className="space-y-3">
                    {achievedMilestones.map(milestone => (
                      <MilestoneCard key={milestone.id} milestone={milestone} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No milestones achieved yet</p>
                    <p className="text-sm">Keep creating and sharing your music!</p>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  In Progress ({pendingMilestones.length})
                </h2>
                {pendingMilestones.length > 0 ? (
                  <div className="space-y-3">
                    {pendingMilestones.map(milestone => (
                      <MilestoneCard key={milestone.id} milestone={milestone} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>All milestones achieved!</p>
                    <p className="text-sm">You're a Campus Music superstar!</p>
                  </div>
                )}
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Your Journey</h2>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">
                    {achievedMilestones.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Achieved</p>
                </div>
                <div className="flex-1 mx-8">
                  <Progress 
                    value={(achievedMilestones.length / analytics.milestones.length) * 100} 
                    className="h-3"
                  />
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold">
                    {analytics.milestones.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Goals</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl">No analytics data available yet</p>
          <p className="text-sm mt-2">Upload tracks and share your music to start seeing analytics</p>
        </div>
      )}
    </div>
  );
}
