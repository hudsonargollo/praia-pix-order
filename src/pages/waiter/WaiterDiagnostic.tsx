import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle, ArrowLeft } from "lucide-react";

interface DiagnosticResult {
  name: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: string;
}

const WaiterDiagnostic = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const diagnostics: DiagnosticResult[] = [];

    // 1. Check authentication
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      if (user) {
        diagnostics.push({
          name: "Authentication",
          status: "success",
          message: "User is authenticated",
          details: `Email: ${user.email}, ID: ${user.id}`
        });

        // Check user role
        const role = user.user_metadata?.role || user.app_metadata?.role;
        diagnostics.push({
          name: "User Role",
          status: role ? "success" : "warning",
          message: role ? `Role: ${role}` : "No role found in metadata",
          details: JSON.stringify({ user_metadata: user.user_metadata, app_metadata: user.app_metadata })
        });

        // Check profile in database using RPC
        try {
          const { data: userRole, error: roleError } = await (supabase.rpc as any)('get_user_role', {
            user_id: user.id
          });

          if (roleError) {
            diagnostics.push({
              name: "Profile Database (RPC)",
              status: "error",
              message: "Error fetching user role via RPC",
              details: roleError.message
            });
          } else if (userRole) {
            diagnostics.push({
              name: "Profile Database (RPC)",
              status: "success",
              message: `User role from RPC: ${userRole}`,
              details: `Role: ${userRole}`
            });
          } else {
            diagnostics.push({
              name: "Profile Database (RPC)",
              status: "warning",
              message: "No role returned from RPC"
            });
          }
        } catch (rpcError: any) {
          diagnostics.push({
            name: "Profile Database (RPC)",
            status: "error",
            message: "RPC call failed",
            details: rpcError.message
          });
        }
      } else {
        diagnostics.push({
          name: "Authentication",
          status: "error",
          message: "No user authenticated"
        });
      }
    } catch (error: any) {
      diagnostics.push({
        name: "Authentication",
        status: "error",
        message: "Authentication check failed",
        details: error.message
      });
    }

    // 2. Check menu data access
    try {
      const { data: categories, error: catError } = await supabase
        .from("menu_categories")
        .select("*")
        .limit(1);

      if (catError) throw catError;

      diagnostics.push({
        name: "Menu Categories Access",
        status: "success",
        message: "Can access menu categories",
        details: `Found ${categories?.length || 0} categories`
      });
    } catch (error: any) {
      diagnostics.push({
        name: "Menu Categories Access",
        status: "error",
        message: "Cannot access menu categories",
        details: error.message
      });
    }

    // 3. Check menu items access
    try {
      const { data: items, error: itemsError } = await supabase
        .from("menu_items")
        .select("*")
        .limit(1);

      if (itemsError) throw itemsError;

      diagnostics.push({
        name: "Menu Items Access",
        status: "success",
        message: "Can access menu items",
        details: `Found ${items?.length || 0} items`
      });
    } catch (error: any) {
      diagnostics.push({
        name: "Menu Items Access",
        status: "error",
        message: "Cannot access menu items",
        details: error.message
      });
    }

    // 4. Check orders table access
    try {
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id")
        .limit(1);

      if (ordersError) throw ordersError;

      diagnostics.push({
        name: "Orders Table Access",
        status: "success",
        message: "Can access orders table",
        details: `Found ${orders?.length || 0} orders`
      });
    } catch (error: any) {
      diagnostics.push({
        name: "Orders Table Access",
        status: "error",
        message: "Cannot access orders table",
        details: error.message
      });
    }

    // 5. Check navigation routes
    diagnostics.push({
      name: "Current Route",
      status: "success",
      message: window.location.pathname,
      details: `Full URL: ${window.location.href}`
    });

    // 6. Check localStorage
    try {
      const cartData = localStorage.getItem('cart');
      diagnostics.push({
        name: "LocalStorage Cart",
        status: cartData ? "success" : "warning",
        message: cartData ? "Cart data exists" : "No cart data",
        details: cartData || "Empty"
      });
    } catch (error: any) {
      diagnostics.push({
        name: "LocalStorage Cart",
        status: "error",
        message: "Cannot access localStorage",
        details: error.message
      });
    }

    setResults(diagnostics);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-acai p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">Waiter System Diagnostics</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/waiter-dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardHeader>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Running diagnostics...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {results.map((result, index) => (
              <Card key={index} className={`border-2 ${getStatusColor(result.status)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{result.name}</h3>
                      <p className="text-sm text-gray-700 mt-1">{result.message}</p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            Show details
                          </summary>
                          <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                            {result.details}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-4">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => navigate("/menu")} variant="outline">
                Test Menu Navigation
              </Button>
              <Button onClick={() => navigate("/waiter-dashboard")} variant="outline">
                Go to Dashboard
              </Button>
              <Button onClick={() => navigate("/auth")} variant="outline">
                Go to Auth
              </Button>
              <Button onClick={runDiagnostics} variant="outline">
                Re-run Diagnostics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WaiterDiagnostic;
