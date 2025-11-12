import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCheck, ArrowLeft } from "lucide-react";
import logo from "@/assets/coco-loko-logo.png";

const Waiter = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to auth page with waiter context
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-ocean flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        {/* Back Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-4 hover:bg-gray-100 transition-all duration-300"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Início
        </Button>

        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src={logo} 
            alt="Coco Loko Açaiteria" 
            className="h-24 mx-auto mb-4"
          />
          <div className="flex items-center justify-center gap-2 mb-2">
            <UserCheck className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-purple-900">Garçom</h1>
          </div>
          <p className="text-muted-foreground">
            Faça login para acessar o painel
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Email</Label>
            <Input
              id="username"
              type="email"
              placeholder="Digite seu email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold"
          >
            Entrar
          </Button>
        </form>


      </Card>
    </div>
  );
};

export default Waiter;
