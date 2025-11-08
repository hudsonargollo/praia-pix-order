import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
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
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentWaiter, setCurrentWaiter] = useState<Partial<Waiter> & { password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWaiters();
  }, []);

  const fetchWaiters = async () => {
    setLoading(true);
    // Fetch users with role 'waiter' from the auth.users table via a Supabase function or view
    // Since we cannot directly query auth.users from the client, we will query the public.profiles table 
    // or assume a view/function exists to expose this data securely.
    // For now, we'll simulate the data or assume a secure RLS/View setup.
    // A more robust solution would be a Cloudflare Worker or a Supabase Function.

    // **Temporary Mock/Assumption:** We assume a public view `waiter_profiles` exists for Admins.
    // In a real scenario, the Admin would use the Supabase Admin API or a secure serverless function.
    
    // For this implementation, we will use the `supabase.rpc` or a dedicated table if available.
    // Since we don't have the full Supabase schema, we'll rely on a direct query to a hypothetical `profiles` table
    // or, more securely, a custom RPC function.

    // Let's assume we can query `auth.users` with RLS allowing admins to see users with role 'waiter'
    // This is generally not possible from the client. We'll use a placeholder for now.
    
    // **Simulating a secure fetch for waiters (users with role 'waiter')**
    const { data: usersData, error: usersError } = await supabase
      .from('users') // Assuming a view or RLS allows this for 'admin' role
      .select('id, email, created_at, raw_user_meta_data')
      .eq('raw_app_meta_data->>role', 'waiter');

    if (usersError) {
      // Fallback to a less secure method or show error if the view/RLS is not set up
      console.error("Error fetching waiters (simulated):", usersError);
      // For the sake of development, we'll mock the data if the query fails
      setWaiters([
        { id: 'mock-1', email: 'garcom1@exemplo.com', full_name: 'Garçom Teste 1', created_at: new Date().toISOString() },
        { id: 'mock-2', email: 'garcom2@exemplo.com', full_name: 'Garçom Teste 2', created_at: new Date().toISOString() },
      ]);
      toast.warning("Aviso: A busca por garçons está simulada. É necessário configurar RLS/View ou RPC para `auth.users`.");
    } else {
      const formattedWaiters: Waiter[] = (usersData || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        full_name: user.raw_user_meta_data?.full_name || 'N/A',
        created_at: user.created_at,
      }));
      setWaiters(formattedWaiters);
    }
    setLoading(false);
  };

  const handleCreateWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validation = waiterSchema.safeParse(currentWaiter);
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      const { email, password, full_name } = validation.data;

      // Supabase Admin API equivalent for creating a user with a specific role
      // This operation requires the `service_role` key and MUST be done via a secure backend (Cloudflare Worker).
      // For now, we will simulate the call and assume a Cloudflare Worker at `/api/admin/create-waiter` handles this.

      const response = await fetch('/api/admin/create-waiter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name, role: 'waiter' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar conta de garçom.");
      }

      toast.success("Garçom criado com sucesso!");
      setIsDialogOpen(false);
      setCurrentWaiter({});
      fetchWaiters(); // Refresh list

    } catch (error: any) {
      toast.error(error.message || "Erro desconhecido ao criar garçom.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWaiter = async (waiterId: string) => {
    if (!window.confirm("Tem certeza que deseja deletar este garçom? Esta ação é irreversível.")) return;

    // This operation also requires the `service_role` key and MUST be done via a secure backend (Cloudflare Worker).
    try {
      const response = await fetch(`/api/admin/delete-waiter/${waiterId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao deletar conta de garçom.");
      }

      toast.success("Garçom deletado com sucesso!");
      fetchWaiters(); // Refresh list

    } catch (error: any) {
      toast.error(error.message || "Erro desconhecido ao deletar garçom.");
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
    <div className="p-4 md:p-8">
      <Card className="max-w-6xl mx-auto">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-2xl font-bold">Gerenciar Garçons</CardTitle>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Novo Garçom
          </Button>
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
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteWaiter(waiter.id)}>
                          <Trash2 className="w-4 h-4" />
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
  );
};

export default AdminWaiters;
