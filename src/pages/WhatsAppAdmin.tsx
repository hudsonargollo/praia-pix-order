import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  deliveryMonitor, 
  DeliveryStats, 
  TimePeriod 
} from '@/integrations/whatsapp/delivery-monitor';
import { 
  errorLogger, 
  ErrorStats 
} from '@/integrations/whatsapp/error-logger';
import { 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  Activity,
  XCircle,
  Smartphone,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppAdmin() {
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats | null>(null);
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(TimePeriod.LAST_24_HOURS);
  
  // WhatsApp connection state
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
    checkConnectionStatus();
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData();
      checkConnectionStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/connection');
      const data = await response.json();
      
      if (data.connected) {
        setConnectionStatus('connected');
        setConnectionInfo(data);
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Failed to check connection status:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleConnectWhatsApp = async () => {
    setShowConnectionDialog(true);
    setConnectionStatus('connecting');
    setQrCode(null);

    try {
      const response = await fetch('/api/whatsapp/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' })
      });

      const data = await response.json();

      if (data.qrCode) {
        setQrCode(data.qrCode);
        // Poll for connection status
        pollConnectionStatus();
      } else if (data.connected) {
        setConnectionStatus('connected');
        setConnectionInfo(data);
        toast.success('WhatsApp já está conectado!');
      }
    } catch (error) {
      console.error('Failed to connect WhatsApp:', error);
      toast.error('Erro ao conectar WhatsApp');
      setConnectionStatus('disconnected');
    }
  };

  const pollConnectionStatus = () => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/whatsapp/connection');
        const data = await response.json();

        if (data.connected) {
          setConnectionStatus('connected');
          setConnectionInfo(data);
          setQrCode(null);
          clearInterval(pollInterval);
          toast.success('WhatsApp conectado com sucesso!');
        }
      } catch (error) {
        console.error('Failed to poll connection status:', error);
      }
    }, 2000);

    // Stop polling after 2 minutes
    setTimeout(() => clearInterval(pollInterval), 120000);
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/whatsapp/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' })
      });

      setConnectionStatus('disconnected');
      setConnectionInfo(null);
      setShowConnectionDialog(false);
      toast.success('WhatsApp desconectado');
    } catch (error) {
      console.error('Failed to disconnect WhatsApp:', error);
      toast.error('Erro ao desconectar WhatsApp');
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [delivery, errors, unresolvedAlerts, deliveryTrends] = await Promise.all([
        deliveryMonitor.getDeliveryStats(selectedPeriod),
        errorLogger.getErrorStats(getDateFromPeriod(selectedPeriod)),
        deliveryMonitor.getUnresolvedAlerts(),
        deliveryMonitor.getDeliveryTrends(7),
      ]);

      setDeliveryStats(delivery);
      setErrorStats(errors);
      setAlerts(unresolvedAlerts);
      setTrends(deliveryTrends);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await deliveryMonitor.resolveAlert(alertId);
      toast.success('Alerta resolvido');
      loadDashboardData();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      toast.error('Erro ao resolver alerta');
    }
  };

  const handleRunMonitoringCheck = async () => {
    try {
      toast.info('Executando verificação de monitoramento...');
      await deliveryMonitor.checkAndAlert();
      toast.success('Verificação concluída');
      loadDashboardData();
    } catch (error) {
      console.error('Failed to run monitoring check:', error);
      toast.error('Erro ao executar verificação');
    }
  };

  const getDateFromPeriod = (period: TimePeriod): Date => {
    const now = Date.now();
    switch (period) {
      case TimePeriod.LAST_HOUR:
        return new Date(now - 60 * 60 * 1000);
      case TimePeriod.LAST_24_HOURS:
        return new Date(now - 24 * 60 * 60 * 1000);
      case TimePeriod.LAST_7_DAYS:
        return new Date(now - 7 * 24 * 60 * 60 * 1000);
      case TimePeriod.LAST_30_DAYS:
        return new Date(now - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now - 24 * 60 * 60 * 1000);
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (loading && !deliveryStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">WhatsApp Admin</h1>
            <p className="text-gray-600 mt-1">Monitoramento e gerenciamento de notificações</p>
          </div>
          <div className="flex gap-2">
            {connectionStatus === 'connected' ? (
              <Button
                variant="outline"
                size="sm"
                className="border-green-500 text-green-700"
              >
                <Wifi className="h-4 w-4 mr-2" />
                Conectado
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleConnectWhatsApp}
                className="bg-green-600 hover:bg-green-700"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Conectar WhatsApp
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleRunMonitoringCheck}
            >
              <Activity className="h-4 w-4 mr-2" />
              Verificar Agora
            </Button>
          </div>
        </div>

        {/* WhatsApp Connection Dialog */}
        <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Conectar WhatsApp</DialogTitle>
              <DialogDescription>
                Escaneie o QR code com seu WhatsApp para conectar
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              {connectionStatus === 'connecting' && qrCode ? (
                <>
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <img 
                      src={qrCode} 
                      alt="QR Code" 
                      className="w-64 h-64"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium">Como conectar:</p>
                    <ol className="text-xs text-gray-600 space-y-1 text-left">
                      <li>1. Abra o WhatsApp no seu celular</li>
                      <li>2. Vá em <strong>Configurações</strong> → <strong>Aparelhos conectados</strong></li>
                      <li>3. Toque em <strong>Conectar um aparelho</strong></li>
                      <li>4. Escaneie este QR code</li>
                    </ol>
                  </div>
                </>
              ) : connectionStatus === 'connecting' ? (
                <div className="flex flex-col items-center space-y-4">
                  <RefreshCw className="h-12 w-12 animate-spin text-blue-600" />
                  <p className="text-sm text-gray-600">Gerando QR code...</p>
                </div>
              ) : connectionStatus === 'connected' ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-green-100 p-4 rounded-full">
                    <Wifi className="h-12 w-12 text-green-600" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-semibold text-green-700">Conectado!</p>
                    {connectionInfo && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Telefone: {connectionInfo.phoneNumber}</p>
                        <p>Conectado em: {new Date(connectionInfo.connectedAt).toLocaleString('pt-BR')}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDisconnect}
                    className="mt-4"
                  >
                    <WifiOff className="h-4 w-4 mr-2" />
                    Desconectar
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-gray-100 p-4 rounded-full">
                    <WifiOff className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">Desconectado</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Period Selector */}
        <div className="flex gap-2">
          {Object.values(TimePeriod).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period === TimePeriod.LAST_HOUR && 'Última Hora'}
              {period === TimePeriod.LAST_24_HOURS && 'Últimas 24h'}
              {period === TimePeriod.LAST_7_DAYS && 'Últimos 7 dias'}
              {period === TimePeriod.LAST_30_DAYS && 'Últimos 30 dias'}
            </Button>
          ))}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Alertas Ativos ({alerts.length})</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-2">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between bg-white/10 p-2 rounded">
                    <span className="text-sm">{alert.message}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleResolveAlert(alert.id)}
                    >
                      Resolver
                    </Button>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliveryStats?.totalSent || 0}</div>
              <p className="text-xs text-muted-foreground">
                Taxa de entrega: {deliveryStats?.deliveryRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensagens Falhadas</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliveryStats?.totalFailed || 0}</div>
              <p className="text-xs text-muted-foreground">
                Taxa de falha: {deliveryStats?.failureRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliveryStats?.totalPending || 0}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando envio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(deliveryStats?.averageDeliveryTime || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Tempo de entrega
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="deliveries" className="space-y-4">
          <TabsList>
            <TabsTrigger value="deliveries">Entregas Recentes</TabsTrigger>
            <TabsTrigger value="errors">Erros</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
          </TabsList>

          <TabsContent value="deliveries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Entregas Recentes</CardTitle>
                <CardDescription>Últimas 20 notificações processadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {deliveryStats?.recentDeliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            delivery.status === 'sent' ? 'default' :
                            delivery.status === 'failed' ? 'destructive' :
                            'secondary'
                          }>
                            {delivery.status}
                          </Badge>
                          <span className="text-sm font-medium">{delivery.notificationType}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Pedido: {delivery.orderId.slice(0, 8)}... | 
                          Telefone: {delivery.customerPhone}
                        </p>
                        {delivery.errorMessage && (
                          <p className="text-xs text-red-600 mt-1">{delivery.errorMessage}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {delivery.createdAt.toLocaleTimeString('pt-BR')}
                        </p>
                        {delivery.deliveryTime && (
                          <p className="text-xs text-gray-500">
                            {formatDuration(delivery.deliveryTime)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Erros</CardTitle>
                <CardDescription>
                  Total: {errorStats?.totalErrors || 0} erros | 
                  Taxa: {errorStats?.errorRate.toFixed(1)} erros/hora
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Errors by Category */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Por Categoria</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(errorStats?.errorsByCategory || {}).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{category}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Errors */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Erros Recentes</h3>
                    <div className="space-y-2">
                      {errorStats?.recentErrors.map((error) => (
                        <div key={error.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getSeverityColor(error.severity) as any}>
                              {error.severity}
                            </Badge>
                            <Badge variant="outline">{error.category}</Badge>
                          </div>
                          <p className="text-sm text-gray-900">{error.errorMessage}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {error.timestamp.toLocaleString('pt-BR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendências de Entrega</CardTitle>
                <CardDescription>Últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {trends.map((trend) => (
                    <div key={trend.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(trend.date).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-600">
                          {trend.sent} enviadas | {trend.failed} falhadas
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {trend.deliveryRate.toFixed(1)}%
                        </span>
                        {trend.deliveryRate >= 90 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
