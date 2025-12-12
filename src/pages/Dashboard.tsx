import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Users, Eye, TrendingUp, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';
import type { Case } from '@/types/database';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCases: 0,
    myCases: 0,
    publicCases: 0,
    activeCases: 0,
  });
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;

      // Get my cases count
      const { count: myCount } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get public cases count
      const { count: publicCount } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true);

      // Get active cases count (my cases + public cases)
      const { count: activeCount } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .or(`user_id.eq.${user.id},is_public.eq.true`);

      setStats({
        totalCases: (myCount || 0) + (publicCount || 0),
        myCases: myCount || 0,
        publicCases: publicCount || 0,
        activeCases: activeCount || 0,
      });
    }

    async function fetchRecentCases() {
      if (!user) return;

      const { data } = await supabase
        .from('cases')
        .select('*')
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentCases(data || []);
    }

    async function fetchAnalytics() {
      if (!user) return;

      // Get cases created in the last 7 days
      const { data: weekData } = await supabase
        .from('cases')
        .select('created_at, status')
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Process data for charts
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
        return format(date, 'MMM dd');
      });

      const casesPerDay = last7Days.map(day => {
        const count = weekData?.filter(c => format(new Date(c.created_at!), 'MMM dd') === day).length || 0;
        return { date: day, cases: count };
      });

      setAnalyticsData(casesPerDay);

      // Get status distribution
      const { data: allCases } = await supabase
        .from('cases')
        .select('status')
        .or(`user_id.eq.${user.id},is_public.eq.true`);

      const statusCounts = allCases?.reduce((acc: any, c) => {
        const status = c.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const statusChart = Object.keys(statusCounts || {}).map(status => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count: statusCounts[status],
      }));

      setStatusData(statusChart);
    }

    fetchStats();
    fetchRecentCases();
    fetchAnalytics();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, Officer
          </h2>
          <p className="text-muted-foreground">
            Here's an overview of the current situation
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCases}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Accessible to you
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">My Cases</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.myCases}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Created by you
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Public Cases</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.publicCases}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Shared across departments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCases}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently being investigated
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <a 
                href="/dashboard/register"
                className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <FileText className="h-8 w-8 text-primary mb-2" />
                <span className="font-medium">Register New Case</span>
              </a>
              
              <a 
                href="/dashboard/live-search"
                className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <Eye className="h-8 w-8 text-primary mb-2" />
                <span className="font-medium">Live CCTV Search</span>
              </a>
              
              <a 
                href="/dashboard/footage-search"
                className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <span className="font-medium">Upload Footage</span>
              </a>
              
              <a 
                href="/dashboard/cases"
                className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <Users className="h-8 w-8 text-primary mb-2" />
                <span className="font-medium">View All Cases</span>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI-Powered Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  The system uses advanced facial recognition technology to analyze CCTV footage 
                  and help locate missing persons. All searches are conducted securely and privately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cases Registered (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Area type="monotone" dataKey="cases" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cases by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="status" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Cases */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentCases.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No recent cases to display</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date Registered</TableHead>
                    <TableHead>Visibility</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCases.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.full_name}</TableCell>
                      <TableCell>{c.age || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === 'active' ? 'default' : 'secondary'}>
                          {c.status || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.last_seen_location || 'Unknown'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.date_registered ? format(new Date(c.date_registered), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.is_public ? 'outline' : 'secondary'}>
                          {c.is_public ? 'Public' : 'Private'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
