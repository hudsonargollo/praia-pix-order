import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Upload, Download, Search, Users, TrendingUp, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { UniformHeader } from "@/components/UniformHeader";

interface Customer {
  id: string;
  whatsapp: string;
  name: string;
  first_order_date: string;
  last_order_date: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

const CustomerManagement = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: "", whatsapp: "" });
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    repeatCustomers: 0
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.name.toLowerCase().includes(term) ||
            c.whatsapp.includes(term)
        )
      );
    }
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
      setFilteredCustomers(data || []);
      
      // Calculate stats
      if (data) {
        const totalOrders = data.reduce((sum, c) => sum + c.total_orders, 0);
        const totalRevenue = data.reduce((sum, c) => sum + c.total_spent, 0);
        const repeatCustomers = data.filter(c => c.total_orders > 1).length;
        
        setStats({
          totalCustomers: data.length,
          totalOrders,
          totalRevenue,
          repeatCustomers
        });
      }
    } catch (error) {
      console.error("Error loading customers:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedCustomer(null);
    setFormData({ name: "", whatsapp: "" });
    setIsEditDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({ name: customer.name, whatsapp: customer.whatsapp });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.whatsapp.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    // Validate phone format
    const phoneDigits = formData.whatsapp.replace(/\D/g, "");
    if (phoneDigits.length !== 11) {
      toast.error("WhatsApp deve ter 11 dígitos (DDD + número)");
      return;
    }

    const normalizedPhone = `+55${phoneDigits}`;

    try {
      if (selectedCustomer) {
        // Update existing customer
        const { error } = await supabase
          .from("customers")
          .update({
            name: formData.name.trim(),
            whatsapp: normalizedPhone,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedCustomer.id);

        if (error) throw error;
        toast.success("Cliente atualizado com sucesso");
      } else {
        // Create new customer
        const { error } = await supabase.from("customers").insert({
          name: formData.name.trim(),
          whatsapp: normalizedPhone,
        });

        if (error) throw error;
        toast.success("Cliente adicionado com sucesso");
      }

      setIsEditDialogOpen(false);
      loadCustomers();
    } catch (error: any) {
      console.error("Error saving customer:", error);
      if (error.code === "23505") {
        toast.error("Este WhatsApp já está cadastrado");
      } else {
        toast.error("Erro ao salvar cliente");
      }
    }
  };

  const confirmDelete = async () => {
    if (!selectedCustomer) return;

    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", selectedCustomer.id);

      if (error) throw error;
      toast.success("Cliente removido com sucesso");
      setIsDeleteDialogOpen(false);
      loadCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Erro ao remover cliente");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Nome", "WhatsApp", "Total Pedidos", "Total Gasto", "Primeiro Pedido", "Último Pedido"];
    const rows = customers.map((c) => [
      c.name,
      c.whatsapp,
      c.total_orders.toString(),
      `R$ ${c.total_spent.toFixed(2)}`,
      new Date(c.first_order_date).toLocaleDateString("pt-BR"),
      new Date(c.last_order_date).toLocaleDateString("pt-BR"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `clientes_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("CSV exportado com sucesso");
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());
        
        // Skip header
        const dataLines = lines.slice(1);
        
        const customersToImport = dataLines.map((line) => {
          const [name, whatsapp] = line.split(",").map((cell) => cell.replace(/"/g, "").trim());
          
          // Normalize phone
          const phoneDigits = whatsapp.replace(/\D/g, "");
          const normalizedPhone = phoneDigits.startsWith("55") 
            ? `+${phoneDigits}` 
            : `+55${phoneDigits}`;
          
          return { name, whatsapp: normalizedPhone };
        });

        // Batch insert
        const { error } = await supabase
          .from("customers")
          .insert(customersToImport);

        if (error) throw error;
        
        toast.success(`${customersToImport.length} clientes importados com sucesso`);
        loadCustomers();
      } catch (error) {
        console.error("Error importing CSV:", error);
        toast.error("Erro ao importar CSV. Verifique o formato do arquivo.");
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Uniform Header */}
      <UniformHeader
        title="Clientes"
        onBack={() => navigate("/admin")}
        onLogout={handleLogout}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 pt-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-white to-purple-50 border-0 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-white to-green-50 border-0 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Receita</p>
                <p className="text-xl font-bold text-gray-900">R$ {stats.totalRevenue.toFixed(0)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-white to-indigo-50 border-0 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Recorrentes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.repeatCustomers}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Card */}
        <Card className="p-6 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={handleAdd} 
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all rounded-xl h-11 px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
              <Button 
                onClick={handleExportCSV} 
                variant="outline"
                className="border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 rounded-xl h-11 px-6"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button 
                variant="outline" 
                className="relative border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl h-11 px-6"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Carregando clientes...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium text-lg">Nenhum cliente encontrado</p>
              <p className="text-gray-500 text-sm mt-2">
                {searchTerm ? "Tente buscar com outros termos" : "Adicione seu primeiro cliente"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border-2 border-gray-100">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-50 hover:to-indigo-50">
                    <TableHead className="font-bold text-gray-900">Nome</TableHead>
                    <TableHead className="font-bold text-gray-900">WhatsApp</TableHead>
                    <TableHead className="text-right font-bold text-gray-900">Pedidos</TableHead>
                    <TableHead className="text-right font-bold text-gray-900">Total Gasto</TableHead>
                    <TableHead className="font-bold text-gray-900">Último Pedido</TableHead>
                    <TableHead className="text-right font-bold text-gray-900">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-purple-50/50 transition-colors">
                      <TableCell className="font-semibold text-gray-900">{customer.name}</TableCell>
                      <TableCell className="text-gray-700 font-mono text-sm">{customer.whatsapp}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-semibold">
                          {customer.total_orders}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        R$ {customer.total_spent.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(customer.last_order_date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(customer)}
                            className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(customer)}
                            className="border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Edit/Add Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border-2 border-purple-200 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {selectedCustomer ? "Editar Cliente" : "Adicionar Cliente"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div>
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2 block">
                Nome Completo
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digite o nome do cliente"
                className="h-11 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="whatsapp" className="text-sm font-semibold text-gray-700 mb-2 block">
                WhatsApp (com DDD)
              </Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  setFormData({ ...formData, whatsapp: digits.slice(0, 11) });
                }}
                placeholder="71987654321"
                maxLength={11}
                className="h-11 border-2 border-gray-200 focus:border-purple-500 rounded-xl font-mono"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                Formato: DDD + número (11 dígitos)
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="border-2 border-gray-200 hover:border-gray-300 rounded-xl h-11 px-6"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all rounded-xl h-11 px-6"
            >
              Salvar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border-2 border-red-200 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600">
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
              <p className="text-gray-700">
                Tem certeza que deseja remover o cliente{" "}
                <strong className="text-red-600">{selectedCustomer?.name}</strong>?
              </p>
            </div>
            <p className="text-sm text-gray-600">
              ⚠️ Esta ação não pode ser desfeita e removerá permanentemente todos os dados do cliente.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-2 border-gray-200 hover:border-gray-300 rounded-xl h-11 px-6"
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-all rounded-xl h-11 px-6"
            >
              Remover Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerManagement;
