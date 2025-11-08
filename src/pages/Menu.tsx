import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cartContext";
import logo from "@/assets/coco-loko-logo.png";

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
    removeItem,
    getItemQuantity,
    getTotalItems,
    getTotalPrice,
  } = useCart();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
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

  const scrollToCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const offset = 180; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
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
      <div className="min-h-screen relative flex items-center justify-center bg-gradient-acai md:bg-[#FDD835]">
        {/* Background Image - Mobile Only */}
        <div 
          className="md:hidden fixed inset-0 bg-cover bg-top bg-no-repeat"
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
    <div className="min-h-screen relative pb-24 bg-gradient-acai md:bg-[#FDD835]">
      {/* Background Image - Mobile Only */}
      <div 
        className="md:hidden fixed inset-0 bg-cover bg-top bg-no-repeat"
        style={{
          backgroundImage: `url('/bck-menu.webp')`,
        }}
      />

      {/* Logo Header - Desktop Only */}
      <div className="hidden md:block relative z-10 bg-[#FDD835] py-6">
        <div className="max-w-2xl mx-auto px-4">
          <img 
            src={logo} 
            alt="Coco Loko Açaiteria" 
            className="h-24 mx-auto"
          />
        </div>
      </div>

      {/* Category Navigation - Fixed at top */}
      {categories.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm shadow-md pt-4 pb-3">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => {
                const categoryItems = menuItems.filter(
                  (item) => item.category_id === category.id
                );
                if (categoryItems.length === 0) return null;

                const isSelected = selectedCategory === category.id;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => scrollToCategory(category.id)}
                    className={`
                      flex-shrink-0 px-4 py-2 rounded-full font-semibold text-sm transition-all
                      ${isSelected 
                        ? 'bg-purple-900 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Menu Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-32 md:pt-24 pb-6 space-y-6">
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
              <div key={category.id} id={`category-${category.id}`} className="space-y-3 scroll-mt-32">
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
                        {/* Item Image - Clickable */}
                        <div 
                          className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedItem(item)}
                        >
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

                        {/* Item Info - Clickable */}
                        <div 
                          className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedItem(item)}
                        >
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
                                onClick={() => removeItem(item.id)}
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
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-yellow-400 z-50">
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

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-md">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {selectedItem.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Product Image */}
                {selectedItem.image_url && (
                  <div className="w-full h-64 rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={selectedItem.image_url}
                      alt={selectedItem.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Description */}
                {selectedItem.description && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Descrição</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {selectedItem.description}
                    </p>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-2xl font-bold text-cyan-600">
                    R$ {selectedItem.price.toFixed(2)}
                  </span>
                  
                  {/* Add to Cart Button */}
                  {getItemQuantity(selectedItem.id) > 0 ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => removeItem(selectedItem.id)}
                        className="w-10 h-10 rounded-full bg-purple-900 text-white flex items-center justify-center font-bold text-lg"
                      >
                        -
                      </button>
                      <span className="font-bold text-purple-900 text-lg w-8 text-center">
                        {getItemQuantity(selectedItem.id)}
                      </span>
                      <button
                        onClick={() => addToCart(selectedItem)}
                        className="w-10 h-10 rounded-full bg-purple-900 text-white flex items-center justify-center font-bold text-lg"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        addToCart(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="bg-purple-900 hover:bg-purple-800 text-white px-8 py-6 rounded-full font-semibold"
                    >
                      Adicionar ao Carrinho
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Menu;
