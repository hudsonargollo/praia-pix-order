import { ProductionMonitoring } from '@/components/ProductionMonitoring';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Monitoring() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-800">Monitoramento de Produção</h1>
            <p className="text-gray-600">
              Monitoramento em tempo real e status de saúde para notificações WhatsApp
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)} className="hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <ProductionMonitoring />
      </div>
    </div>
  );
}
