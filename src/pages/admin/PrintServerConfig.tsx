import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { UniformHeader } from '@/components/UniformHeader';
import { printServerClient } from '@/integrations/print-server/client';
import { 
  Printer, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Download,
  PlayCircle,
  Settings,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const PrintServerConfig = () => {
  const navigate = useNavigate();
  const [serverUrl, setServerUrl] = useState('http://localhost:3001');
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [printerStatus, setPrinterStatus] = useState<any>(null);

  useEffect(() => {
    // Load saved URL
    const saved = printServerClient.getServerUrl();
    setServerUrl(saved);
    
    // Check connection on mount
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const available = await printServerClient.checkAvailability();
      setIsConnected(available);
      
      if (available) {
        const status = await printServerClient.getStatus();
        setPrinterStatus(status);
        toast.success('Servidor de impressão conectado!');
      } else {
        setPrinterStatus(null);
        toast.error('Servidor de impressão não encontrado');
      }
    } catch (error) {
      setIsConnected(false);
      setPrinterStatus(null);
      toast.error('Erro ao conectar ao servidor');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveUrl = () => {
    printServerClient.setServerUrl(serverUrl);
    toast.success('URL salva com sucesso!');
    checkConnection();
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    try {
      const response = await fetch(`${serverUrl}/test-print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Impressão de teste enviada!');
      } else {
        const error = await response.json();
        toast.error(`Erro: ${error.message || 'Falha na impressão'}`);
      }
    } catch (error) {
      toast.error('Erro ao enviar impressão de teste');
    } finally {
      setIsTesting(false);
    }
  };

  const handleReconnect = async () => {
    try {
      const response = await fetch(`${serverUrl}/reconnect`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Impressora reconectada!');
        checkConnection();
      } else {
        toast.error('Falha ao reconectar impressora');
      }
    } catch (error) {
      toast.error('Erro ao reconectar');
    }
  };

  const downloadPrintServer = () => {
    // In a real implementation, this would download the print-server folder as a zip
    toast.info('Baixe o servidor de impressão do repositório do projeto');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <UniformHeader
        title="Configuração de Impressão"
        onBack={() => navigate('/admin')}
      />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Printer className="h-5 w-5" />
                    Status do Servidor
                  </CardTitle>
                  <CardDescription>
                    Servidor local de impressão térmica
                  </CardDescription>
                </div>
                <div>
                  {isConnected === null ? (
                    <Badge variant="outline">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Verificando...
                    </Badge>
                  ) : isConnected ? (
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Conectado
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Desconectado
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {printerStatus && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Servidor</p>
                    <p className="text-lg font-bold text-green-700">
                      {printerStatus.serverRunning ? 'Rodando' : 'Parado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Impressora</p>
                    <p className="text-lg font-bold text-green-700">
                      {printerStatus.printerConnected ? 'Conectada' : 'Desconectada'}
                    </p>
                  </div>
                  {printerStatus.printers && printerStatus.printers.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-700 mb-2">Impressoras Detectadas:</p>
                      {printerStatus.printers.map((printer: any, index: number) => (
                        <div key={index} className="text-sm text-gray-600 bg-white p-2 rounded border">
                          Vendor ID: {printer.vendorId} | Product ID: {printer.productId}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!isConnected && isConnected !== null && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Servidor de impressão não está rodando. Certifique-se de que o servidor está instalado e iniciado.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração
              </CardTitle>
              <CardDescription>
                Configure a URL do servidor de impressão local
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serverUrl">URL do Servidor</Label>
                <div className="flex gap-2">
                  <Input
                    id="serverUrl"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="http://localhost:3001"
                    className="flex-1"
                  />
                  <Button onClick={handleSaveUrl} variant="outline">
                    Salvar
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  URL padrão: http://localhost:3001
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={checkConnection} 
                  disabled={isChecking}
                  variant="outline"
                  className="flex-1"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Testar Conexão
                    </>
                  )}
                </Button>

                <Button 
                  onClick={handleTestPrint} 
                  disabled={!isConnected || isTesting}
                  className="flex-1"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Imprimindo...
                    </>
                  ) : (
                    <>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir Teste
                    </>
                  )}
                </Button>
              </div>

              {isConnected && (
                <Button 
                  onClick={handleReconnect} 
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reconectar Impressora
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Installation Guide Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Instalação do Servidor
              </CardTitle>
              <CardDescription>
                Guia rápido para instalar o servidor de impressão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  O servidor de impressão deve ser instalado em cada computador que terá uma impressora térmica conectada.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Instale o Node.js</p>
                    <p className="text-sm text-muted-foreground">
                      Baixe e instale o Node.js de{' '}
                      <a 
                        href="https://nodejs.org" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:underline"
                      >
                        nodejs.org
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Baixe o Servidor de Impressão</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Copie a pasta <code className="bg-gray-100 px-1 rounded">print-server</code> do repositório do projeto
                    </p>
                    <Button 
                      onClick={downloadPrintServer} 
                      variant="outline" 
                      size="sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Instruções de Download
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Conecte a Impressora USB</p>
                    <p className="text-sm text-muted-foreground">
                      Conecte sua impressora térmica via USB e certifique-se de que está ligada
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Instale como Serviço do Windows</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Clique com botão direito em <code className="bg-gray-100 px-1 rounded">install-windows-service.bat</code> e selecione "Executar como administrador"
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        <PlayCircle className="h-3 w-3 mr-1" />
                        Inicia automaticamente
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Roda em segundo plano
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">
                    5
                  </div>
                  <div>
                    <p className="font-medium">Teste a Conexão</p>
                    <p className="text-sm text-muted-foreground">
                      Use o botão "Testar Conexão" acima para verificar se o servidor está rodando
                    </p>
                  </div>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Dica:</strong> Para teste rápido, você pode executar <code className="bg-blue-100 px-1 rounded">start-server.bat</code> sem instalar como serviço. Porém, você precisará iniciar manualmente toda vez.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Troubleshooting Card */}
          <Card>
            <CardHeader>
              <CardTitle>Solução de Problemas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium text-sm">Servidor não conecta</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-1">
                  <li>Verifique se o Node.js está instalado</li>
                  <li>Certifique-se de que o serviço está rodando (services.msc)</li>
                  <li>Verifique se a porta 3001 não está em uso</li>
                  <li>Tente reiniciar o serviço</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-sm">Impressora não detectada</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-1">
                  <li>Verifique a conexão USB</li>
                  <li>Certifique-se de que a impressora está ligada</li>
                  <li>Tente uma porta USB diferente</li>
                  <li>Use o botão "Reconectar Impressora"</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-sm">Impressão não funciona</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-1">
                  <li>Verifique se há papel na impressora</li>
                  <li>Teste com "Imprimir Teste"</li>
                  <li>Reconecte a impressora</li>
                  <li>Reinicie o serviço do Windows</li>
                </ul>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default PrintServerConfig;
