import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  ArrowLeft, 
  Users, 
  TrendingUp,
  UserCheck,
  AlertCircle,
  RefreshCw,
  BarChart3
} from "lucide-react";
import { z } from "zod";
import logo from "@/assets/coco-loko-logo.png";
import { AdminWaiterReports } from "@/components";

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

const WaiterManagement = () => {
  const navigate = useNavigate();
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentWaiter, setCurrentWaiter] = useState<Partial<Waiter> & { password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("list");

  // Check if bypass parameter is present
  const urlParams = new URLSearchParams(window.location.search);
  const bypassParam = urlParams.get('bypass');
  const bypassSuffix = bypassParam ? `?bypass=${bypassParam}` : '';

  useEffect(() => {
    fetchWaiters();
  }, []);

  const fetchWaiters = async () => {
    setLoading(true);
    try {
      console.log('🔵 Fetching waiters from Supabase Edge Function...');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('list-waiters', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        console.error("❌ API error:", error);
        toast.error(error.message || "Erro ao carregar lista de garçons");
        setWaiters([]);
        return;
      }
      
      console.log('✅ Waiters loaded:', data);
      setWaiters(data.waiters || []);
      
    } catch (error) {
      console.error("❌ Error fetching waiters:", error);
      toast.error("Erro de conexão ao carregar lista de garçons");
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

      console.log('🔵 Creating waiter:', { email, full_name });

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-waiter', {
        body: { email, password, full_name },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('❌ Create waiter error:', error);
        
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          throw new Error("Este email já está cadastrado.");
        } else {
          throw new Error(error.message || "Erro ao criar conta de garçom.");
        }
      }

      toast.success("✅ Garçom criado com sucesso!");
      setIsDialogOpen(false);
      setCurrentWaiter({});
      fetchWaiters();

    } catch (error: any) {
      console.error('❌ Create waiter error:', error);
      toast.error(error.message || "Erro desconhecido ao criar garçom.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWaiter = async (waiterId: string, waiterName: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar o garçom "${waiterName}"? Esta ação é irreversível.`)) return;

    try {
      console.log('🔵 Deleting waiter:', waiterId);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-waiter', {
        body: { waiterId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message || "Erro ao deletar conta de garçom.");
      }

      toast.success("✅ Garçom deletado com sucesso!");
      fetchWaiters();

    } catch (error: any) {
      console.error('❌ Delete waiter error:', error);
      toast.error(error.message || "Erro desconhecido ao deletar garçom.");
    }
  };

  const openCreateDialog = () => {
    setCurrentWaiter({ full_name: '', email: '', password: '' });
    setIsDialogOpen(true);
  };

  const handleBack = () => {
    navigate(`/admin${bypassSuffix}`);
  };

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
                onClick={handleBack}
                className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              <div className="relative">
                <img 
                  src={logo} 
                  alt="Coco Loko Açaiteria" 
                  className="h-12 sm:h-16 w-auto drop-shadow-lg"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Gestão de Garçons
                </h1>
                <p className="text-blue-100 mt-1 text-xs sm:text-base font-medium">
                  Gerenciar equipe e relatórios • Sistema Completo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={fetchWaiters}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
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
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm shadow-lg">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Lista de Garçons
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-purple-600" />
                    Equipe de Garçons
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      {waiters.length} {waiters.length === 1 ? 'garçom' : 'garçons'}
                    </Badge>
                    {loading && <Loader2 className="w-4 h-4 animate-spin text-purple-600" />}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                    <p className="text-gray-600">Carregando lista de garçons...</p>
                  </div>
                ) : waiters.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum garçom cadastrado</h3>
                    <p className="text-gray-600 mb-4">Comece adicionando o primeiro garçom da sua equipe.</p>
                    <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Primeiro Garçom
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome Completo</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Criado em</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {waiters.map((waiter) => (
                          <TableRow key={waiter.id} className="hover:bg-purple-50/50">
                            <TableCell className="font-medium">{waiter.full_name}</TableCell>
                            <TableCell>{waiter.email}</TableCell>
                            <TableCell>{new Date(waiter.created_at).toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell>
                              <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-200">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Ativo
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleDeleteWaiter(waiter.id, waiter.full_name)}
                                className="hover:bg-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                  Relatórios de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminWaiterReports />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Waiter Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Adicionar Novo Garçom
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateWaiter}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    placeholder="Digite o nome completo"
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
                    placeholder="Digite o email"
                    value={currentWaiter.email || ''}
                    onChange={(e) => setCurrentWaiter({ ...currentWaiter, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite a senha (mínimo 6 caracteres)"
                    value={currentWaiter.password || ''}
                    onChange={(e) => setCurrentWaiter({ ...currentWaiter, password: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Garçom
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default WaiterManagement;