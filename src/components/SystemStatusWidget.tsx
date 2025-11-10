import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Calendar,
  RefreshCw,
  Eye,
  Activity,
  Target,
  Award
} from 'lucide-react';
import { toast } from 'sonner';

interface BusinessAnalytics {
  total_revenue: number;
  total_orders: number;
  paid_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  unique_customers: number;
  avg_order_value: number;
  orders_today: number;
  revenue_today: number;
}

interface CustomerAnalytics {
  total_customers: number;
  new_customers_today: number;
  new_customers_this_week: number;
  new_customers_this_month: number;
  repeat_customers: number;
  top_customers: Array<{
    name: string;
    whatsapp: string;
    total_orders: number;
    total_spent: number;
  }>;
}

interface SystemStatusWidgetProps {
  className?: string;
  showDetails?: boolean;
}

export function SystemStatusWidget({ className = "", showDetails = false }: SystemStatusWidgetProps) {
  const [businessData, setBusinessData] = useState<BusinessAnalytics | null>(null);
  const [customerData, setCustomerData] = useState<CustomerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadAnalytics();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadAnalytics, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Load business analytics (last 30 days)
      const { data: businessResult, error: businessError } = await supabase
        .rpc('get_business_analytics', { days_back: 30 });

      if (businessError) throw businessError;

      // Load customer analytics
      const { data: customerResult, error: customerError } = await supabase
        .rpc('get_customer_analytics');

      if (customerError) throw customerError;

      setBusinessData(businessResult);
      setCustomerData(customerResult);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Erro ao carregar dados do sistema');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getSuccessRate = () => {
    if (!businessData || businessData.total_orders === 0) return 0;
    return ((businessData.paid_orders / businessData.total_orders) * 100);
  };

  const getRepeatCustomerRate = () => {
    if (!customerData || customerData.total_customers === 0) return 0;
    return ((customerData.repeat_customers / customerData.total_customers) * 100);
  };

  if (loading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Activity className="h-6 w-6 animate-spin text-purple-600" />
            <span className="ml-2 text-purple-600">Carregando dados...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!showDetails) {
    // Compact widget view
    return (
      <Card className={`${className} bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 text-white border-0 shadow-2xl overflow-hidden`}>
        <CardContent className="p-6 relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-blue-400/20"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          
          <div className="relative grid grid-cols-2 gap-6">
            {/* Revenue Today */}
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-1">
                {formatCurrency(businessData?.revenue_today || 0)}
              </div>
              <div className="text-sm text-purple-100 font-medium">Receita Hoje</div>
            </div>

            {/* Success Rate */}
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-blue-400 mb-1">
                {getSuccessRate().toFixed(1)}%
              </div>
              <div className="text-sm text-purple-100 font-medium">Taxa Sucesso</div>
            </div>

            {/* Orders Today */}
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-purple-400 mb-1">
                {businessData?.orders_today || 0}
              </div>
              <div className="text-sm text-purple-100 font-medium">Pedidos Hoje</div>
            </div>

            {/* Unique Customers */}
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-orange-400 mb-1">
                {customerData?.total_customers || 0}
              </div>
              <div className="text-sm text-purple-100 font-medium">Clientes Únicos</div>
            </div>
          </div>

          {/* Last updated */}
          <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-xs text-purple-200">
            <span>Atualizado: {lastUpdated.toLocaleTimeString('pt-BR')}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadAnalytics}
              className="text-white hover:bg-white/10 h-6 px-2"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detailed view
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Revenue Card */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                30 dias
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-bold text-green-700">
                {formatCurrency(businessData?.total_revenue || 0)}
              </p>
              <p className="text-sm text-green-600 font-medium">Receita Total</p>
              <p className="text-xs text-green-500">
                Hoje: {formatCurrency(businessData?.revenue_today || 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Orders Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {businessData?.paid_orders || 0} pagos
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-bold text-blue-700">
                {businessData?.total_orders || 0}
              </p>
              <p className="text-sm text-blue-600 font-medium">Pedidos Total</p>
              <p className="text-xs text-blue-500">
                Hoje: {businessData?.orders_today || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Customers Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {customerData?.repeat_customers || 0} fiéis
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-bold text-purple-700">
                {customerData?.total_customers || 0}
              </p>
              <p className="text-sm text-purple-600 font-medium">Clientes Únicos</p>
              <p className="text-xs text-purple-500">
                Novos hoje: {customerData?.new_customers_today || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                Média
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-bold text-orange-700">
                {formatCurrency(businessData?.avg_order_value || 0)}
              </p>
              <p className="text-sm text-orange-600 font-medium">Ticket Médio</p>
              <p className="text-xs text-orange-500">
                Taxa sucesso: {getSuccessRate().toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Performance */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Performance do Negócio
            </CardTitle>
            <CardDescription>Métricas de conversão e eficiência</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-700">Taxa de Conversão</span>
              <span className="text-lg font-bold text-green-600">{getSuccessRate().toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-700">Pedidos Pendentes</span>
              <span className="text-lg font-bold text-blue-600">{businessData?.pending_orders || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-700">Taxa Clientes Fiéis</span>
              <span className="text-lg font-bold text-purple-600">{getRepeatCustomerRate().toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              Top Clientes
            </CardTitle>
            <CardDescription>Maiores compradores do período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customerData?.top_customers?.slice(0, 5).map((customer, index) => (
                <div key={customer.whatsapp} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.total_orders} pedidos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatCurrency(customer.total_spent)}</p>
                  </div>
                </div>
              )) || (
                <p className="text-center text-gray-500 py-4">Nenhum cliente encontrado</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Metrics */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Crescimento de Clientes
          </CardTitle>
          <CardDescription>Novos clientes por período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{customerData?.new_customers_today || 0}</p>
              <p className="text-sm text-green-700 font-medium">Hoje</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{customerData?.new_customers_this_week || 0}</p>
              <p className="text-sm text-blue-700 font-medium">Esta Semana</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{customerData?.new_customers_this_month || 0}</p>
              <p className="text-sm text-purple-700 font-medium">Este Mês</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Última atualização</p>
              <p className="text-sm text-gray-500">{lastUpdated.toLocaleString('pt-BR')}</p>
            </div>
            <Button onClick={loadAnalytics} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar Dados
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}