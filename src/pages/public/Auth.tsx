import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import logo from "@/assets/coco-loko-logo.png";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).max(100),
});

const greetings = [
  "Bora trabalhar! 💪",
  "Vamos fazer acontecer! 🚀",
  "Hora de brilhar! ⭐",
  "Foco no resultado! 🎯",
  "Seu esforço vale a pena! 💎",
  "Cada dia é uma vitória! 🏆",
  "Vamos com tudo! 🔥",
  "Determinação é tudo! 💯",
  "Sucesso vem do trabalho! ⚡",
  "Você é capaz! 🌟"
];

const Auth = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [greetingIndex, setGreetingIndex] = useState(0);

  const redirectToRolePage = async (session: any) => {
    try {
      // Get user role from metadata
      const { data: { user } } = await supabase.auth.getUser();
      let role = user?.user_metadata?.role || user?.app_metadata?.role;
      
      console.log('🔵 AUTH v3.0 - User role from metadata:', role);
      console.log('🔵 User ID:', user?.id);
      console.log('🔵 User email:', user?.email);
      
      // Always try to get role from database (most reliable)
      if (user?.id) {
        console.log('🔵 Fetching role from profiles table...');
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (!profileError && profileData?.role) {
            role = profileData.role;
            console.log('🔵 Got role from profiles table:', role);
          } else {
            console.log('🔵 Profile query error or no role:', profileError);
            
            // Try RPC function as fallback
            console.log('🔵 Trying RPC function...');
            const { data: rpcRole, error: rpcError } = await (supabase.rpc as any)('get_user_role', {
              user_id: user.id
            });
            
            if (!rpcError && rpcRole) {
              role = rpcRole;
              console.log('🔵 Got role from RPC:', role);
            } else {
              console.log('🔵 RPC error or no role:', rpcError);
            }
          }
        } catch (err) {
          console.log('🔵 Database query failed:', err);
        }
      }
      
      // Redirect based on role
      console.log('🔵 Final role for redirect:', role);
      
      if (role === 'waiter') {
        console.log('✅ Redirecting waiter to dashboard');
        navigate("/waiter-dashboard", { replace: true });
      } else if (role === 'kitchen') {
        console.log('✅ Redirecting to kitchen');
        navigate("/kitchen", { replace: true });
      } else if (role === 'cashier') {
        console.log('✅ Redirecting to cashier');
        navigate("/cashier", { replace: true });
      } else if (role === 'admin') {
        console.log('✅ Redirecting to admin');
        navigate("/admin", { replace: true });
      } else {
        console.log('⚠️  No role found, defaulting to admin. Role was:', role);
        // Default to admin for unknown roles
        navigate("/admin", { replace: true });
      }
    } catch (error) {
      console.error('🔴 Error in redirectToRolePage:', error);
      // Fallback to admin on error
      navigate("/admin", { replace: true });
    }
  };

  useEffect(() => {
    // Rotate greetings every 3 seconds
    const interval = setInterval(() => {
      setGreetingIndex((prev) => (prev + 1) % greetings.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Simple redirect based on email for now
        const email = session.user.email;
        console.log('🔵 Session found, email:', email);
        
        if (email === 'garcom1@cocoloko.com') {
          console.log('🔵 Waiter email detected, redirecting to dashboard');
          // Force redirect to current domain to avoid custom domain issues
          window.location.href = `${window.location.origin}/waiter-dashboard`;
        } else {
          redirectToRolePage(session);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Simple redirect based on email for now
        const email = session.user.email;
        console.log('🔵 Auth state change, email:', email);
        
        if (email === 'garcom1@cocoloko.com') {
          console.log('🔵 Waiter email detected, redirecting to dashboard');
          // Force redirect to current domain to avoid custom domain issues
          window.location.href = `${window.location.origin}/waiter-dashboard`;
        } else {
          redirectToRolePage(session);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou senha incorretos");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Login realizado com sucesso!");
      const session = (await supabase.auth.getSession()).data.session;
      if (session) {
        // Use email-based redirect for waiter
        if (validation.data.email === 'garcom1@cocoloko.com') {
          console.log('🔵 Waiter login successful, redirecting to dashboard');
          // Force redirect to current domain to avoid custom domain issues
          window.location.href = `${window.location.origin}/waiter-dashboard`;
        } else {
          redirectToRolePage(session);
        }
      }
    } catch (error: any) {
      toast.error("Erro ao processar autenticação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white relative z-10 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader className="text-center space-y-5 pt-8 pb-6 bg-gradient-to-br from-purple-100 via-white to-indigo-100">
          <div className="flex justify-center animate-in zoom-in duration-500 delay-100">
            <div className="bg-gradient-to-br from-white to-purple-100 p-4 rounded-2xl shadow-lg ring-2 ring-purple-300/60">
              <img 
                src={logo} 
                alt="Coco Loko Açaiteria" 
                className="h-14 w-auto"
              />
            </div>
          </div>
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-500 delay-200">
            <CardTitle className="text-2xl font-bold text-gray-900 transition-all duration-500">
              <span key={greetingIndex} className="inline-block animate-in fade-in slide-in-from-top-1 duration-500">
                {greetings[greetingIndex]}
              </span>
            </CardTitle>
            <CardDescription className="text-gray-700 text-sm font-medium">
              Faça login para continuar
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-8 py-6 bg-white animate-in fade-in duration-500 delay-300">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-800">
                Email
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 text-lg">
                  📧
                </span>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                  className="h-12 text-base pl-11 pr-4 border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg transition-all bg-gray-50 focus:bg-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-800">
                Senha
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 text-lg">
                  🔒
                </span>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  maxLength={100}
                  className="h-12 text-base pl-11 pr-12 border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg transition-all bg-gray-50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600 transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 mt-6 rounded-lg" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Entrando...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="text-lg">🚀</span>
                  <span>Entrar no Sistema</span>
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
