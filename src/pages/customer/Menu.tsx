import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingCart, Plus, Minus, Clock, LogOut, Coffee, Droplets, IceCream, Sandwich, Pizza, Cake } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cartContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useSortingMode } from "@/hooks/useSortingMode";
import { useMenuSorting } from "@/hooks/useMenuSorting";
import { SortingToggle } from "@/components/SortingToggle";
import { SortableProductList } from "@/components/SortableProductList";
import { DraggableProductCard } from "@/components/DraggableProductCard";
import logo from "@/assets/coco-loko-logo.png";
import bckMenuImage from "@/assets/bck-menu.webp";
import headerImage from "@/assets/header.webp";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string;
  available: boolean;
  image_url: string | null;
  sort_order: number;
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
  
  // Admin and sorting hooks
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { isSortingMode, toggleSortingMode } = useSortingMode();
  const { updateSortOrder, reorderItems, isSaving } = useMenuSorting();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    console.log('🍽️ Menu component mounted');
    loadMenu();
  }, []);

  // Memoized category items for performance
  const categorizedItems = useMemo(() => {
    return categories.map(category => ({
      ...category,
      items: menuItems.filter(item => item.category_id === category.id)
    })).filter(category => category.items.length > 0);
  }, [categories, menuItems]);

  // Set initial active tab when categories load
  useEffect(() => {
    if (categorizedItems.length > 0 && !activeTab) {
      setActiveTab(categorizedItems[0].id);
    }
  }, [categorizedItems, activeTab]);

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

  // Handle product reordering
  const handleReorder = useCallback(async (categoryId: string, startIndex: number, endIndex: number) => {
    const categoryItems = menuItems.filter(item => item.category_id === categoryId);
    const reordered = reorderItems(categoryItems, startIndex, endIndex);
    
    // Update local state optimistically
    setMenuItems(prevItems => {
      const otherItems = prevItems.filter(item => item.category_id !== categoryId);
      return [...otherItems, ...reordered].sort((a, b) => {
        if (a.category_id !== b.category_id) {
          return a.category_id.localeCompare(b.category_id);
        }
        return a.sort_order - b.sort_order;
      });
    });
    
    // Save to database
    const updates = reordered.map((item, index) => ({
      id: item.id,
      sort_order: index
    }));
    
    const success = await updateSortOrder(updates);
    if (!success) {
      // Revert on failure
      loadMenu();
    }
  }, [menuItems, reorderItems, updateSortOrder]);

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
      console.log('📋 Loading menu data...');
      
      const { data: categoriesData, error: catError } = await supabase
        .from("menu_categories")
        .select("*")
        .order("display_order");

      if (catError) throw catError;

      const { data: itemsData, error: itemsError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("available", true)
        .order("category_id")
        .order("sort_order");

      if (itemsError) throw itemsError;

      console.log('✅ Menu loaded:', categoriesData?.length, 'categories,', itemsData?.length, 'items');
      setCategories(categoriesData || []);
      // Ensure sort_order exists on all items
      const itemsWithSortOrder = (itemsData || []).map(item => ({
        ...item,
        sort_order: (item as any).sort_order ?? 0
      })) as MenuItem[];
      setMenuItems(itemsWithSortOrder);
    } catch (error) {
      console.error("❌ Error loading menu:", error);
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
      <div className="min-h-screen relative flex items-center justify-center md:bg-gray-50">
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
    <div className="min-h-screen relative pb-24">
      {/* Background - Image on mobile, solid yellow on desktop */}
      <div className="fixed inset-0 md:bg-yellow-400">
        {/* Mobile background image */}
        <div 
          className="md:hidden absolute inset-0 bg-cover bg-top bg-no-repeat"
          style={{
            backgroundImage: `url(${bckMenuImage})`,
          }}
        />
      </div>

      {/* Header - Desktop: Logo + Categories, Mobile: Background Image */}
      <div className="fixed top-0 left-0 right-0 z-50 shadow-lg">
        {/* Mobile: Header Background Image */}
        <div 
          className="md:hidden bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${headerImage})`,
          }}
        >
          <div className="max-w-6xl mx-auto px-4 pt-32 pb-2">
            {/* Cart Badge - Top Right */}
            {getTotalItems() > 0 && (
              <div className="absolute right-16 top-4">
                <div className="bg-purple-600 text-white border-2 border-purple-300 shadow-lg animate-pulse-badge px-3 py-1.5 rounded-full font-bold text-sm flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4" />
                  <span>{getTotalItems()}</span>
                </div>
              </div>
            )}
            
            {/* Logout - Top Right */}
            <button
              onClick={handleLogout}
              className="absolute right-4 top-4 p-2 text-white hover:text-gray-200 hover:bg-white/20 rounded-full transition-all backdrop-blur-sm"
              aria-label="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
            
            {/* Category Navigation - Centered on Desktop, Scroll on Mobile */}
            {categorizedItems.length > 0 && (
              <div className="relative">
                <div className="flex items-center justify-start lg:justify-center gap-2 overflow-x-auto lg:overflow-x-visible scrollbar-hide pb-2 px-2 snap-x snap-mandatory lg:snap-none animate-[bounce-right_2s_ease-in-out_1]">
                  {categorizedItems.map((category) => {
                    const isSelected = selectedCategory === category.id;
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryScroll(category.id)}
                        className={`
                          flex-shrink-0 px-4 py-2 rounded-full transition-all font-medium text-sm snap-start lg:snap-align-none
                          ${isSelected 
                            ? 'bg-purple-500 text-white shadow-md' 
                            : 'bg-white/80 text-gray-700 hover:bg-white shadow-sm backdrop-blur-sm'
                          }
                        `}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                  
                  {/* Sorting Toggle - Mobile */}
                  {isAdmin && !adminLoading && (
                    <div className="flex-shrink-0 snap-start">
                      <SortingToggle
                        isSortingMode={isSortingMode}
                        onToggle={toggleSortingMode}
                        disabled={isSaving}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop: Gradient header with logo, title, and categories */}
        <div className="hidden md:block bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 shadow-xl">
          <div className="max-w-7xl mx-auto px-6 py-4">
            {/* Top Row: Logo, Title, Cart, Logout */}
            <div className="flex items-center justify-between mb-6">
              {/* Logo and Title */}
              <div className="flex items-center gap-4">
                <img 
                  src={logo} 
                  alt="Coco Loko" 
                  className="h-16 w-auto drop-shadow-lg"
                />
                <h1 className="text-3xl font-bold text-white drop-shadow-md">
                  Cardápio
                </h1>
              </div>
              
              {/* Right Side: Cart Badge and Logout */}
              <div className="flex items-center gap-4">
                {/* Cart Badge - Desktop */}
                {getTotalItems() > 0 && (
                  <div className="bg-white text-purple-700 border-2 border-purple-300 shadow-lg animate-pulse-badge px-4 py-2 rounded-full font-bold text-base flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    <span>{getTotalItems()}</span>
                  </div>
                )}
                
                <button
                  onClick={handleLogout}
                  className="p-2.5 text-white hover:text-white/80 hover:bg-white/20 rounded-full transition-all"
                  aria-label="Sair"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Cart Button - Top Position */}
      {cartState.items.length > 0 && (
        <div className="fixed top-[180px] md:top-[120px] left-0 right-0 p-4 z-30 animate-in slide-in-from-top duration-300">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={goToCheckout}
              className="w-full bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-800 hover:to-purple-700 text-white py-4 rounded-2xl font-bold text-base shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between w-full px-2">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-6 w-6" />
                  <span>Ver Carrinho ({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'})</span>
                </div>
                <span className="font-bold text-lg">R$ {getTotalPrice().toFixed(2)}</span>
              </div>
            </Button>
          </div>
        </div>
      )}

      {/* Menu Content - Adjusted padding for fixed header and cart */}
      <div className={`relative z-10 max-w-2xl lg:max-w-6xl mx-auto px-4 pb-8 ${cartState.items.length > 0 ? 'pt-64 md:pt-52' : 'pt-48 md:pt-36'}`}>
        {categorizedItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-4xl mb-3">🥥</div>
            <p className="text-gray-900 font-semibold text-lg">Nenhum item disponível</p>
          </div>
        ) : (
          <>
            {/* Mobile: Scrollable List */}
            <div className="md:hidden space-y-6">
              {categorizedItems.map((category) => (
                <div key={category.id} id={`category-${category.id}`} className="space-y-4 scroll-mt-20">
                  {/* Category Header - Purple Badge Style */}
                  <div className="bg-gradient-to-r from-purple-700 to-purple-600 text-white px-4 py-2 rounded-full inline-block shadow-md">
                    <h2 className="text-sm font-bold uppercase tracking-wide">
                      {category.name}
                    </h2>
                  </div>

                  {/* Category Items - Clean Cards */}
                  <SortableProductList
                    items={category.items}
                    categoryId={category.id}
                    onReorder={(startIndex, endIndex) => handleReorder(category.id, startIndex, endIndex)}
                  >
                    <div className="grid grid-cols-1 gap-3">
                      {category.items.map((item) => {
                        const quantity = getItemQuantity(item.id);
                        const hasImageError = imageErrors.has(item.id);
                        
                        return (
                          <DraggableProductCard
                            key={item.id}
                            item={item}
                            isSortingMode={isSortingMode}
                          >
                            <div 
                              className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all flex flex-col h-full"
                            >
                      {/* Image */}
                      <div 
                        className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer mb-3"
                        onClick={() => setSelectedItem(item)}
                      >
                        {item.image_url && !hasImageError ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={() => handleImageError(item.id)}
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-50">
                            <ShoppingCart className="w-12 h-12 text-purple-400" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div 
                        className="flex-1 cursor-pointer mb-3"
                        onClick={() => setSelectedItem(item)}
                      >
                        <h3 className="font-bold text-gray-900 text-base line-clamp-2 mb-1">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {item.description}
                          </p>
                        )}
                        <p className="text-purple-600 font-bold text-xl">
                          R$ {item.price.toFixed(2)}
                        </p>
                      </div>

                      {/* Add/Quantity Controls */}
                      <div className="w-full">
                        {quantity > 0 ? (
                          <div className="space-y-2">
                            {/* Quantity Controls */}
                            <div className="flex items-center justify-center gap-3 bg-purple-50 rounded-xl p-2">
                              <button
                                onClick={() => removeItem(item.id)}
                                className="w-10 h-10 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all"
                                aria-label="Remover um"
                                disabled={isSortingMode}
                              >
                                <Minus className="w-5 h-5" />
                              </button>
                              <span className="font-bold text-purple-900 text-xl min-w-[32px] text-center">
                                {quantity}
                              </span>
                              <button
                                onClick={() => handleAddToCart(item)}
                                className="w-10 h-10 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-all"
                                aria-label="Adicionar mais"
                                disabled={isSortingMode}
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>
                            {/* Remove All Button */}
                            <button
                              onClick={() => {
                                for (let i = 0; i < quantity; i++) {
                                  removeItem(item.id);
                                }
                                toast.success(`${item.name} removido do carrinho`);
                              }}
                              className="w-full px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-all"
                              disabled={isSortingMode}
                            >
                              Remover Todos
                            </button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleAddToCart(item)}
                            className={`w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all ${isSortingMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isSortingMode}
                          >
                            Adicionar
                          </Button>
                        )}
                      </div>
                    </div>
                      </DraggableProductCard>
                    );
                  })}
                    </div>
                  </SortableProductList>
                </div>
              ))}
            </div>

            {/* Desktop/Tablet: Tabs */}
            <div className="hidden md:block">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start bg-white/80 backdrop-blur-sm p-2 rounded-2xl shadow-lg mb-6 flex-wrap h-auto gap-2">
                  {categorizedItems.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="px-6 py-3 rounded-xl font-semibold text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                    >
                      {category.name}
                    </TabsTrigger>
                  ))}
                  
                  {/* Sorting Toggle - Desktop Tabs */}
                  {isAdmin && !adminLoading && (
                    <div className="ml-auto">
                      <SortingToggle
                        isSortingMode={isSortingMode}
                        onToggle={toggleSortingMode}
                        disabled={isSaving}
                      />
                    </div>
                  )}
                </TabsList>

                {categorizedItems.map((category) => (
                  <TabsContent key={category.id} value={category.id} className="mt-0">
                    <SortableProductList
                      items={category.items}
                      categoryId={category.id}
                      onReorder={(startIndex, endIndex) => handleReorder(category.id, startIndex, endIndex)}
                    >
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {category.items.map((item) => {
                          const quantity = getItemQuantity(item.id);
                          const hasImageError = imageErrors.has(item.id);
                          
                          return (
                            <DraggableProductCard
                              key={item.id}
                              item={item}
                              isSortingMode={isSortingMode}
                            >
                              <div 
                                className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all flex flex-col h-full"
                              >
                      {/* Image */}
                      <div 
                        className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer mb-3"
                        onClick={() => setSelectedItem(item)}
                      >
                        {item.image_url && !hasImageError ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={() => handleImageError(item.id)}
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-50">
                            <ShoppingCart className="w-12 h-12 text-purple-400" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div 
                        className="flex-1 cursor-pointer mb-3"
                        onClick={() => setSelectedItem(item)}
                      >
                        <h3 className="font-bold text-gray-900 text-lg line-clamp-2 mb-1">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {item.description}
                          </p>
                        )}
                        <p className="text-purple-600 font-bold text-xl">
                          R$ {item.price.toFixed(2)}
                        </p>
                      </div>

                      {/* Add/Quantity Controls */}
                      <div className="w-full">
                        {quantity > 0 ? (
                          <div className="space-y-2">
                            {/* Quantity Controls */}
                            <div className="flex items-center justify-center gap-3 bg-purple-50 rounded-xl p-2">
                              <button
                                onClick={() => removeItem(item.id)}
                                className="w-10 h-10 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all"
                                aria-label="Remover um"
                                disabled={isSortingMode}
                              >
                                <Minus className="w-5 h-5" />
                              </button>
                              <span className="font-bold text-purple-900 text-xl min-w-[32px] text-center">
                                {quantity}
                              </span>
                              <button
                                onClick={() => handleAddToCart(item)}
                                className="w-10 h-10 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-all"
                                aria-label="Adicionar mais"
                                disabled={isSortingMode}
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>
                            {/* Remove All Button */}
                            <button
                              onClick={() => {
                                for (let i = 0; i < quantity; i++) {
                                  removeItem(item.id);
                                }
                                toast.success(`${item.name} removido do carrinho`);
                              }}
                              className="w-full px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-all"
                              disabled={isSortingMode}
                            >
                              Remover Todos
                            </button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleAddToCart(item)}
                            className={`w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all ${isSortingMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isSortingMode}
                          >
                            Adicionar
                          </Button>
                        )}
                      </div>
                    </div>
                            </DraggableProductCard>
                          );
                        })}
                      </div>
                    </SortableProductList>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </>
        )}
      </div>



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
