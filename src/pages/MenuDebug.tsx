import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MenuDebug = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Testing Supabase connection...");
      
      // Test categories
      const { data: categoriesData, error: catError } = await supabase
        .from("menu_categories")
        .select("*")
        .order("display_order");

      if (catError) {
        console.error("Categories error:", catError);
        setError(`Categories error: ${catError.message}`);
        return;
      }

      // Test menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("available", true)
        .limit(5);

      if (itemsError) {
        console.error("Items error:", itemsError);
        setError(`Items error: ${itemsError.message}`);
        return;
      }

      console.log("Success! Categories:", categoriesData?.length, "Items:", itemsData?.length);
      setCategories(categoriesData || []);
      setMenuItems(itemsData || []);
      
    } catch (err) {
      console.error("Connection error:", err);
      setError(`Connection error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Menu Debug Page</h1>
        
        <div className="flex gap-2 mb-4">
          <Button onClick={testConnection} disabled={loading}>
            {loading ? "Testing..." : "Test Connection"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => toast.success("Sucesso! Pedido adicionado ao carrinho")}
          >
            Test Success Toast
          </Button>
          <Button 
            variant="outline" 
            onClick={() => toast.error("Erro! Não foi possível carregar o cardápio")}
          >
            Test Error Toast
          </Button>
          <Button 
            variant="outline" 
            onClick={() => toast("Info: Carregando dados...")}
          >
            Test Info Toast
          </Button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-2">Categories ({categories.length})</h2>
            <div className="bg-muted p-4 rounded">
              {categories.map((cat, index) => (
                <div key={index} className="mb-2">
                  <strong>{cat.name}</strong> (Order: {cat.display_order})
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Menu Items ({menuItems.length})</h2>
            <div className="bg-muted p-4 rounded">
              {menuItems.map((item, index) => (
                <div key={index} className="mb-2">
                  <strong>{item.name}</strong> - R$ {item.price}
                  {item.image_url && <span className="text-green-600"> ✓ Has image</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Environment Check</h2>
          <div className="bg-muted p-4 rounded">
            <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL}</p>
            <p><strong>Has API Key:</strong> {import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuDebug;