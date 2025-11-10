import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/lib/cartContext";
import Index from "./pages/Index";
import QRLanding from "./pages/QRLanding";
import Menu from "./pages/Menu";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import OrderStatus from "./pages/OrderStatus";
import OrderLookup from "./pages/OrderLookup";
import Cashier from "./pages/Cashier";
import Reports from "./pages/Reports";
import Waiter from "./pages/Waiter";
import WaiterDashboard from "./pages/WaiterDashboard";
import Admin from "./pages/Admin"; // Assuming a generic Admin page for now
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import QRRedirect from "./pages/QRRedirect";
import MenuDebug from "./pages/MenuDebug";
import PaymentDebug from "./pages/PaymentDebug";
import PaymentTest from "./pages/PaymentTest";
import WhatsAppAdmin from "./pages/WhatsAppAdmin";
import Monitoring from "./pages/Monitoring";
import AdminProducts from "./pages/AdminProducts";
import AdminWaiters from "./pages/AdminWaiters";
import AdminWaiterReportsPage from "./pages/AdminWaiterReportsPage";
import SystemDiagnostic from "./pages/SystemDiagnostic";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/qr" element={<QRLanding />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/menu-debug" element={<MenuDebug />} />
          <Route path="/payment-debug" element={<PaymentDebug />} />
          <Route path="/payment-test" element={<PaymentTest />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/:orderId" element={<Payment />} />
          <Route path="/order-status/:orderId" element={<OrderStatus />} />
          <Route path="/order/:orderId" element={<OrderStatus />} />
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

export default App;
