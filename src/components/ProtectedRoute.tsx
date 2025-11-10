import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "kitchen" | "cashier" | "waiter";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRole, setHasRole] = useState(false);

  // Optional: Allow bypass with URL parameter for development
  const urlParams = new URLSearchParams(window.location.search);
  const bypassAuth = urlParams.get('bypass') === 'dev123';
  
  if (bypassAuth) {
    console.log('⚠️ Authentication bypassed for development');
    return <>{children}</>;
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session && requiredRole) {
        checkRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session && requiredRole) {
          checkRole(session.user.id);
        } else {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [requiredRole]);

  const checkRole = async (userId: string) => {
    try {
      // Get user from auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("❌ Error getting user:", userError);
        setHasRole(false);
        setLoading(false);
        return;
      }

      if (!user) {
        console.log('❌ No user found');
        setHasRole(false);
        setLoading(false);
        return;
      }

      console.log('👤 User email:', user.email);
      console.log('👤 User ID:', user.id);
      
      // Query the database directly using RPC to get the user's role
      console.log('🔍 Calling get_user_role RPC function...');
      const { data: userData, error: dbError } = await (supabase.rpc as any)('get_user_role', {
        user_id: user.id
      });
      
      console.log('📊 RPC Response - Data:', userData, 'Error:', dbError);
      
      if (dbError || !userData) {
        console.log('⚠️ Could not query user role from database, falling back to auth metadata');
        console.log('DB Error:', JSON.stringify(dbError));
        // Fallback to auth metadata
        const userRole = user.user_metadata?.role || user.app_metadata?.role;
        console.log('🔑 User role from auth:', userRole, 'Required role:', requiredRole);
        
        if (userRole === 'admin') {
          console.log('✅ Admin user detected - granting access');
          setHasRole(true);
        } else {
          const hasAccess = userRole === requiredRole;
          console.log('Role check result:', hasAccess);
          setHasRole(hasAccess);
        }
      } else {
        // Use database data
        const userRole = userData as string;
        console.log('🔑 User role from database:', userRole, 'Required role:', requiredRole);
        
        if (userRole === 'admin') {
          console.log('✅ Admin user detected - granting access');
          setHasRole(true);
        } else {
          const hasAccess = userRole === requiredRole;
          console.log('Role check result:', hasAccess);
          setHasRole(hasAccess);
        }
      }
    } catch (error) {
      console.error("Error checking role:", error);
      setHasRole(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && !hasRole) {
    // Check if user is a waiter trying to access admin panel
    const user = session?.user;
    const userRole = user?.user_metadata?.role || user?.app_metadata?.role;
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
          
          {/* Temporary workaround for waiters */}
          {userRole === 'waiter' && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-3">
                <strong>Garçom detectado!</strong> Você foi redirecionado incorretamente devido ao cache do navegador.
              </p>
              <button
                onClick={() => window.location.href = '/waiter-dashboard'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Ir para Painel do Garçom
              </button>
              <p className="text-xs text-blue-600 mt-2">
                Para corrigir permanentemente: Pressione Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
