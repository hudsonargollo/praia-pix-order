import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Loader2, ArrowLeft, Users } from "lucide-react";
import { z } from "zod";

interface Waiter {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

const waiterSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).max(100),
  full_name: z.string().min(1, { message: "Nome completo é obrigatório" }).max(255),
});

const AdminWaiters = () => {
  const navigate = useNavigate();
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentWaiter, setCurrentWaiter] = useState<Partial<Waiter> & { password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWaiters();
  }, []);

  const fetchWaiters = async () => {
    setLoading(true);
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        navigate('/auth');
        return;
      }

      console.log('🔵 Calling Supabase Edge Function: list-waiters');
      
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('list-waiters', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        console.error("Edge Function error:", error);
        
        // Handle specific error cases
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          toast.error("Sessão expirada. Faça login novamente.");
          navigate('/auth');
          return;
        }
        
        if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
          toast.error("Acesso negado. Apenas administradores podem gerenciar garçons.");
          navigate('/');
          return;
        }
        
        toast.error("Erro ao carregar lista de garçons");
        setWaiters([]);
        return;
      }
      
      setWaiters(data?.waiters || []);
      
    } catch (error) {
      console.error("Error fetching waiters:", error);
      toast.error("Erro ao carregar lista de garçons");
      setWaiters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validation = waiterSchema.safeParse(currentWaiter);
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setIsSubmitting(false);
        return;
      }

      const { email, password, full_name } = validation.data;

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        navigate('/auth');
        setIsSubmitting(false);
        return;
      }

      console.log('🔵 Creating waiter via Supabase Edge Function:', { email, full_name });

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create-waiter', {
        body: { email, password, full_name },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        
        // Handle specific error cases
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          toast.error("Sessão expirada. Faça login novamente.");
          navigate('/auth');
          return;
        }
        
        if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
          toast.error("Acesso negado. Apenas administradores podem gerenciar garçons.");
          navigate('/');
          return;
        }
        
        if (error.message?.includes('already exists') || error.message?.includes('duplicate') || error.message?.includes('já existe')) {
          toast.error("Este email já está cadastrado.");
          return;
        }
        
        if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
          toast.error("Preencha todos os campos obrigatórios.");
          return;
        }
        
        toast.error("Erro ao criar conta de garçom.");
        return;
      }

      toast.success("Garçom criado com sucesso!");
      setIsDialogOpen(false);
      setCurrentWaiter({});
      fetchWaiters(); // Refresh list

    } catch (error: any) {
      console.error('Create waiter error:', error);
      toast.error("Erro no servidor. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWaiter = async (waiterId: string) => {
    if (!window.confirm("Tem certeza que deseja deletar este garçom? Esta ação é irreversível.")) return;

    setDeletingId(waiterId);

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        navigate('/auth');
        return;
      }

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('delete-waiter', {
        body: { waiterId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        
        // Handle specific error cases
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          toast.error("Sessão expirada. Faça login novamente.");
          navigate('/auth');
          return;
        }
        
        if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
          toast.error("Acesso negado. Apenas administradores podem gerenciar garçons.");
          navigate('/');
          return;
        }
        
        if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
          toast.error("Garçom não encontrado.");
          return;
        }
        
        toast.error("Erro ao deletar conta de garçom.");
        return;
      }

      toast.success("Garçom deletado com sucesso!");
      fetchWaiters(); // Refresh list

    } catch (error: any) {
      console.error('Delete waiter error:', error);
      toast.error("Erro no servidor. Tente novamente.");
    } finally {
      setDeletingId(null);
    }
  };

  const openCreateDialog = () => {
    setIsEditing(false);
    setCurrentWaiter({ full_name: '', email: '', password: '' });
    setIsDialogOpen(true);
  };

  // Edit functionality (e.g., password reset) is complex and also requires a secure backend.
  // We will skip the implementation for the edit dialog for now, focusing on the core requirement (Create, View, Delete).

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Gerenciar Garçons
                </h1>
                <p className="text-blue-100 mt-1 text-xs sm:text-base font-medium">
                  Adicione e gerencie a equipe • Gestão de Garçons
                </p>
              </div>
            </div>
            <Button
              onClick={openCreateDialog}
              className="bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Novo Garçom</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600" />
              Equipe de Garçons ({waiters.length})
            </CardTitle>
          </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Carregando lista de garçons...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waiters.map((waiter) => (
                    <TableRow key={waiter.id}>
                      <TableCell className="font-medium">{waiter.full_name}</TableCell>
                      <TableCell>{waiter.email}</TableCell>
                      <TableCell>{new Date(waiter.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {/* <Button variant="outline" size="sm" onClick={() => { /* Open edit dialog */ /* }}>
                          <Edit className="w-4 h-4" />
                        </Button> */}
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteWaiter(waiter.id)}
                          disabled={deletingId === waiter.id}
                        >
                          {deletingId === waiter.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {waiters.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">Nenhum garçom cadastrado.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Creating/Editing Waiter */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Garçom" : "Adicionar Novo Garçom"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateWaiter}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={currentWaiter.full_name || ''}
                  onChange={(e) => setCurrentWaiter({ ...currentWaiter, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentWaiter.email || ''}
                  onChange={(e) => setCurrentWaiter({ ...currentWaiter, email: e.target.value })}
                  required
                  disabled={isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha {isEditing ? "(Deixe em branco para não alterar)" : ""}</Label>
                <Input
                  id="password"
                  type="password"
                  value={currentWaiter.password || ''}
                  onChange={(e) => setCurrentWaiter({ ...currentWaiter, password: e.target.value })}
                  required={!isEditing}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isEditing ? "Salvar Alterações" : "Criar Garçom"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default AdminWaiters;
