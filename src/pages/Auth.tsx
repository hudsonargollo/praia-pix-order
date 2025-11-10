import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import logo from "@/assets/coco-loko-logo.png";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).max(100),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectToRolePage = async (session: any) => {
    // Get user role from metadata
    const { data: { user } } = await supabase.auth.getUser();
    const role = user?.user_metadata?.role || user?.app_metadata?.role;
    
    console.log('🔵 NEW AUTH CODE LOADED! User role:', role);
    console.log('🔵 User metadata:', user?.user_metadata);
    console.log('🔵 App metadata:', user?.app_metadata);
    
    // Redirect based on role
    if (role === 'waiter') {
      console.log('🔵 Redirecting waiter to dashboard');
      navigate("/waiter-dashboard");
    } else if (role === 'kitchen') {
      console.log('🔵 Redirecting to kitchen');
      navigate("/kitchen");
    } else if (role === 'cashier') {
      console.log('🔵 Redirecting to cashier');
      navigate("/cashier");
    } else if (role === 'admin') {
      console.log('🔵 Redirecting to admin');
      navigate("/admin");
    } else {
      console.log('🔵 Unknown role, defaulting to admin');
      // Default to admin for unknown roles
      navigate("/admin");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        redirectToRolePage(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        redirectToRolePage(session);
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
      if (isLogin) {
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
          redirectToRolePage(session);
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: validation.data.email,
          password: validation.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/kitchen`,
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Este email já está cadastrado");
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success("Conta criada com sucesso!");
      }
    } catch (error: any) {
      toast.error("Erro ao processar autenticação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-acai p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img 
              src={logo} 
              alt="Coco Loko Açaiteria" 
              className="h-24 w-auto"
            />
          </div>
          <CardTitle className="text-center text-2xl">{isLogin ? "Login" : "Criar Conta"}</CardTitle>
          <CardDescription className="text-center">
            {isLogin
              ? "Entre com suas credenciais para acessar o sistema"
              : "Crie uma conta para acessar o sistema"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                maxLength={100}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processando..." : isLogin ? "Entrar" : "Cadastrar"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              type="button"
            >
              {isLogin
                ? "Não tem conta? Cadastre-se"
                : "Já tem conta? Faça login"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
