import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, AlertCircle, Info, XCircle, RefreshCw, Filter, Eye } from 'lucide-react';
import { useAllWhatsAppErrors, type WhatsAppError } from '@/hooks/useWhatsAppErrors';
import { formatPhoneNumber } from '@/lib/phoneUtils';

const severityConfig = {
  critical: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Crítico' },
  high: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Alto' },
  medium: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Médio' },
  low: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Baixo' },
};

const categoryLabels: Record<string, string> = {
  connection: 'Conexão',
  authentication: 'Autenticação',
  message_delivery: 'Entrega de Mensagem',
  phone_validation: 'Validação de Telefone',
  rate_limit: 'Limite de Taxa',
  network: 'Rede',
  database: 'Banco de Dados',
  configuration: 'Configuração',
  unknown: 'Desconhecido',
};

export function WhatsAppErrorLogViewer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const orderIdFilter = searchParams.get('orderId');
  
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [selectedError, setSelectedError] = useState<WhatsAppError | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const getSinceDate = () => {
    const now = new Date();
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  };

  const { errors, loading, refresh } = useAllWhatsAppErrors({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    severity: selectedSeverity !== 'all' ? selectedSeverity : undefined,
    since: getSinceDate(),
    limit: 100,
  });

  // Filter by order ID if provided
  const filteredErrors = orderIdFilter
    ? errors.filter(e => e.order_id === orderIdFilter)
    : errors;

  const handleViewDetails = (error: WhatsAppError) => {
    setSelectedError(error);
    setShowDetailsDialog(true);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Calculate statistics
  const stats = {
    total: filteredErrors.length,
    critical: filteredErrors.filter(e => e.severity === 'critical').length,
    high: filteredErrors.filter(e => e.severity === 'high').length,
    medium: filteredErrors.filter(e => e.severity === 'medium').length,
    low: filteredErrors.filter(e => e.severity === 'low').length,
    retryable: filteredErrors.filter(e => e.is_retryable).length,
  };

  const errorsByCategory = filteredErrors.reduce((acc, error) => {
    acc[error.category] = (acc[error.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Log de Erros WhatsApp</CardTitle>
              <CardDescription className="text-sm">
                {orderIdFilter ? 'Erros filtrados por pedido' : 'Histórico de erros e falhas'}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Última hora</SelectItem>
                <SelectItem value="24h">Últimas 24h</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="high">Alto</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="low">Baixo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {orderIdFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchParams({})}
              >
                Limpar Filtro de Pedido
              </Button>
            )}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
              <div className="text-xs text-muted-foreground">Críticos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
              <div className="text-xs text-muted-foreground">Altos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.retryable}</div>
              <div className="text-xs text-muted-foreground">Retentáveis</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error List */}
      {loading ? (
        <Card className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando erros...</p>
        </Card>
      ) : filteredErrors.length === 0 ? (
        <Card className="p-8 text-center">
          <Info className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-lg font-medium text-gray-700">Nenhum erro encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            {orderIdFilter 
              ? 'Não há erros registrados para este pedido'
              : 'Não há erros no período selecionado'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredErrors.map((error) => {
            const config = severityConfig[error.severity as keyof typeof severityConfig] || severityConfig.medium;
            const Icon = config.icon;

            return (
              <Card 
                key={error.id} 
                className={`${config.bg} ${config.border} border-l-4 hover:shadow-md transition-shadow cursor-pointer`}
                onClick={() => handleViewDetails(error)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 ${config.color} mt-0.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={config.color}>
                              {config.label}
                            </Badge>
                            <Badge variant="secondary">
                              {categoryLabels[error.category] || error.category}
                            </Badge>
                            {error.is_retryable && (
                              <Badge variant="outline" className="text-blue-600">
                                Retentável
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 mt-2">
                            {error.error_message}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(error);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{formatTimestamp(error.created_at)}</span>
                        {error.order_id && (
                          <span>Pedido: {error.context?.orderNumber || error.order_id.substring(0, 8)}</span>
                        )}
                        {error.customer_phone && (
                          <span>Tel: {formatPhoneNumber(error.customer_phone)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Error Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Erro</DialogTitle>
            <DialogDescription>
              Informações completas sobre o erro
            </DialogDescription>
          </DialogHeader>
          
          {selectedError && (
            <div className="space-y-4">
              {/* Severity and Category */}
              <div className="flex gap-2">
                <Badge variant="outline" className={severityConfig[selectedError.severity as keyof typeof severityConfig]?.color}>
                  {severityConfig[selectedError.severity as keyof typeof severityConfig]?.label || selectedError.severity}
                </Badge>
                <Badge variant="secondary">
                  {categoryLabels[selectedError.category] || selectedError.category}
                </Badge>
                {selectedError.is_retryable && (
                  <Badge variant="outline" className="text-blue-600">
                    Retentável
                  </Badge>
                )}
              </div>

              {/* Error Message */}
              <div>
                <h4 className="text-sm font-semibold mb-1">Mensagem de Erro</h4>
                <p className="text-sm bg-gray-50 p-3 rounded border">
                  {selectedError.error_message}
                </p>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">Data/Hora</h4>
                  <p className="text-muted-foreground">{formatTimestamp(selectedError.created_at)}</p>
                </div>
                {selectedError.order_id && (
                  <div>
                    <h4 className="font-semibold mb-1">ID do Pedido</h4>
                    <p className="text-muted-foreground font-mono text-xs">{selectedError.order_id}</p>
                  </div>
                )}
                {selectedError.customer_phone && (
                  <div>
                    <h4 className="font-semibold mb-1">Telefone</h4>
                    <p className="text-muted-foreground">{formatPhoneNumber(selectedError.customer_phone)}</p>
                  </div>
                )}
                {selectedError.notification_id && (
                  <div>
                    <h4 className="font-semibold mb-1">ID da Notificação</h4>
                    <p className="text-muted-foreground font-mono text-xs">{selectedError.notification_id}</p>
                  </div>
                )}
              </div>

              {/* Context */}
              {selectedError.context && Object.keys(selectedError.context).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Contexto</h4>
                  <pre className="text-xs bg-gray-50 p-3 rounded border overflow-x-auto">
                    {JSON.stringify(selectedError.context, null, 2)}
                  </pre>
                </div>
              )}

              {/* Stack Trace */}
              {selectedError.error_stack && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Stack Trace</h4>
                  <pre className="text-xs bg-gray-50 p-3 rounded border overflow-x-auto max-h-48">
                    {selectedError.error_stack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
