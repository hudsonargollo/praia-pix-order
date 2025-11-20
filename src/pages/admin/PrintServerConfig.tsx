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

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadInstallScript = () => {
    const content = `@echo off
REM Coco Loko Print Server - Windows Service Installer

echo.
echo ========================================
echo   Coco Loko Print Server
echo   Windows Service Installer
echo ========================================
echo.

REM Check for administrator privileges
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: This script requires administrator privileges!
    echo.
    echo Please right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo Running with administrator privileges...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo Then run this script again.
    echo.
    pause
    exit /b 1
)

echo Node.js found: 
node --version
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    echo This may take a few minutes...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERROR: Failed to install dependencies!
        echo.
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed successfully!
    echo.
)

echo Installing Windows service...
echo This may take a few moments...
echo.

REM Install the service
node install-service.js

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo The print server is now installed as a Windows service.
echo It will start automatically when Windows starts.
echo.
echo To manage the service:
echo   1. Press Win+R
echo   2. Type: services.msc
echo   3. Find "Coco Loko Print Server"
echo   4. Right-click to Stop, Start, or Restart
echo.
echo To uninstall the service:
echo   Run: uninstall-windows-service.bat
echo.
pause`;
    
    downloadFile('install-windows-service.bat', content);
    toast.success('Script de instalação baixado!');
  };

  const downloadStartScript = () => {
    const content = `@echo off
REM Coco Loko Print Server - Windows Startup Script

echo.
echo ========================================
echo   Coco Loko Print Server
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo Node.js found: 
node --version
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    echo This may take a few minutes...
    echo.
    call npm install
    echo.
)

echo Starting print server...
echo.
echo The server will run at: http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

REM Start the server
node server.js

pause`;
    
    downloadFile('start-server.bat', content);
    toast.success('Script de inicialização baixado!');
  };

  const downloadGuide = () => {
    const content = `# Guia de Instalação - Servidor de Impressão (Windows)

## Requisitos

- Windows 10 ou 11
- Node.js 16 ou superior (baixe em: https://nodejs.org)
- Impressora Térmica USB (compatível com ESC/POS)
- Privilégios de Administrador

## Passo 1: Instalar Node.js

1. Acesse https://nodejs.org
2. Baixe a versão LTS (recomendada)
3. Execute o instalador
4. Reinicie o computador

## Passo 2: Baixar Arquivos do Servidor

1. Baixe todos os arquivos do servidor de impressão
2. Coloque em uma pasta permanente: C:\\CocoLoko\\print-server\\

Arquivos necessários:
- server.js
- package.json
- install-service.js
- install-windows-service.bat (já baixado)
- start-server.bat (já baixado)

## Passo 3: Conectar a Impressora

1. Conecte a impressora térmica via USB
2. Ligue a impressora
3. Aguarde o Windows reconhecer

## Passo 4: Instalar como Serviço

1. Clique com botão direito em install-windows-service.bat
2. Selecione "Executar como administrador"
3. Aguarde a instalação

## Passo 5: Testar

1. Abra o navegador
2. Acesse: http://localhost:3001/health
3. Deve mostrar: "status": "ok"

## Gerenciar o Serviço

Abrir Serviços do Windows:
1. Pressione Win + R
2. Digite: services.msc
3. Procure "Coco Loko Print Server"

## Solução de Problemas

### Servidor não inicia
- Verifique se Node.js está instalado
- Execute como administrador
- Verifique se a porta 3001 não está em uso

### Impressora não detectada
- Verifique conexão USB
- Certifique-se que está ligada
- Tente outra porta USB
- Reinicie o serviço

Para mais informações, acesse o repositório do projeto.`;
    
    downloadFile('GUIA_INSTALACAO.txt', content);
    toast.success('Guia de instalação baixado!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <UniformHeader
        title="Configuração de Impressão"
        onBack={() => navigate('/admin')}
      />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Quick Download Card */}
          <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-purple-600" />
                Download Rápido
              </CardTitle>
              <CardDescription>
                Baixe os arquivos necessários para instalar o servidor de impressão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  onClick={downloadInstallScript} 
                  variant="outline"
                  className="h-auto py-4 flex-col items-start bg-white hover:bg-purple-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Download className="h-4 w-4" />
                    <span className="font-semibold">Script de Instalação</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    install-windows-service.bat
                  </span>
                </Button>
                
                <Button 
                  onClick={downloadStartScript} 
                  variant="outline"
                  className="h-auto py-4 flex-col items-start bg-white hover:bg-purple-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <PlayCircle className="h-4 w-4" />
                    <span className="font-semibold">Script de Teste</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    start-server.bat
                  </span>
                </Button>
                
                <Button 
                  onClick={downloadGuide} 
                  variant="outline"
                  className="h-auto py-4 flex-col items-start bg-white hover:bg-purple-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Download className="h-4 w-4" />
                    <span className="font-semibold">Guia de Instalação</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    GUIA_INSTALACAO.txt
                  </span>
                </Button>
                
                <Button 
                  onClick={() => window.open('https://github.com/hudsonargollo/praia-pix-order/tree/main/print-server', '_blank')}
                  variant="outline"
                  className="h-auto py-4 flex-col items-start bg-white hover:bg-purple-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Download className="h-4 w-4" />
                    <span className="font-semibold">Arquivos Completos</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    GitHub Repository
                  </span>
                </Button>
              </div>
              
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Importante:</strong> Além dos scripts acima, você precisará baixar os arquivos server.js, package.json e install-service.js do{' '}
                  <a 
                    href="https://github.com/hudsonargollo/praia-pix-order/tree/main/print-server" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline font-semibold"
                  >
                    repositório GitHub
                  </a>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          
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
                  <div className="flex-1">
                    <p className="font-medium mb-2">Baixe os Arquivos de Instalação</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Baixe os scripts necessários para instalar o servidor
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        onClick={downloadInstallScript} 
                        variant="outline" 
                        size="sm"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        install-windows-service.bat
                      </Button>
                      <Button 
                        onClick={downloadStartScript} 
                        variant="outline" 
                        size="sm"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        start-server.bat
                      </Button>
                      <Button 
                        onClick={downloadGuide} 
                        variant="outline" 
                        size="sm"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Guia Completo
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Nota: Você também precisará dos arquivos server.js, package.json e install-service.js do repositório
                    </p>
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
