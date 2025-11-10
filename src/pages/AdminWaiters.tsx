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
    try {
      console.log('🔵 Calling Cloudflare Function: /api/admin/list-waiters');
      
      const response = await fetch('/api/admin/list-waiters');
      const data = await response.json();
      
      if (!response.ok) {
        console.error("API error:", data);
        toast.error(data.error || "Erro ao carregar lista de garçons");
        setWaiters([]);
        return;
      }
      
      setWaiters(data.waiters || []);
      
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

      console.log('🔵 Creating waiter via Cloudflare Function:', { email, full_name });

      // Use Cloudflare Function to create waiter
      const response = await fetch('/api/admin/create-waiter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, full_name }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API error:', data);
        
        // Provide helpful error messages
        if (data.error?.includes('already exists') || data.error?.includes('duplicate')) {
          throw new Error("Este email já está cadastrado.");
        } else {
          throw new Error(data.error || "Erro ao criar conta de garçom.");
        }
      }

      toast.success("Garçom criado com sucesso!");
      setIsDialogOpen(false);
      setCurrentWaiter({});
      fetchWaiters(); // Refresh list

    } catch (error: any) {
      console.error('Create waiter error:', error);
      toast.error(error.message || "Erro desconhecido ao criar garçom.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWaiter = async (waiterId: string) => {
    if (!window.confirm("Tem certeza que deseja deletar este garçom? Esta ação é irreversível.")) return;

    try {
      // Use Cloudflare Function to delete waiter
      const response = await fetch('/api/admin/delete-waiter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ waiterId }),
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
