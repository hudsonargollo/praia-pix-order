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
import { ShoppingCart, Plus, Minus, Star, Clock, LogOut, Coffee, Droplets, IceCream, Sandwich, Pizza, Cake } from "lucide-react";
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
    <div className="min-h-screen relative pb-32 md:pb-36 bg-gradient-to-br from-[#FDD835] via-[#FFE082] to-[#FFF176]">
      {/* Background Image - Mobile Only */}
      <div 
        className="md:hidden fixed inset-0 bg-cover bg-top bg-no-repeat opacity-30"
        style={{
          backgroundImage: `url('/bck-menu.webp')`,
        }}
      />

      {/* Single Sticky Header with Logo and Categories */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-900 via-purple-800 to-purple-700 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo on Left */}
            <div className="flex-shrink-0">
              <img 
                src={logo} 
                alt="Coco Loko" 
                className="h-12 md:h-14 drop-shadow-lg cursor-pointer"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              />
            </div>
            
            {/* Categories on Right */}
            {categorizedItems.length > 0 && (
              <div className="flex-1 flex items-center justify-end gap-2 overflow-x-auto scrollbar-hide">
                {categorizedItems.map((category) => {
                  const isSelected = selectedCategory === category.id;
                  const CategoryIcon = getCategoryIcon(category.name);
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryScroll(category.id)}
                      className={`
                        relative flex-shrink-0 px-3 md:px-4 py-2 rounded-xl font-semibold text-xs md:text-sm transition-all duration-300 whitespace-nowrap
                        ${isSelected 
                          ? 'bg-white text-purple-900 shadow-lg scale-105' 
                          : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        }
                      `}
                    >
                      <span className="flex items-center gap-1.5">
                        <CategoryIcon className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">{category.name}</span>
                      </span>
                      
                      {/* Item count badge */}
                      <div className={`
                        absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center
                        ${isSelected 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-yellow-400 text-purple-900'
                        }
                      `}>
                        {category.items.length}
                      </div>
                    </button>
                  );
                })}
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex-shrink-0 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl p-2 transition-all duration-300"
                  aria-label="Sair"
                >
                  <LogOut className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-20 md:pt-24 pb-6 space-y-8">
        {categorizedItems.length === 0 ? (
          <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl">
            <div className="text-6xl mb-4">🥥</div>
            <p className="text-purple-900 font-bold text-xl mb-2">Ops! Nenhuma categoria encontrada</p>
            <p className="text-purple-600">Estamos preparando nosso cardápio especial para você!</p>
          </div>
        ) : (
          categorizedItems.map((category) => (
            <div key={category.id} id={`category-${category.id}`} className="space-y-4 scroll-mt-24">
              {/* Simple Category Title */}
              <h2 className="text-2xl md:text-3xl font-bold text-purple-900 mb-4 flex items-center gap-3">
                {(() => {
                  const CategoryIcon = getCategoryIcon(category.name);
                  return <CategoryIcon className="w-7 h-7 text-purple-600" />;
                })()}
                {category.name}
                <span className="text-sm font-normal text-gray-500">({category.items.length})</span>
              </h2>

              {/* Enhanced Category Items */}
              <div className="grid gap-4">
                {category.items.map((item) => {
                  const quantity = getItemQuantity(item.id);
                  const hasImageError = imageErrors.has(item.id);
                  
                  return (
                    <div 
                      key={item.id} 
                      className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 md:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3 md:gap-5 border-2 border-gray-100 hover:border-purple-300 group transform hover:scale-[1.02]"
                    >
                      {/* Enhanced Item Image */}
                      <div 
                        className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 cursor-pointer flex-shrink-0 transition-all duration-300 group-hover:scale-110 shadow-xl border-2 border-white"
                        onClick={() => setSelectedItem(item)}
                      >
                        {item.image_url && !hasImageError ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={() => handleImageError(item.id)}
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 via-purple-200 to-purple-300">
                            <div className="text-center">
                              <ShoppingCart className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                              <Star className="w-3 h-3 text-yellow-500 mx-auto" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Enhanced Item Info */}
                      <div 
                        className="flex-1 cursor-pointer transition-all duration-200 group-hover:translate-x-1 min-w-0"
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="flex items-start gap-2 mb-1 md:mb-2">
                          <h3 className="font-bold text-gray-900 text-base md:text-xl group-hover:text-purple-700 transition-colors flex-1 truncate">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-1 text-yellow-500 flex-shrink-0">
                            <Star className="w-3 h-3 md:w-4 md:h-4 fill-current" />
                            <span className="text-xs text-gray-500 font-medium hidden md:inline">4.8</span>
                          </div>
                        </div>
                        
                        {item.description && (
                          <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3 line-clamp-1 md:line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 md:gap-3">
                          <p className="text-emerald-600 font-bold text-lg md:text-xl">
                            R$ {item.price.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-1 text-gray-500 text-xs hidden md:flex">
                            <Clock className="w-3 h-3" />
                            <span>5-10 min</span>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Add Button */}
                      <div className="flex-shrink-0">
                        {quantity > 0 ? (
                          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 bg-gradient-to-r from-purple-50 via-purple-100 to-purple-50 rounded-2xl md:rounded-3xl p-2 md:p-4 border-2 border-purple-200 shadow-xl">
                            <button
                              onClick={() => removeItem(item.id)}
                              className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
                              aria-label="Remover item"
                            >
                              <Minus className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                            <div className="text-center px-1 md:px-2">
                              <span className="font-bold text-purple-900 text-lg md:text-xl block">
                                {quantity}
                              </span>
                              <span className="text-xs text-purple-600 font-medium whitespace-nowrap hidden md:inline">
                                no carrinho
                              </span>
                            </div>
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
                              aria-label="Adicionar item"
                            >
                              <Plus className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleAddToCart(item)}
                            className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 text-white px-4 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-3xl font-bold text-xs md:text-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 border-2 border-purple-500 hover:border-purple-400"
                          >
                            <Plus className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
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

      {/* Fixed Cart Button at Bottom */}
      {cartState.items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 md:p-4 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-50 border-t-2 border-emerald-200">
          <div className="max-w-4xl mx-auto">
            <Button
              onClick={goToCheckout}
              className="w-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 text-white py-4 md:py-6 rounded-2xl md:rounded-3xl font-bold text-base md:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-emerald-400 relative overflow-hidden"
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-emerald-600/20 animate-pulse" />
              
              <div className="relative z-10 flex items-center justify-between px-2 md:px-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="bg-white/20 p-1.5 md:p-2 rounded-full">
                    <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm md:text-base">
                      Ver Carrinho ({getTotalItems()})
                    </div>
                    <div className="text-emerald-100 text-xs md:text-sm font-medium">
                      {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'}
                    </div>
                  </div>
                </div>
                <div className="font-bold text-lg md:text-xl">
                  R$ {getTotalPrice().toFixed(2)}
                </div>
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
                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-3">
                  <Star className="w-6 h-6 text-yellow-500 fill-current" />
                  {selectedItem.name}
                  <Star className="w-6 h-6 text-yellow-500 fill-current" />
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

                {/* Enhanced Rating and Info */}
                <div className="flex items-center justify-between bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-2xl border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map((star) => (
                        <Star key={star} className="w-4 h-4 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-600">4.8 (127 avaliações)</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>5-10 min</span>
                  </div>
                </div>

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
