import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/lib/cartContext";
import { queueManager } from "@/integrations/whatsapp/queue-manager";
import LoadingFallback from "@/components/LoadingFallback";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load customer pages
const QRLanding = lazy(() => import("./pages/customer/QRLanding"));
const Menu = lazy(() => import("./pages/customer/Menu"));
const Checkout = lazy(() => import("./pages/customer/Checkout"));
const CheckoutLegacy = lazy(() => import("./pages/customer/CheckoutLegacy"));
const Payment = lazy(() => import("./pages/customer/Payment"));
const OrderStatus = lazy(() => import("./pages/customer/OrderStatus"));

// Lazy load admin pages
const Admin = lazy(() => import("./pages/admin/Admin"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminWaiterReportsPage = lazy(() => import("./pages/admin/AdminWaiterReportsPage"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const WhatsAppAdmin = lazy(() => import("./pages/admin/WhatsAppAdmin"));

// Lazy load staff pages
const Cashier = lazy(() => import("./pages/staff/Cashier"));

// Lazy load waiter pages
const Waiter = lazy(() => import("./pages/waiter/Waiter"));
const WaiterDashboard = lazy(() => import("./pages/waiter/WaiterDashboard"));
const WaiterSetup = lazy(() => import("./pages/waiter/WaiterSetup"));
const WaiterManagement = lazy(() => import("./pages/waiter/WaiterManagement"));
const WaiterDiagnostic = lazy(() => import("./pages/waiter/WaiterDiagnostic"));

// Lazy load public pages
const Index = lazy(() => import("./pages/public/Index"));
const Auth = lazy(() => import("./pages/public/Auth"));
const NotFound = lazy(() => import("./pages/public/NotFound"));

// Lazy load debug pages
const OrderLookup = lazy(() => import("./pages/debug/OrderLookup"));
const QRRedirect = lazy(() => import("./pages/debug/QRRedirect"));
const MenuDebug = lazy(() => import("./pages/debug/MenuDebug"));
const PaymentDebug = lazy(() => import("./pages/debug/PaymentDebug"));
const CreditCardDebug = lazy(() => import("./pages/debug/CreditCardDebug"));
const CardPaymentTest = lazy(() => import("./pages/debug/CardPaymentTest"));
const PaymentTest = lazy(() => import("./pages/debug/PaymentTest"));
const Monitoring = lazy(() => import("./pages/debug/Monitoring"));
const SystemDiagnostic = lazy(() => import("./pages/debug/SystemDiagnostic"));

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
            <Route path="/" element={
              <Suspense fallback={<LoadingFallback />}>
                <Index />
              </Suspense>
            } />
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
          <Route path="/menu-debug" element={
            <Suspense fallback={<LoadingFallback />}>
              <MenuDebug />
            </Suspense>
          } />
          <Route path="/payment-debug" element={
            <Suspense fallback={<LoadingFallback />}>
              <PaymentDebug />
            </Suspense>
          } />
          <Route path="/credit-card-debug" element={
            <Suspense fallback={<LoadingFallback />}>
              <CreditCardDebug />
            </Suspense>
          } />
          <Route path="/card-payment-test" element={
            <Suspense fallback={<LoadingFallback />}>
              <CardPaymentTest />
            </Suspense>
          } />
          <Route path="/payment-test" element={
            <Suspense fallback={<LoadingFallback />}>
              <PaymentTest />
            </Suspense>
          } />
          <Route path="/checkout" element={
            <Suspense fallback={<LoadingFallback />}>
              <Checkout />
            </Suspense>
          } />
          <Route path="/checkout2" element={
            <Suspense fallback={<LoadingFallback />}>
              <CheckoutLegacy />
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
          <Route path="/order-lookup" element={
            <Suspense fallback={<LoadingFallback />}>
              <OrderLookup />
            </Suspense>
          } />
          <Route path="/auth" element={
            <Suspense fallback={<LoadingFallback />}>
              <Auth />
            </Suspense>
          } />
          <Route path="/waiter" element={
            <Suspense fallback={<LoadingFallback />}>
              <Waiter />
            </Suspense>
          } />
          <Route
            path="/waiter/setup"
            element={
              <ProtectedRoute requiredRole="waiter">
                <Suspense fallback={<LoadingFallback />}>
                  <WaiterSetup />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/waiter/dashboard"
            element={
              <ProtectedRoute requiredRole="waiter">
                <Suspense fallback={<LoadingFallback />}>
                  <WaiterDashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/waiter-dashboard"
            element={
              <ProtectedRoute requiredRole="waiter">
                <Suspense fallback={<LoadingFallback />}>
                  <WaiterDashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <Suspense fallback={<LoadingFallback />}>
                  <Admin />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute requiredRole="kitchen">
                <Suspense fallback={<LoadingFallback />}>
                  <Cashier />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cashier"
            element={
              <ProtectedRoute requiredRole="cashier">
                <Suspense fallback={<LoadingFallback />}>
                  <Cashier />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute requiredRole="admin">
                <Suspense fallback={<LoadingFallback />}>
                  <Reports />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/whatsapp-admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <Suspense fallback={<LoadingFallback />}>
                  <WhatsAppAdmin />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/monitoring"
            element={
              <ProtectedRoute requiredRole="admin">
                <Suspense fallback={<LoadingFallback />}>
                  <Monitoring />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute requiredRole="admin">
                <Suspense fallback={<LoadingFallback />}>
                  <AdminProducts />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/waiter-management"
            element={
              <ProtectedRoute requiredRole="admin">
                <Suspense fallback={<LoadingFallback />}>
                  <WaiterManagement />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/waiter-reports"
            element={
              <ProtectedRoute requiredRole="admin">
                <Suspense fallback={<LoadingFallback />}>
                  <AdminWaiterReportsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/diagnostic"
            element={
              <ProtectedRoute requiredRole="admin">
                <Suspense fallback={<LoadingFallback />}>
                  <SystemDiagnostic />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/waiter-diagnostic"
            element={
              <ProtectedRoute requiredRole="waiter">
                <Suspense fallback={<LoadingFallback />}>
                  <WaiterDiagnostic />
                </Suspense>
              </ProtectedRoute>
            }
          />
          {/* QR Code direct access route - must be last before catch-all */}
          <Route path="/:tableId" element={
            <Suspense fallback={<LoadingFallback />}>
              <QRRedirect />
            </Suspense>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={
            <Suspense fallback={<LoadingFallback />}>
              <NotFound />
            </Suspense>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
  );
};

export default App;
