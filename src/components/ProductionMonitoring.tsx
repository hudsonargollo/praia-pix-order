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
      newAlerts.push('WhatsApp não está conectado');
    }

    // Check delivery rate
    if (stats && stats.deliveryRate < 90 && stats.totalNotifications > 10) {
      newAlerts.push(`Taxa de entrega baixa: ${stats.deliveryRate.toFixed(1)}%`);
    }

    // Check for high error rate
    if (stats && stats.failedNotifications > stats.successfulNotifications * 0.1) {
      newAlerts.push('Alta taxa de erro detectada');
    }

    // Check environment configuration
    if (!health.environment.hasWhatsAppKey) {
      newAlerts.push('Chave de criptografia do WhatsApp não configurada');
    }

    setAlerts(newAlerts);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Activity className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando dados de monitoramento...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Alertas Detectados</AlertTitle>
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
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Activity className="h-5 w-5 text-blue-600" />
            Saúde do Sistema
          </CardTitle>
          <CardDescription className="text-gray-600">Status geral do sistema e saúde dos serviços</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Status Geral</span>
              <Badge variant={
                healthStatus?.status === 'healthy' ? 'default' :
                healthStatus?.status === 'degraded' ? 'secondary' : 'destructive'
              } className={
                healthStatus?.status === 'healthy' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                healthStatus?.status === 'degraded' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' : 
                'bg-red-100 text-red-800 hover:bg-red-100'
              }>
                {healthStatus?.status === 'healthy' && <CheckCircle className="h-3 w-3 mr-1" />}
                {healthStatus?.status === 'degraded' && <AlertTriangle className="h-3 w-3 mr-1" />}
                {healthStatus?.status === 'unhealthy' && <AlertCircle className="h-3 w-3 mr-1" />}
                {healthStatus?.status === 'healthy' ? 'Saudável' : 
                 healthStatus?.status === 'degraded' ? 'Degradado' : 
                 healthStatus?.status === 'unhealthy' ? 'Não Saudável' : 'Desconhecido'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Conexão WhatsApp</span>
              <Badge variant={
                healthStatus?.services.whatsapp?.status === 'connected' ? 'default' : 'secondary'
              } className={
                healthStatus?.services.whatsapp?.status === 'connected' ? 
                'bg-green-100 text-green-800 hover:bg-green-100' : 
                'bg-orange-100 text-orange-800 hover:bg-orange-100'
              }>
                {healthStatus?.services.whatsapp?.status === 'connected' ? 'conectado' : 'desconectado'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Funções Cloudflare</span>
              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Operacional
              </Badge>
            </div>

            {healthStatus?.services.whatsapp?.lastConnected && (
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Última Conexão</span>
                <span>{new Date(healthStatus.services.whatsapp.lastConnected).toLocaleString('pt-BR')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Statistics */}
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Estatísticas de Notificações (24h)
          </CardTitle>
          <CardDescription className="text-gray-600">Métricas de performance das últimas 24 horas</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="space-y-2 text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Enviado</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats?.totalNotifications || 0}</p>
            </div>

            <div className="space-y-2 text-center p-3 sm:p-4 bg-green-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Bem-sucedidas</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats?.successfulNotifications || 0}</p>
            </div>

            <div className="space-y-2 text-center p-3 sm:p-4 bg-red-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Falharam</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats?.failedNotifications || 0}</p>
            </div>

            <div className="space-y-2 text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Taxa de Entrega</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600">{stats?.deliveryRate.toFixed(1) || 0}%</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-2 font-medium">
                <Clock className="h-4 w-4" />
                Tempo Médio de Resposta
              </span>
              <span className="font-bold text-lg text-gray-800">{stats?.avgResponseTime.toFixed(2) || 0}s</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      {stats && stats.recentErrors.length > 0 && (
        <Card className="border-red-200 shadow-md">
          <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Erros Recentes
            </CardTitle>
            <CardDescription className="text-gray-600">Últimos 10 erros das últimas 24 horas</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {stats.recentErrors.map((error) => (
                <div key={error.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-3 sm:p-4 bg-red-50 border border-red-100 rounded-lg gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-red-800">{error.error_type}</p>
                    <p className="text-xs sm:text-sm text-red-600 mt-1 break-words">{error.error_message}</p>
                  </div>
                  <span className="text-xs text-red-500 font-medium sm:whitespace-nowrap sm:ml-4">
                    {new Date(error.created_at).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
          <CardTitle className="text-gray-800">Ações de Monitoramento</CardTitle>
          <CardDescription className="text-gray-600">Ações manuais de monitoramento e manutenção</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Button 
              onClick={loadMonitoringData} 
              variant="outline" 
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Activity className="h-4 w-4 mr-2" />
              Atualizar Dados
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
