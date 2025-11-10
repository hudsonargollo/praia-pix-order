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
import { ShoppingCart } from "lucide-react";
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
      const offset = 220; // Account for fixed header with logo and category nav
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
      <div className="min-h-screen relative flex items-center justify-center bg-[#FDD835]">
        {/* Background Image - Mobile Only */}
        <div 
          className="md:hidden fixed inset-0 bg-cover bg-top bg-no-repeat"
          style={{
            backgroundImage: `url('/bck-menu.webp')`,
          }}
        />
        <div className="relative z-10 bg-white px-8 py-4 rounded-2xl shadow-2xl border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-purple-900 font-bold">Carregando cardápio...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-24 bg-[#FDD835]">
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

      {/* Fixed Header with Logo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-900 to-purple-700 shadow-xl">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <img 
              src={logo} 
              alt="Coco Loko Açaiteria" 
              className="h-16 md:h-20"
            />
          </div>
        </div>
      </div>

      {/* Enhanced Category Navigation */}
      {categories.length > 0 && (
        <div className="fixed top-24 md:top-28 left-0 right-0 z-40 bg-white/98 backdrop-blur-xl shadow-xl border-b border-purple-100">
          <div className="max-w-4xl mx-auto px-4 py-5">
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
                      group relative flex-shrink-0 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 whitespace-nowrap shadow-lg hover:shadow-xl
                      ${isSelected 
                        ? 'bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white transform scale-105 shadow-purple-300' 
                        : 'bg-gradient-to-r from-white to-gray-50 text-gray-700 hover:from-purple-50 hover:to-purple-100 hover:text-purple-700 border border-gray-200 hover:border-purple-200'
                      }
                    `}
                  >
                    <span className="relative z-10">{category.name}</span>
                    <div className={`
                      absolute inset-0 rounded-2xl transition-opacity duration-300
                      ${isSelected 
                        ? 'bg-gradient-to-r from-purple-400/20 to-purple-600/20' 
                        : 'bg-gradient-to-r from-purple-400/0 to-purple-600/0 group-hover:from-purple-400/10 group-hover:to-purple-600/10'
                      }
                    `} />
                    {/* Item count badge */}
                    <div className={`
                      absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-300
                      ${isSelected 
                        ? 'bg-white text-purple-700 shadow-lg' 
                        : 'bg-purple-600 text-white group-hover:bg-purple-700'
                      }
                    `}>
                      {categoryItems.length}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Menu Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-44 md:pt-48 pb-6 space-y-6">
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
              <div key={category.id} id={`category-${category.id}`} className="space-y-4 scroll-mt-48">
                {/* Enhanced Category Header */}
                <div className="text-center mb-2">
                  <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white px-8 py-4 rounded-2xl inline-block shadow-2xl border border-purple-500 relative overflow-hidden">
                    {/* Background pattern */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-purple-600/20" />
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <ShoppingCart className="w-3 h-3 text-white" />
                      </div>
                      <h2 className="font-bold text-lg uppercase tracking-wide">
                        {category.name}
                      </h2>
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {categoryItems.length}
                        </span>
                      </div>
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full opacity-80" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-pink-400 rounded-full opacity-60" />
                  </div>
                </div>

                {/* Enhanced Category Items */}
                <div className="space-y-4">
                  {categoryItems.map((item) => {
                    const quantity = getItemQuantity(item.id);
                    
                    return (
                      <div 
                        key={item.id} 
                        className="bg-white rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-4 border border-gray-100 hover:border-purple-200 group"
                      >
                        {/* Enhanced Item Image */}
                        <div 
                          className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 cursor-pointer flex-shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-lg"
                          onClick={() => setSelectedItem(item)}
                        >
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                              <ShoppingCart className="w-8 h-8 text-purple-500" />
                            </div>
                          )}
                        </div>

                        {/* Enhanced Item Info */}
                        <div 
                          className="flex-1 cursor-pointer transition-opacity duration-200 group-hover:opacity-90"
                          onClick={() => setSelectedItem(item)}
                        >
                          <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-purple-700 transition-colors">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          <p className="text-cyan-600 font-bold text-lg">
                            R$ {item.price.toFixed(2)}
                          </p>
                        </div>

                        {/* Enhanced Add Button */}
                        <div className="flex-shrink-0">
                          {quantity > 0 ? (
                            <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-3 border border-purple-200 shadow-lg">
                              <button
                                onClick={() => removeItem(item.id)}
                                className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white flex items-center justify-center font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                              >
                                -
                              </button>
                              <div className="text-center">
                                <span className="font-bold text-purple-900 text-lg block">
                                  {quantity}
                                </span>
                                <span className="text-xs text-purple-600 font-medium">
                                  no carrinho
                                </span>
                              </div>
                              <button
                                onClick={() => addToCart(item)}
                                className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white flex items-center justify-center font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => addToCart(item)}
                              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-purple-500"
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
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent z-50">
          <div className="max-w-4xl mx-auto">
            <Button
              onClick={goToCheckout}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-6 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-200 transform hover:scale-105"
            >
              <ShoppingCart className="mr-3 h-6 w-6" />
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
