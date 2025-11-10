import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingCart, Plus, Minus, Clock, LogOut, Coffee, Droplets, IceCream, Sandwich, Pizza, Cake } from "lucide-react";
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
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadMenu();
  }, []);

  // Memoized category items for performance
  const categorizedItems = useMemo(() => {
    return categories.map(category => ({
      ...category,
      items: menuItems.filter(item => item.category_id === category.id)
    })).filter(category => category.items.length > 0);
  }, [categories, menuItems]);

  // Optimized scroll handler
  const handleCategoryScroll = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const offset = 220;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  // Get category icon
  const getCategoryIcon = useCallback((categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('açaí') || name.includes('acai')) return IceCream;
    if (name.includes('bebida') || name.includes('drink')) return Droplets;
    if (name.includes('café') || name.includes('coffee')) return Coffee;
    if (name.includes('lanche') || name.includes('sanduíche')) return Sandwich;
    if (name.includes('pizza')) return Pizza;
    if (name.includes('sobremesa') || name.includes('doce')) return Cake;
    return ShoppingCart;
  }, []);

  // Optimized add to cart with feedback
  const handleAddToCart = useCallback((item: MenuItem) => {
    addItem(item);
    toast.success(`${item.name} adicionado ao carrinho! 🛒`, {
      duration: 2000,
      style: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        border: 'none',
      }
    });
  }, [addItem]);

  // Handle image errors
  const handleImageError = useCallback((itemId: string) => {
    setImageErrors(prev => new Set([...prev, itemId]));
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Erro ao fazer logout");
        return;
      }
      toast.success("Logout realizado com sucesso! 👋");
      navigate("/auth");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Erro ao fazer logout");
    }
  }, [navigate]);

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



  const goToCheckout = useCallback(() => {
    if (cartState.items.length === 0) {
      toast.error("Adicione itens ao carrinho primeiro! 🛒");
      return;
    }
    navigate("/checkout");
  }, [cartState.items.length, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-[#FDD835] via-[#FFE082] to-[#FFF176]">
        {/* Background Image - Mobile Only */}
        <div 
          className="md:hidden fixed inset-0 bg-cover bg-top bg-no-repeat opacity-20"
          style={{
            backgroundImage: `url('/bck-menu.webp')`,
          }}
        />
        <div className="relative z-10 bg-white/95 backdrop-blur-sm px-8 py-6 rounded-3xl shadow-2xl border border-purple-200 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-purple-900 font-bold text-lg">Carregando cardápio...</p>
              <p className="text-purple-600 text-sm mt-1">Preparando delícias para você! 🥥</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Clean Minimal Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            {/* Logo */}
            <img 
              src={logo} 
              alt="Coco Loko" 
              className="h-10 md:h-12 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
            
            {/* Categories */}
            {categorizedItems.length > 0 && (
              <div className="flex items-center gap-1 md:gap-2 overflow-x-auto scrollbar-hide">
                {categorizedItems.map((category) => {
                  const isSelected = selectedCategory === category.id;
                  const CategoryIcon = getCategoryIcon(category.name);
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryScroll(category.id)}
                      className={`
                        flex-shrink-0 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all
                        ${isSelected 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      <span className="flex items-center gap-1">
                        <CategoryIcon className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">{category.name}</span>
                        <span className="text-xs opacity-75">({category.items.length})</span>
                      </span>
                    </button>
                  );
                })}
                
                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex-shrink-0 p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                  aria-label="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-16 md:pt-18 pb-32 space-y-6">
        {categorizedItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-4xl mb-3">🥥</div>
            <p className="text-gray-900 font-semibold text-lg">Nenhum item disponível</p>
          </div>
        ) : (
          categorizedItems.map((category) => (
            <div key={category.id} id={`category-${category.id}`} className="space-y-3 scroll-mt-20">
              {/* Minimal Category Title */}
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 pb-2 border-b border-gray-200 flex items-center gap-2">
                {(() => {
                  const CategoryIcon = getCategoryIcon(category.name);
                  return <CategoryIcon className="w-5 h-5 text-purple-600" />;
                })()}
                {category.name}
              </h2>

              {/* Enhanced Category Items */}
              <div className="grid gap-4">
                {category.items.map((item) => {
                  const quantity = getItemQuantity(item.id);
                  const hasImageError = imageErrors.has(item.id);
                  
                  return (
                    <div 
                      key={item.id} 
                      className="bg-white rounded-lg p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3 border border-gray-100"
                    >
                      {/* Image */}
                      <div 
                        className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer"
                        onClick={() => setSelectedItem(item)}
                      >
                        {item.image_url && !hasImageError ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={() => handleImageError(item.id)}
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-50">
                            <ShoppingCart className="w-6 h-6 text-purple-400" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setSelectedItem(item)}
                      >
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        )}
                        <p className="text-purple-600 font-bold text-base md:text-lg mt-1">
                          R$ {item.price.toFixed(2)}
                        </p>
                      </div>

                      {/* Add Button */}
                      <div className="flex-shrink-0">
                        {quantity > 0 ? (
                          <div className="flex items-center gap-2 bg-purple-50 rounded-lg p-1.5">
                            <button
                              onClick={() => removeItem(item.id)}
                              className="w-8 h-8 rounded-md bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
                              aria-label="Remover"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-bold text-purple-900 text-sm min-w-[20px] text-center">
                              {quantity}
                            </span>
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="w-8 h-8 rounded-md bg-green-500 hover:bg-green-600 text-white flex items-center justify-center"
                              aria-label="Adicionar"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleAddToCart(item)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium"
                            size="sm"
                          >
                            <Plus className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                            <span className="hidden md:inline">Adicionar</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Button */}
      {cartState.items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-6xl mx-auto">
            <Button
              onClick={goToCheckout}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 md:py-4 rounded-lg font-semibold text-sm md:text-base"
            >
              <div className="flex items-center justify-between w-full px-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Ver Carrinho ({getTotalItems()})</span>
                </div>
                <span className="font-bold">R$ {getTotalPrice().toFixed(2)}</span>
              </div>
            </Button>
          </div>
        </div>
      )}

      {/* Enhanced Product Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-lg bg-white/95 backdrop-blur-xl border-2 border-purple-200 rounded-3xl shadow-2xl">
          {selectedItem && (
            <>
              <DialogHeader className="text-center pb-4">
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {selectedItem.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Enhanced Product Image */}
                {selectedItem.image_url && !imageErrors.has(selectedItem.id) && (
                  <div className="w-full h-72 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-xl border-2 border-purple-100">
                    <img
                      src={selectedItem.image_url}
                      alt={selectedItem.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                      onError={() => handleImageError(selectedItem.id)}
                    />
                  </div>
                )}

                {/* Enhanced Description */}
                {selectedItem.description && (
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-2xl border border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      Descrição
                    </h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {selectedItem.description}
                    </p>
                  </div>
                )}



                {/* Enhanced Price and Actions */}
                <div className="bg-gradient-to-r from-white to-gray-50 p-6 rounded-2xl border-2 border-gray-200 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-bold text-emerald-600">
                      R$ {selectedItem.price.toFixed(2)}
                    </span>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 line-through">R$ {(selectedItem.price * 1.2).toFixed(2)}</div>
                      <div className="text-xs text-green-600 font-medium">Economize 20%</div>
                    </div>
                  </div>
                  
                  {/* Enhanced Add to Cart Button */}
                  {getItemQuantity(selectedItem.id) > 0 ? (
                    <div className="flex items-center justify-center gap-4 bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-2xl border border-purple-200">
                      <button
                        onClick={() => removeItem(selectedItem.id)}
                        className="w-12 h-12 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <div className="text-center px-4">
                        <span className="font-bold text-purple-900 text-2xl block">
                          {getItemQuantity(selectedItem.id)}
                        </span>
                        <span className="text-xs text-purple-600 font-medium">
                          no carrinho
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddToCart(selectedItem)}
                        className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        handleAddToCart(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-purple-500"
                    >
                      <Plus className="w-5 h-5 mr-2" />
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
