import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function WaiterSetup() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError("Por favor, insira um nome de exibição");
      return;
    }

    if (trimmedName.length < 2) {
      setError("O nome deve ter pelo menos 2 caracteres");
      return;
    }

    if (trimmedName.length > 50) {
      setError("O nome deve ter no máximo 50 caracteres");
      return;
    }

    setLoading(true);

    try {
      // Call the database function to set display name
      const { data, error: rpcError } = await supabase.rpc('set_waiter_display_name', {
        p_display_name: trimmedName
      });

      if (rpcError) {
        console.error('Error setting display name:', rpcError);
        
        // Handle specific error cases
        if (rpcError.message.includes('already in use')) {
          setError("Esse nome já está em uso. Por favor, escolha outro.");
        } else if (rpcError.message.includes('Not authenticated')) {
          setError("Sessão expirada. Por favor, faça login novamente.");
          setTimeout(() => navigate('/login'), 2000);
        } else if (rpcError.message.includes('Only waiters')) {
          setError("Apenas garçons podem configurar nomes de exibição.");
        } else {
          setError("Erro ao salvar. Tente novamente.");
        }
        return;
      }

      // Success!
      toast.success("Nome de exibição configurado com sucesso!");
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/waiter/dashboard', { replace: true });
      }, 500);

    } catch (err) {
      console.error('Unexpected error:', err);
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-2">
            <User className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Configure Seu Nome de Exibição
          </CardTitle>
          <CardDescription className="text-base">
            Escolha um nome único que será usado para identificar você nos pedidos e relatórios
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">
                Nome de Exibição
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Ex: João, Maria, Pedro..."
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setError(null);
                }}
                disabled={loading}
                className="text-base"
                autoFocus
                maxLength={50}
              />
              <p className="text-xs text-gray-500">
                {displayName.length}/50 caracteres
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Dicas:
              </p>
              <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
                <li>Use seu apelido ou primeiro nome</li>
                <li>Deve ser único (não pode repetir)</li>
                <li>Será visível para toda a equipe</li>
                <li>Pode conter letras, números e espaços</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={loading || !displayName.trim()}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Continuar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
