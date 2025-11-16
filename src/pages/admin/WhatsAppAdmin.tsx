import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  CheckCircle, 
  Clock,
  RefreshCw,
  AlertTriangle,
  Activity,
  XCircle,
  Smartphone,
  Wifi,
  WifiOff,
  MessageCircle,
  Users,
  TrendingUp,
  Send,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { UniformHeader } from '@/components/UniformHeader';
import { WhatsAppErrorLogViewer } from '@/components/WhatsAppErrorLogViewer';

interface ConnectionInfo {
  phoneNumber?: string;
  connectedAt?: string;
  profileName?: string;
}

interface WhatsAppStats {
  totalSent: number;
  totalFailed: number;
  totalPending: number;
  deliveryRate: number;
  lastActivity?: string;
}

export default function WhatsAppAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // WhatsApp connection state
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [stats, setStats] = useState<WhatsAppStats>({
    totalSent: 0,
    totalFailed: 0,
    totalPending: 0,
    deliveryRate: 0
  });

  useEffect(() => {
    checkConnectionStatus();
    loadStats();
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      checkConnectionStatus();
      loadStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/connection?action=status');
      const data = await response.json();
      
      if (data.isConnected) {
        setConnectionStatus('connected');
        setConnectionInfo({
          phoneNumber: data.phoneNumber,
          connectedAt: data.lastConnected,
          profileName: data.profileName
        });
      } else {
        setConnectionStatus('disconnected');
        setConnectionInfo(null);
      }
    } catch (error) {
      console.error('Failed to check connection status:', error);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Mock stats for now - replace with actual API call
      setStats({
        totalSent: 127,
        totalFailed: 3,
        totalPending: 0,
        deliveryRate: 97.7,
        lastActivity: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleConnectWhatsApp = async () => {
    setShowConnectionDialog(true);
    setConnectionStatus('connecting');
    setQrCode(null);

    try {
      // First check if already connected
      const statusResponse = await fetch('/api/whatsapp/connection?action=status');
      const statusData = await statusResponse.json();

      if (statusData.isConnected) {
        setConnectionStatus('connected');
        setConnectionInfo({
          phoneNumber: statusData.phoneNumber,
          connectedAt: statusData.lastConnected,
          profileName: statusData.profileName
        });
        toast.success('WhatsApp já está conectado!');
        setShowConnectionDialog(false);
        return;
      }

      // Try to get QR code directly first
      const qrResponse = await fetch('/api/whatsapp/qr-code');
      const qrData = await qrResponse.json();

      if (qrData.success && qrData.qrCode) {
        console.log('QR Code received:', qrData.qrCode.length > 50 ? qrData.qrCode.substring(0, 50) + '...' : qrData.qrCode);
        // Ensure QR code has proper data URL prefix
        const qrCodeData = qrData.qrCode.startsWith('data:') 
          ? qrData.qrCode 
          : `data:image/png;base64,${qrData.qrCode}`;
        setQrCode(qrCodeData);
        pollConnectionStatus();
        return;
      }

      // Try restart if QR code generation failed
      const restartResponse = await fetch('/api/whatsapp/connection?action=restart', {
        method: 'POST'
      });

      if (restartResponse.ok) {
        const restartData = await restartResponse.json();
        if (restartData.qrCode) {
          console.log('QR Code from restart:', restartData.qrCode.length > 50 ? restartData.qrCode.substring(0, 50) + '...' : restartData.qrCode);
          const qrCodeData = restartData.qrCode.startsWith('data:') 
            ? restartData.qrCode 
            : `data:image/png;base64,${restartData.qrCode}`;
          setQrCode(qrCodeData);
          pollConnectionStatus();
          return;
        }
      }

      // Fallback to connect action
      const response = await fetch('/api/whatsapp/connection?action=connect');
      const data = await response.json();

      if (data.qrCode) {
        console.log('QR Code from connect:', data.qrCode.length > 50 ? data.qrCode.substring(0, 50) + '...' : data.qrCode);
        const qrCodeData = data.qrCode.startsWith('data:') 
          ? data.qrCode 
          : `data:image/png;base64,${data.qrCode}`;
        setQrCode(qrCodeData);
        pollConnectionStatus();
      } else if (data.isConnected) {
        setConnectionStatus('connected');
        setConnectionInfo({
          phoneNumber: data.phoneNumber,
          connectedAt: data.lastConnected,
          profileName: data.profileName
        });
        toast.success('WhatsApp conectado com sucesso!');
        setShowConnectionDialog(false);
      } else {
        // Start polling for QR code if not immediately available
        toast.info('Gerando QR code... Aguarde alguns segundos.');
        pollForQrCode();
      }
    } catch (error) {
      console.error('Failed to connect WhatsApp:', error);
      toast.error('Erro ao conectar WhatsApp. Verifique a conexão com a API.');
      setConnectionStatus('disconnected');
    }
  };

  const pollConnectionStatus = () => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/whatsapp/connection?action=status');
        const data = await response.json();

        if (data.isConnected) {
          setConnectionStatus('connected');
          setConnectionInfo({
            phoneNumber: data.phoneNumber,
            connectedAt: data.lastConnected,
            profileName: data.profileName
          });
          setQrCode(null);
          setShowConnectionDialog(false);
          clearInterval(pollInterval);
          toast.success('WhatsApp conectado com sucesso!');
        }
      } catch (error) {
        console.error('Failed to poll connection status:', error);
      }
    }, 3000);

    // Stop polling after 2 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (connectionStatus === 'connecting') {
        setConnectionStatus('disconnected');
        toast.error('Tempo limite para conexão excedido');
      }
    }, 120000);
  };

  const pollForQrCode = () => {
    const qrPollInterval = setInterval(async () => {
      try {
        // Try the dedicated QR code endpoint first
        const qrResponse = await fetch('/api/whatsapp/qr-code');
        const qrData = await qrResponse.json();

        if (qrData.success && qrData.qrCode) {
          console.log('QR Code from polling:', qrData.qrCode.length > 50 ? qrData.qrCode.substring(0, 50) + '...' : qrData.qrCode);
          const qrCodeData = qrData.qrCode.startsWith('data:') 
            ? qrData.qrCode 
            : `data:image/png;base64,${qrData.qrCode}`;
          setQrCode(qrCodeData);
          clearInterval(qrPollInterval);
          pollConnectionStatus();
          return;
        }

        // Fallback to connection endpoint
        const response = await fetch('/api/whatsapp/connection?action=connect');
        const data = await response.json();

        if (data.qrCode) {
          console.log('QR Code from polling fallback:', data.qrCode.length > 50 ? data.qrCode.substring(0, 50) + '...' : data.qrCode);
          const qrCodeData = data.qrCode.startsWith('data:') 
            ? data.qrCode 
            : `data:image/png;base64,${data.qrCode}`;
          setQrCode(qrCodeData);
          clearInterval(qrPollInterval);
          pollConnectionStatus();
        } else if (data.isConnected) {
          setConnectionStatus('connected');
          setConnectionInfo({
            phoneNumber: data.phoneNumber,
            connectedAt: data.lastConnected,
            profileName: data.profileName
          });
          clearInterval(qrPollInterval);
          setShowConnectionDialog(false);
          toast.success('WhatsApp conectado com sucesso!');
        }
      } catch (error) {
        console.error('Failed to poll for QR code:', error);
      }
    }, 3000);

    // Stop polling after 45 seconds
    setTimeout(() => {
      clearInterval(qrPollInterval);
      if (!qrCode && connectionStatus === 'connecting') {
        toast.error('Não foi possível gerar QR code. Tente reiniciar a conexão.');
        setConnectionStatus('disconnected');
      }
    }, 45000);
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/whatsapp/connection?action=disconnect', {
        method: 'POST'
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

  const handleTestMessage = async () => {
    if (connectionStatus !== 'connected') {
      toast.error('WhatsApp não está conectado. Conecte primeiro para enviar mensagens.');
      return;
    }

    try {
      toast.info('Enviando mensagem de teste...');
      
      const response = await fetch('/api/whatsapp/test-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: '🥥 Teste de conexão WhatsApp - Coco Loko Açaiteria ✅\n\nSe você recebeu esta mensagem, o sistema de notificações está funcionando perfeitamente!\n\n📱 Mensagem enviada em: ' + new Date().toLocaleString('pt-BR')
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('✅ Mensagem de teste enviada com sucesso!');
        // Update stats after successful test
        loadStats();
      } else {
        console.error('Test message failed:', data);
        toast.error(`❌ Erro ao enviar mensagem: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Failed to send test message:', error);
      toast.error('❌ Erro de conexão ao enviar mensagem de teste');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Uniform Header */}
      <UniformHeader
        title="WhatsApp"
        onBack={() => navigate("/admin")}
        actions={
          connectionStatus === 'connected' ? (
            <Badge variant="default" className="bg-green-600 text-white">
              <Wifi className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Conectado</span>
            </Badge>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleConnectWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
            >
              <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Conectar</span>
            </Button>
          )
        }
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="overview">
              <Activity className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="logs">
              <FileText className="h-4 w-4 mr-2" />
              Log de Erros
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
        {/* Connection Status Alert */}
        {connectionStatus === 'disconnected' && (
          <Alert className="mb-4 border-orange-200 bg-orange-50 p-3 sm:p-4">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800 text-sm sm:text-base">WhatsApp Desconectado</AlertTitle>
            <AlertDescription className="text-orange-700 text-xs sm:text-sm">
              O WhatsApp não está conectado. Clique em "Conectar" para escanear o QR code e ativar as notificações.
            </AlertDescription>
          </Alert>
        )}

        {connectionStatus === 'connected' && connectionInfo && (
          <Alert className="mb-4 border-green-200 bg-green-50 p-3 sm:p-4">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 text-sm sm:text-base">WhatsApp Conectado</AlertTitle>
            <AlertDescription className="text-green-700 text-xs sm:text-sm">
              <div className="space-y-0.5">
                {connectionInfo.phoneNumber && <p>Tel: {connectionInfo.phoneNumber}</p>}
                {connectionInfo.connectedAt && (
                  <p className="hidden sm:block">
                    Conectado: {new Date(connectionInfo.connectedAt).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Enviadas</CardTitle>
              <Send className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.totalSent}</div>
              <p className="text-xs text-muted-foreground">
                {stats.deliveryRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Falhadas</CardTitle>
              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.totalFailed}</div>
              <p className="text-xs text-muted-foreground">
                Erros de entrega
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.totalPending}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando envio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Tempo Médio</CardTitle>
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">0s</div>
              <p className="text-xs text-muted-foreground">
                Tempo de entrega
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                Teste de Conexão
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Envie mensagem de teste
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <Button
                onClick={handleTestMessage}
                disabled={connectionStatus !== 'connected'}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Teste
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                Gerenciar Conexão
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Conectar ou desconectar
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-2">
              {connectionStatus === 'connected' ? (
                <Button
                  onClick={handleDisconnect}
                  variant="destructive"
                  className="w-full"
                >
                  <WifiOff className="h-4 w-4 mr-2" />
                  Desconectar
                </Button>
              ) : (
                <Button
                  onClick={handleConnectWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Conectar WhatsApp
                </Button>
              )}
              <Button
                onClick={checkConnectionStatus}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar Status
              </Button>
            </CardContent>
          </Card>
        </div>
          </TabsContent>

          <TabsContent value="logs">
            <WhatsAppErrorLogViewer />
          </TabsContent>
        </Tabs>

        {/* WhatsApp Connection Dialog */}
        <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Conectar WhatsApp</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Escaneie o QR code com seu WhatsApp para conectar
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center justify-center py-4 sm:py-6 space-y-3 sm:space-y-4">
              {connectionStatus === 'connecting' && qrCode ? (
                <>
                  <div className="bg-white p-3 sm:p-4 rounded-lg border-2 border-gray-200">
                    <img 
                      src={qrCode} 
                      alt="QR Code" 
                      className="w-48 h-48 sm:w-56 sm:h-56"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xs sm:text-sm font-medium">Como conectar:</p>
                    <ol className="text-xs text-gray-600 space-y-0.5 sm:space-y-1 text-left">
                      <li>1. Abra o WhatsApp no seu celular</li>
                      <li>2. Vá em <strong>Configurações</strong> → <strong>Aparelhos conectados</strong></li>
                      <li>3. Toque em <strong>Conectar aparelho</strong></li>
                      <li>4. Escaneie este QR code</li>
                    </ol>
                  </div>
                </>
              ) : connectionStatus === 'connecting' ? (
                <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                  <RefreshCw className="h-12 w-12 animate-spin text-green-600" />
                  <p className="text-sm text-gray-600">Gerando QR code...</p>
                  <p className="text-xs text-gray-500 text-center">
                    Isso pode levar alguns segundos. Aguarde...
                  </p>
                </div>
              ) : connectionStatus === 'connected' ? (
                <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                  <div className="bg-green-100 p-4 rounded-full">
                    <Wifi className="h-12 w-12 text-green-600" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-semibold text-green-700">Conectado!</p>
                    {connectionInfo && (
                      <div className="text-sm text-gray-600 space-y-1">
                        {connectionInfo.profileName && <p>Perfil: {connectionInfo.profileName}</p>}
                        {connectionInfo.phoneNumber && <p>Telefone: {connectionInfo.phoneNumber}</p>}
                        {connectionInfo.connectedAt && (
                          <p>Conectado em: {new Date(connectionInfo.connectedAt).toLocaleString('pt-BR')}</p>
                        )}
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
                <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                  <div className="bg-gray-100 p-4 rounded-full">
                    <WifiOff className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">Desconectado</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}