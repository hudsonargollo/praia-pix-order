import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const WaiterRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAndRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const role = user.user_metadata?.role || user.app_metadata?.role;
      
      console.log('🔄 WaiterRedirect - User role:', role);
      
      if (role === 'waiter') {
        console.log('🔄 Redirecting waiter to dashboard');
        navigate('/waiter-dashboard');
      } else if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'kitchen') {
        navigate('/kitchen');
      } else if (role === 'cashier') {
        navigate('/cashier');
      } else {
        navigate('/auth');
      }
    };

    checkAndRedirect();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando para o painel correto...</p>
      </div>
    </div>
  );
};

export default WaiterRedirect;