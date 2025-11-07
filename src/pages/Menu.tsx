import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cartContext";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string;
  available: boolean;
  image_url: string | null;
}

interface Category {
  id: string;
  name: string;
  display_order: number;
}

const Menu = () => {
  const navigate = useNavigate();
  
  const {
    state: cartState,
    addItem,
    setTableId,
    getItemQuantity,
    getTotalItems,
    getTotalPrice,
  } = useCart();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<{name: string, phone: string} | null>(null);

  useEffect(() => {
    const storedCustomerInfo = sessionStorage.getItem("customerInfo");
    if (storedCustomerInfo) {
      try {
        const parsed = JSON.parse(storedCustomerInfo);
        setCustomerInfo(parsed);
        setTableId("1");
      } catch (error) {
        console.error("Error parsing customer info:", error);
        setCustomerInfo({ name: "Test User", phone: "73999999999" });
        setTableId("1");
      }
    } else {
      setCustomerInfo({ name: "Test User", phone: "73999999999" });
      setTableId("1");
    }
    
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      setLoading(true);
      
      const { data: categoriesData, error: catError } = await supabase
        .from("menu_categories")
        .select("*")
        .order("display_order");

      if (catError) throw catError;

      const { data: itemsData, error: itemsError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("available", true);

      if (itemsError) throw itemsError;

      setCategories(categoriesData || []);
      setMenuItems(itemsData || []);
    } catch (error) {
      console.error("Error loading menu:", error);
      toast.error("Erro ao carregar cardápio");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    addItem(item);
    toast.success(`${item.name} adicionado`);
  };

  const goToCheckout = () => {
    if (cartState.items.length === 0) {
      toast.error("Adicione itens ao carrinho");
      return;
    }
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div 
          className="fixed inset-0 bg-cover bg-top bg-no-repeat"
          style={{
            backgroundImage: `url('/bck-menu.webp')`,
          }}
        />
        <p className="relative z-10 text-purple-900 font-semibold bg-white px-6 py-3 rounded-full shadow-lg">
          Carregando cardápio...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-24">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-top bg-no-repeat"
        style={{
          backgroundImage: `url('/bck-menu.webp')`,
        }}
      />

      {/* Menu Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-32 pb-6 space-y-6">
        {categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-purple-900 font-semibold">Nenhuma categoria encontrada</p>
          </div>
        ) : (
          categories.map((category) => {
            const categoryItems = menuItems.filter(
              (item) => item.category_id === category.id
            );
            if (categoryItems.length === 0) return null;

            return (
              <div key={category.id} className="space-y-3">
                {/* Category Header */}
                <div className="bg-purple-900 text-white px-4 py-2 rounded-full inline-block">
                  <h2 className="font-bold text-sm uppercase tracking-wide">
                    {category.name}
                  </h2>
                </div>

                {/* Category Items */}
                <div className="space-y-3">
                  {categoryItems.map((item) => {
                    const quantity = getItemQuantity(item.id);
                    
                    return (
                      <div 
                        key={item.id} 
                        className="bg-white rounded-2xl p-4 shadow-md flex items-center gap-4"
                      >
                        {/* Item Image */}
                        <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-gray-400 text-xs">Sem foto</span>
                            </div>
                          )}
                        </div>

                        {/* Item Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-base">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <p className="text-cyan-600 font-bold mt-1 text-base">
                            R$ {item.price.toFixed(2)}
                          </p>
                        </div>

                        {/* Add Button or Quantity Controls */}
                        <div className="flex-shrink-0">
                          {quantity > 0 ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const currentItem = cartState.items.find(i => i.id === item.id);
                                  if (currentItem && currentItem.quantity > 1) {
                                    // Remove one
                                    addItem({ ...item, quantity: -1 } as any);
                                  } else {
                                    // Remove completely
                                    const newItems = cartState.items.filter(i => i.id !== item.id);
                                    cartState.items = newItems;
                                  }
                                }}
                                className="w-8 h-8 rounded-full bg-purple-900 text-white flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <span className="font-bold text-purple-900 w-6 text-center">
                                {quantity}
                              </span>
                              <button
                                onClick={() => addToCart(item)}
                                className="w-8 h-8 rounded-full bg-purple-900 text-white flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => addToCart(item)}
                              className="bg-purple-900 hover:bg-purple-800 text-white px-6 py-2 rounded-full font-semibold text-sm"
                            >
                              Adicionar
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Cart Button */}
      {cartState.items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-yellow-400">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={goToCheckout}
              className="w-full bg-purple-900 hover:bg-purple-800 text-white py-6 rounded-2xl font-bold text-base shadow-lg"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Ver Carrinho ({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'}) - R$ {getTotalPrice().toFixed(2)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
