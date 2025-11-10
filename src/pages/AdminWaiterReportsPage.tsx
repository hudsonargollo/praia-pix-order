import { Button } from "@/components/ui/button";
import { AdminWaiterReports } from "@/components";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/coco-loko-logo.png";

const AdminWaiterReportsPage = () => {
  const navigate = useNavigate();
  
  // Check if bypass parameter is present
  const urlParams = new URLSearchParams(window.location.search);
  const bypassParam = urlParams.get('bypass');
  const bypassSuffix = bypassParam ? `?bypass=${bypassParam}` : '';

  const handleBack = () => {
    navigate(`/admin${bypassSuffix}`);
  };

  return (
    <div className="min-h-screen bg-gradient-acai">
      {/* Header */}
      <div className="bg-gradient-sunset text-white p-4 sm:p-6 shadow-medium">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img 
                src={logo} 
                alt="Coco Loko Açaiteria" 
                className="h-16 w-auto"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Relatórios por Garçom</h1>
                <p className="text-white/90 mt-1 text-sm sm:text-base">Performance e vendas individuais</p>
              </div>
            </div>
            <Button
              onClick={handleBack}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <AdminWaiterReports />
        </div>
      </div>
    </div>
  );
};

export default AdminWaiterReportsPage;