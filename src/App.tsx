import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/lib/cartContext";
import { queueManager } from "@/integrations/whatsapp/queue-manager";
import LoadingFallback from "@/components/LoadingFallback";
import Index from "./pages/public/Index";

// Lazy load customer pages
const QRLanding = lazy(() => import("./pages/customer/QRLanding"));
const Menu = lazy(() => import("./pages/customer/Menu"));
const Checkout = lazy(() => import("./pages/customer/Checkout"));
const Payment = lazy(() => import("./pages/customer/Payment"));
const OrderStatus = lazy(() => import("./pages/customer/OrderStatus"));
import OrderLookup from "./pages/debug/OrderLookup";
import Cashier from "./pages/staff/Cashier";
import Waiter from "./pages/waiter/Waiter";
import WaiterDashboard from "./pages/waiter/WaiterDashboard";
import Admin from "./pages/admin/Admin";
import Auth from "./pages/public/Auth";
import NotFound from "./pages/public/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import QRRedirect from "./pages/debug/QRRedirect";
import MenuDebug from "./pages/debug/MenuDebug";
import PaymentDebug from "./pages/debug/PaymentDebug";
import PaymentTest from "./pages/debug/PaymentTest";
import WhatsAppAdmin from "./pages/admin/WhatsAppAdmin";
import Monitoring from "./pages/debug/Monitoring";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminWaiters from "./pages/admin/AdminWaiters";
import AdminWaiterReportsPage from "./pages/admin/AdminWaiterReportsPage";
import Reports from "./pages/admin/Reports";
import WaiterManagement from "./pages/waiter/WaiterManagement";
import SystemDiagnostic from "./pages/debug/SystemDiagnostic";
import WaiterDiagnostic from "./pages/waiter/WaiterDiagnostic";

const queryClient = new QueryClient();

const App = () => {
  // Initialize WhatsApp notification queue processing
  useEffect(() => {
    console.log('Starting WhatsApp notification queue auto-processing...');
    queueManager.startAutoProcessing();
    
    return () => {
      console.log('Stopping WhatsApp notification queue auto-processing...');
      queueManager.stopAutoProcessing();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
          <Route path="/qr" element={
            <Suspense fallback={<LoadingFallback />}>
              <QRLanding />
            </Suspense>
          } />
          <Route path="/menu" element={
            <Suspense fallback={<LoadingFallback />}>
              <Menu />
            </Suspense>
          } />
          <Route path="/menu-debug" element={<MenuDebug />} />
          <Route path="/payment-debug" element={<PaymentDebug />} />
          <Route path="/payment-test" element={<PaymentTest />} />
          <Route path="/checkout" element={
            <Suspense fallback={<LoadingFallback />}>
              <Checkout />
            </Suspense>
          } />
          <Route path="/payment/:orderId" element={
            <Suspense fallback={<LoadingFallback />}>
              <Payment />
            </Suspense>
          } />
          <Route path="/order-status/:orderId" element={
            <Suspense fallback={<LoadingFallback />}>
              <OrderStatus />
            </Suspense>
          } />
          <Route path="/order/:orderId" element={
            <Suspense fallback={<LoadingFallback />}>
              <OrderStatus />
            </Suspense>
          } />
          <Route path="/order-lookup" element={<OrderLookup />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/waiter" element={<Waiter />} />
          <Route
            path="/waiter-dashboard"
            element={
              <ProtectedRoute requiredRole="waiter">
                <WaiterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute requiredRole="kitchen">
                <Cashier />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cashier"
            element={
              <ProtectedRoute requiredRole="cashier">
                <Cashier />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute requiredRole="admin">
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/whatsapp-admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <WhatsAppAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/monitoring"
            element={
              <ProtectedRoute requiredRole="admin">
                <Monitoring />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/waiter-management"
            element={
              <ProtectedRoute requiredRole="admin">
                <WaiterManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/waiters"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminWaiters />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/waiter-reports"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminWaiterReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-waiters"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminWaiters />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diagnostic"
            element={
              <ProtectedRoute requiredRole="admin">
                <SystemDiagnostic />
              </ProtectedRoute>
            }
          />
          <Route
            path="/waiter-diagnostic"
            element={
              <ProtectedRoute requiredRole="waiter">
                <WaiterDiagnostic />
              </ProtectedRoute>
            }
          />
          {/* QR Code direct access route - must be last before catch-all */}
          <Route path="/:tableId" element={<QRRedirect />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
  );
};

export default App;
