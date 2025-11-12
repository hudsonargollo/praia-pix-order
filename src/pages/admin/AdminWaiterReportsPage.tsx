import { Button } from "@/components/ui/button";
import { AdminWaiterReports } from "@/components";
import { ArrowLeft, TrendingUp } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              <div className="relative">
                <img 
                  src={logo} 
                  alt="Coco Loko Açaiteria" 
                  className="h-12 sm:h-16 w-auto drop-shadow-lg"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Relatórios por Garçom
                </h1>
                <p className="text-blue-100 mt-1 text-xs sm:text-base font-medium">
                  Performance e vendas individuais • Analytics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
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