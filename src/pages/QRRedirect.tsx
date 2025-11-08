import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { validateTableId, setCurrentTableId } from "@/lib/tableContext";

/**
 * QRRedirect component handles direct QR code scans
 * Redirects directly to splash screen (QR landing)
 */
const QRRedirect = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // Store table ID if provided and valid
    if (tableId && validateTableId(tableId)) {
      setCurrentTableId(tableId);
    }

    // Always redirect to splash screen
    navigate("/qr", { replace: true });
  }, [tableId, navigate]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-ocean flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p>Redirecionando...</p>
      </div>
    </div>
  );
};

export default QRRedirect;