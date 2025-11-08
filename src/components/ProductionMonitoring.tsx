import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Activity, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    functions: { status: string; message: string };
    whatsapp?: { status: string; connectionState?: string; lastConnected?: string };
  };
  environment: {
    hasSupabaseUrl: boolean;
    hasSupabaseKey: boolean;
    hasWhatsAppKey: boolean;
    hasWhatsAppSession: boolean;
  };
}

interface MonitoringStats {
  totalNotifications: number;
  successfulNotifications: number;
  failedNotifications: number;
  deliveryRate: number;
  avgResponseTime: number;
  recentErrors: Array<{
    id: string;
    error_type: string;
    error_message: string;
    created_at: string;
  }>;
}

export function ProductionMonitoring() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    loadMonitoringData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadMonitoringData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  async function loadMonitoringData() {
    try {
      // Load health status
      const healthResponse = await fetch('/api/health');
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        setHealthStatus(health);
        
        // Check for alerts
        checkForAlerts(health);
      }

      // Load notification statistics
      await loadNotificationStats();
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadNotificationStats() {
    try {
      // Get notification counts from last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: notifications, error: notifError } = await supabase
        .from('whatsapp_notifications')
        .select('status, created_at, sent_at')
        .gte('created_at', oneDayAgo);

      if (notifError) throw notifError;

      const total = notifications?.length || 0;
      const successful = notifications?.filter(n => n.status === 'sent').length || 0;
      const failed = notifications?.filter(n => n.status === 'failed').length || 0;
      const deliveryRate = total > 0 ? (successful / total) * 100 : 0;

      // Calculate average response time
      const responseTimes = notifications
        ?.filter(n => n.sent_at && n.created_at)
        .map(n => {
          const created = new Date(n.created_at).getTime();
          const sent = new Date(n.sent_at).getTime();
          return sent - created;
        }) || [];

      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000
        : 0;

      // Get recent errors
      const { data: errors, error: errorsError } = await supabase
        .from('whatsapp_error_logs')
        .select('id, error_type, error_message, created_at')
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })
        .limit(10);

      if (errorsError) throw errorsError;

      setStats({
        totalNotifications: total,
        successfulNotifications: successful,
        failedNotifications: failed,
        deliveryRate,
        avgResponseTime,
        recentErrors: errors || []
      });
    } catch (error) {
      console.error('Failed to load notification stats:', error);
    }
  }

  function checkForAlerts(health: HealthStatus) {
    const newAlerts: string[] = [];

    // Check WhatsApp connection
    if (health.services.whatsapp?.status !== 'connected') {
      newAlerts.push('WhatsApp is not connected');
    }

    // Check delivery rate
    if (stats && stats.deliveryRate < 90 && stats.totalNotifications > 10) {
      newAlerts.push(`Low delivery rate: ${stats.deliveryRate.toFixed(1)}%`);
    }

    // Check for high error rate
    if (stats && stats.failedNotifications > stats.successfulNotifications * 0.1) {
      newAlerts.push('High error rate detected');
    }

    // Check environment configuration
    if (!health.environment.hasWhatsAppKey) {
      newAlerts.push('WhatsApp encryption key not configured');
    }

    setAlerts(newAlerts);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Activity className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading monitoring data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Alerts Detected</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {alerts.map((alert, index) => (
                <li key={index}>{alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>Overall system status and service health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Overall Status</span>
              <Badge variant={
                healthStatus?.status === 'healthy' ? 'default' :
                healthStatus?.status === 'degraded' ? 'secondary' : 'destructive'
              }>
                {healthStatus?.status === 'healthy' && <CheckCircle className="h-3 w-3 mr-1" />}
                {healthStatus?.status === 'degraded' && <AlertTriangle className="h-3 w-3 mr-1" />}
                {healthStatus?.status === 'unhealthy' && <AlertCircle className="h-3 w-3 mr-1" />}
                {healthStatus?.status || 'Unknown'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">WhatsApp Connection</span>
              <Badge variant={
                healthStatus?.services.whatsapp?.status === 'connected' ? 'default' : 'secondary'
              }>
                {healthStatus?.services.whatsapp?.connectionState || 'Unknown'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Cloudflare Functions</span>
              <Badge variant="default">
                <CheckCircle className="h-3 w-3 mr-1" />
                Operational
              </Badge>
            </div>

            {healthStatus?.services.whatsapp?.lastConnected && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Last Connected</span>
                <span>{new Date(healthStatus.services.whatsapp.lastConnected).toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Notification Statistics (24h)
          </CardTitle>
          <CardDescription>Performance metrics for the last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Sent</p>
              <p className="text-2xl font-bold">{stats?.totalNotifications || 0}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Successful</p>
              <p className="text-2xl font-bold text-green-600">{stats?.successfulNotifications || 0}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats?.failedNotifications || 0}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Delivery Rate</p>
              <p className="text-2xl font-bold">{stats?.deliveryRate.toFixed(1) || 0}%</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg Response Time
              </span>
              <span className="font-medium">{stats?.avgResponseTime.toFixed(2) || 0}s</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      {stats && stats.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Errors
            </CardTitle>
            <CardDescription>Last 10 errors from the past 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentErrors.map((error) => (
                <div key={error.id} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{error.error_type}</p>
                    <p className="text-sm text-muted-foreground">{error.error_message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {new Date(error.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring Actions</CardTitle>
          <CardDescription>Manual monitoring and maintenance actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={loadMonitoringData} variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button onClick={() => window.open('/whatsapp-admin', '_blank')} variant="outline">
              Open Admin Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
