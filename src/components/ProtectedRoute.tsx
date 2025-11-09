import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "kitchen" | "cashier";
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
      // Get the current user to check their metadata
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error getting user:", userError);
        setHasRole(false);
        setLoading(false);
        return;
      }

      if (!user) {
        setHasRole(false);
        setLoading(false);
        return;
      }

      // Check role from user_metadata
      const userRole = user.user_metadata?.role || user.app_metadata?.role;
      console.log('User role:', userRole, 'Required role:', requiredRole);
      
      // Check if user has the required role
      setHasRole(userRole === requiredRole);
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
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
