import { AdminWaiterReports } from "@/components";
import { useNavigate } from "react-router-dom";
import { UniformHeader } from "@/components/UniformHeader";

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
      {/* Uniform Header */}
      <UniformHeader
        title="Garçons"
        onBack={() => navigate("/admin")}
      />

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