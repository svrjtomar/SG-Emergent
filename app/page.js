'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  ShoppingBag, Heart, Search, Menu, X, User, Package, 
  ChevronRight, Minus, Plus, Trash2, CreditCard, Truck,
  Home, Grid3X3, Settings, LogOut, TrendingUp, DollarSign,
  ShoppingCart, ArrowRight, Star, Filter, ChevronDown
} from 'lucide-react';

// ============== STORE CONTEXT ==============
const useStore = () => {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [wishlist, setWishlist] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage
    const savedUser = localStorage.getItem('sevenghost_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      fetchCart(userData.id);
      fetchWishlist(userData.id);
    }
    fetchProducts();
    seedDatabase();
  }, []);

  const seedDatabase = async () => {
    try {
      await fetch('/api/seed');
    } catch (e) {
      console.log('Seed check:', e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e) {
      console.error('Error fetching products:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async (userId) => {
    try {
      const res = await fetch(`/api/cart/${userId}`);
      const data = await res.json();
      setCart(data.cart || { items: [], total: 0 });
    } catch (e) {
      console.error('Error fetching cart:', e);
    }
  };

  const fetchWishlist = async (userId) => {
    try {
      const res = await fetch(`/api/wishlist/${userId}`);
      const data = await res.json();
      setWishlist(data.wishlist?.items || []);
    } catch (e) {
      console.error('Error fetching wishlist:', e);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('sevenghost_user', JSON.stringify(data.user));
        fetchCart(data.user.id);
        fetchWishlist(data.user.id);
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const logout = () => {
    setUser(null);
    setCart({ items: [], total: 0 });
    setWishlist([]);
    localStorage.removeItem('sevenghost_user');
  };

  const addToCart = async (productId, size) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return false;
    }
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId, size })
      });
      const data = await res.json();
      if (data.cart) {
        setCart(data.cart);
        toast.success('Added to cart!');
        return true;
      }
    } catch (e) {
      toast.error('Failed to add to cart');
    }
    return false;
  };

  const removeFromCart = async (itemId) => {
    if (!user) return;
    try {
      const res = await fetch('/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, itemId })
      });
      const data = await res.json();
      if (data.cart) {
        setCart(data.cart);
        toast.success('Removed from cart');
      }
    } catch (e) {
      toast.error('Failed to remove item');
    }
  };

  const updateCartQuantity = async (itemId, quantity) => {
    if (!user) return;
    try {
      const res = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, itemId, quantity })
      });
      const data = await res.json();
      if (data.cart) {
        setCart(data.cart);
      }
    } catch (e) {
      toast.error('Failed to update quantity');
    }
  };

  const toggleWishlist = async (productId) => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }
    try {
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId })
      });
      const data = await res.json();
      if (data.wishlist) {
        setWishlist(data.wishlist.items);
        if (data.wishlist.items.includes(productId)) {
          toast.success('Added to wishlist');
        } else {
          toast.success('Removed from wishlist');
        }
      }
    } catch (e) {
      toast.error('Failed to update wishlist');
    }
  };

  return {
    user, cart, wishlist, products, loading,
    login, logout, addToCart, removeFromCart, updateCartQuantity, toggleWishlist,
    setCart, fetchProducts, fetchCart
  };
};

// ============== COMPONENTS ==============

// Header Component
const Header = ({ store, currentPage, setCurrentPage, setShowAuth }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredProducts = store.products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile Menu */}
          <button 
            className="md:hidden p-2" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <motion.div 
            className="flex-1 md:flex-none text-center md:text-left"
            whileHover={{ scale: 1.02 }}
          >
            <h1 
              className="text-xl md:text-2xl font-bold tracking-wider cursor-pointer"
              onClick={() => setCurrentPage('home')}
            >
              SEVENGHOST
            </h1>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setCurrentPage('home')} 
              className={`text-sm font-medium tracking-wide hover:text-black/60 transition ${currentPage === 'home' ? 'text-black' : 'text-black/80'}`}
            >
              HOME
            </button>
            <button 
              onClick={() => setCurrentPage('shop')} 
              className={`text-sm font-medium tracking-wide hover:text-black/60 transition ${currentPage === 'shop' ? 'text-black' : 'text-black/80'}`}
            >
              SHOP
            </button>
            {store.user?.role === 'admin' && (
              <button 
                onClick={() => setCurrentPage('admin')} 
                className={`text-sm font-medium tracking-wide hover:text-black/60 transition ${currentPage === 'admin' ? 'text-black' : 'text-black/80'}`}
              >
                ADMIN
              </button>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search */}
            <div className="relative">
              <button 
                onClick={() => setSearchOpen(!searchOpen)} 
                className="p-2 hover:bg-muted rounded-full transition"
              >
                <Search size={20} />
              </button>
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-white shadow-lg rounded-lg border p-3 z-50"
                  >
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mb-2"
                      autoFocus
                    />
                    {searchQuery && filteredProducts.length > 0 && (
                      <div className="space-y-2">
                        {filteredProducts.map(product => (
                          <button
                            key={product.id}
                            className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-lg text-left"
                            onClick={() => {
                              setCurrentPage({ page: 'product', id: product.id });
                              setSearchOpen(false);
                              setSearchQuery('');
                            }}
                          >
                            <img src={product.images[0]} alt={product.name} className="w-10 h-10 object-cover rounded" />
                            <div>
                              <p className="text-sm font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">₹{product.price}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wishlist */}
            <button 
              onClick={() => store.user ? setCurrentPage('wishlist') : setShowAuth(true)} 
              className="p-2 hover:bg-muted rounded-full transition relative"
            >
              <Heart size={20} />
              {store.wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center">
                  {store.wishlist.length}
                </span>
              )}
            </button>

            {/* Cart */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-muted rounded-full transition relative">
                  <ShoppingBag size={20} />
                  {store.cart.items.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center">
                      {store.cart.items.length}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Your Cart ({store.cart.items.length})</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col h-[calc(100vh-200px)]">
                  {store.cart.items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                      <ShoppingBag size={48} className="mb-4 opacity-50" />
                      <p>Your cart is empty</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-auto space-y-4">
                        {store.cart.items.map(item => (
                          <div key={item.id} className="flex gap-4 p-3 bg-muted/50 rounded-lg">
                            <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                              <p className="text-sm font-semibold mt-1">₹{item.price}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <button 
                                  onClick={() => store.updateCartQuantity(item.id, item.quantity - 1)}
                                  className="w-6 h-6 rounded border flex items-center justify-center hover:bg-white"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="text-sm w-6 text-center">{item.quantity}</span>
                                <button 
                                  onClick={() => store.updateCartQuantity(item.id, item.quantity + 1)}
                                  className="w-6 h-6 rounded border flex items-center justify-center hover:bg-white"
                                >
                                  <Plus size={12} />
                                </button>
                                <button 
                                  onClick={() => store.removeFromCart(item.id)}
                                  className="ml-auto text-red-500 hover:text-red-700"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 border-t mt-4">
                        <div className="flex justify-between text-lg font-semibold mb-4">
                          <span>Total</span>
                          <span>₹{store.cart.total}</span>
                        </div>
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={() => setCurrentPage('checkout')}
                        >
                          Checkout <ArrowRight className="ml-2" size={18} />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* User */}
            {store.user ? (
              <Dialog>
                <DialogTrigger asChild>
                  <button className="p-2 hover:bg-muted rounded-full transition">
                    <User size={20} />
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>My Account</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-medium">{store.user.name}</p>
                      <p className="text-sm text-muted-foreground">{store.user.email}</p>
                      {store.user.role === 'admin' && (
                        <Badge className="mt-2">Admin</Badge>
                      )}
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => setCurrentPage('orders')}>
                      <Package className="mr-2" size={18} /> My Orders
                    </Button>
                    <Button variant="destructive" className="w-full" onClick={store.logout}>
                      <LogOut className="mr-2" size={18} /> Logout
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <button 
                onClick={() => setShowAuth(true)} 
                className="p-2 hover:bg-muted rounded-full transition"
              >
                <User size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t"
            >
              <nav className="py-4 space-y-2">
                <button 
                  onClick={() => { setCurrentPage('home'); setMobileMenuOpen(false); }} 
                  className="block w-full text-left px-4 py-2 hover:bg-muted rounded"
                >
                  Home
                </button>
                <button 
                  onClick={() => { setCurrentPage('shop'); setMobileMenuOpen(false); }} 
                  className="block w-full text-left px-4 py-2 hover:bg-muted rounded"
                >
                  Shop
                </button>
                {store.user?.role === 'admin' && (
                  <button 
                    onClick={() => { setCurrentPage('admin'); setMobileMenuOpen(false); }} 
                    className="block w-full text-left px-4 py-2 hover:bg-muted rounded"
                  >
                    Admin Panel
                  </button>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

// Auth Modal
const AuthModal = ({ show, onClose, store }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await store.login(email, password);
    setLoading(false);
    if (result.success) {
      toast.success(`Welcome, ${result.user.name}!`);
      onClose();
    } else {
      toast.error(result.error || 'Authentication failed');
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-black font-medium ml-1 hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
        <p className="text-center text-xs text-muted-foreground mt-4 p-3 bg-muted rounded-lg">
          <strong>Demo Admin:</strong> admin@sevenghost.com (any password)
        </p>
      </motion.div>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, onClick, onWishlist, isWishlisted }) => {
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative overflow-hidden rounded-lg bg-[#f5f5f5] aspect-[3/4]">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <button
          onClick={(e) => { e.stopPropagation(); onWishlist(product.id); }}
          className={`absolute top-3 right-3 p-2 rounded-full transition ${isWishlisted ? 'bg-black text-white' : 'bg-white/80 hover:bg-white'}`}
        >
          <Heart size={18} fill={isWishlisted ? 'white' : 'none'} />
        </button>
        {discount > 0 && (
          <Badge className="absolute top-3 left-3 bg-black text-white">
            -{discount}%
          </Badge>
        )}
      </div>
      <div className="mt-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{product.type}</p>
        <h3 className="font-medium mt-1 line-clamp-1">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-semibold">₹{product.price}</span>
          {product.originalPrice > product.price && (
            <span className="text-sm text-muted-foreground line-through">₹{product.originalPrice}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Home Page
const HomePage = ({ store, setCurrentPage }) => {
  const featuredProducts = store.products.filter(p => p.featured).slice(0, 4);
  const categories = [
    { id: 'plain', name: 'Plain T-Shirts', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600', desc: 'Timeless essentials' },
    { id: 'printed', name: 'Printed T-Shirts', image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600', desc: 'Express yourself' },
    { id: 'polo', name: 'Polo T-Shirts', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600', desc: 'Refined elegance' }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[90vh] md:h-screen overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1611042553484-d61f84d22784?w=1920" 
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="relative h-full container mx-auto px-4 flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl text-white"
          >
            <h2 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
              Wear Your<br />Identity
            </h2>
            <p className="text-lg md:text-xl text-white/80 mb-8">
              Premium quality t-shirts designed for those who appreciate minimal aesthetics and superior comfort.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-white/90"
                onClick={() => setCurrentPage('shop')}
              >
                Shop Collection
                <ArrowRight className="ml-2" size={18} />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10"
              >
                Explore Styles
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-3">Shop by Category</h3>
          <p className="text-muted-foreground">Find your perfect style</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group cursor-pointer"
              onClick={() => setCurrentPage({ page: 'shop', filter: { type: cat.id } })}
            >
              <div className="relative overflow-hidden rounded-xl aspect-[4/5]">
                <img 
                  src={cat.image} 
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-sm opacity-80 mb-1">{cat.desc}</p>
                  <h4 className="text-xl font-semibold flex items-center">
                    {cat.name}
                    <ChevronRight className="ml-2 transition-transform group-hover:translate-x-2" size={20} />
                  </h4>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24 bg-[#f5f5f5]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-between items-end mb-12"
          >
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">Featured Collection</h3>
              <p className="text-muted-foreground">Handpicked styles for you</p>
            </div>
            <Button variant="outline" onClick={() => setCurrentPage('shop')}>
              View All <ChevronRight className="ml-1" size={16} />
            </Button>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <ProductCard
                  product={product}
                  onClick={() => setCurrentPage({ page: 'product', id: product.id })}
                  onWishlist={store.toggleWishlist}
                  isWishlisted={store.wishlist.includes(product.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner */}
      <section className="py-16 md:py-24 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl bg-black text-white"
        >
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?w=1200" 
              alt="Banner"
              className="w-full h-full object-cover opacity-50"
            />
          </div>
          <div className="relative p-8 md:p-16 text-center">
            <h3 className="text-3xl md:text-5xl font-bold mb-4">New Season Arrivals</h3>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Discover our latest collection featuring premium fabrics and contemporary designs.
            </p>
            <Button size="lg" className="bg-white text-black hover:bg-white/90">
              Shop New Arrivals
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-xl font-bold mb-4">SEVENGHOST</h4>
              <p className="text-white/60 text-sm">Premium fashion for the modern individual. Quality meets style.</p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Quick Links</h5>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><button className="hover:text-white">Shop All</button></li>
                <li><button className="hover:text-white">New Arrivals</button></li>
                <li><button className="hover:text-white">Best Sellers</button></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Help</h5>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><button className="hover:text-white">Contact Us</button></li>
                <li><button className="hover:text-white">Shipping Info</button></li>
                <li><button className="hover:text-white">Returns</button></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Newsletter</h5>
              <p className="text-white/60 text-sm mb-3">Get updates on new arrivals</p>
              <div className="flex gap-2">
                <Input placeholder="Email" className="bg-white/10 border-white/20 text-white" />
                <Button>Join</Button>
              </div>
            </div>
          </div>
          <Separator className="bg-white/20 mb-8" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
            <p>© 2025 SevenGhost. All rights reserved.</p>
            <p className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">
              ⚡ MOCK MODE - Demo Version
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Shop Page
const ShopPage = ({ store, setCurrentPage, initialFilter }) => {
  const [filters, setFilters] = useState({
    category: initialFilter?.category || 'all',
    type: initialFilter?.type || 'all',
    priceRange: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  const filteredProducts = store.products.filter(product => {
    if (filters.category !== 'all' && product.category !== filters.category) return false;
    if (filters.type !== 'all' && product.type !== filters.type) return false;
    if (filters.priceRange === 'under1500' && product.price >= 1500) return false;
    if (filters.priceRange === '1500to2000' && (product.price < 1500 || product.price > 2000)) return false;
    if (filters.priceRange === 'above2000' && product.price <= 2000) return false;
    return true;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-[#f5f5f5] py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-center"
          >
            Shop Collection
          </motion.h1>
          <p className="text-center text-muted-foreground mt-2">{filteredProducts.length} products</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Bar */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden"
          >
            <Filter size={18} className="mr-2" /> Filters
          </Button>
          
          <div className="hidden md:flex items-center gap-4">
            <Select value={filters.category} onValueChange={(v) => setFilters({...filters, category: v})}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="women">Women</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.type} onValueChange={(v) => setFilters({...filters, type: v})}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="plain">Plain</SelectItem>
                <SelectItem value="printed">Printed</SelectItem>
                <SelectItem value="polo">Polo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priceRange} onValueChange={(v) => setFilters({...filters, priceRange: v})}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under1500">Under ₹1500</SelectItem>
                <SelectItem value="1500to2000">₹1500 - ₹2000</SelectItem>
                <SelectItem value="above2000">Above ₹2000</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden mb-6 overflow-hidden"
            >
              <div className="p-4 bg-muted rounded-lg space-y-4">
                <Select value={filters.category} onValueChange={(v) => setFilters({...filters, category: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="men">Men</SelectItem>
                    <SelectItem value="women">Women</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.type} onValueChange={(v) => setFilters({...filters, type: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="plain">Plain</SelectItem>
                    <SelectItem value="printed">Printed</SelectItem>
                    <SelectItem value="polo">Polo</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.priceRange} onValueChange={(v) => setFilters({...filters, priceRange: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="under1500">Under ₹1500</SelectItem>
                    <SelectItem value="1500to2000">₹1500 - ₹2000</SelectItem>
                    <SelectItem value="above2000">Above ₹2000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <ProductCard
                product={product}
                onClick={() => setCurrentPage({ page: 'product', id: product.id })}
                onWishlist={store.toggleWishlist}
                isWishlisted={store.wishlist.includes(product.id)}
              />
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No products found with selected filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Product Detail Page
const ProductPage = ({ store, productId, setCurrentPage }) => {
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const product = store.products.find(p => p.id === productId);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Product not found</p>
      </div>
    );
  }

  const relatedProducts = store.products
    .filter(p => p.type === product.type && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    const success = await store.addToCart(product.id, selectedSize);
    if (success) {
      setSelectedSize('');
    }
  };

  const handleBuyNow = async () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    const success = await store.addToCart(product.id, selectedSize);
    if (success) {
      setCurrentPage('checkout');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <button onClick={() => setCurrentPage('home')} className="hover:text-black">Home</button>
          <ChevronRight size={14} />
          <button onClick={() => setCurrentPage('shop')} className="hover:text-black">Shop</button>
          <ChevronRight size={14} />
          <span className="text-black">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#f5f5f5]">
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <p className="text-sm text-muted-foreground uppercase tracking-wide">{product.category} • {product.type}</p>
            <h1 className="text-2xl md:text-3xl font-bold mt-2">{product.name}</h1>
            
            <div className="flex items-center gap-3 mt-4">
              <span className="text-2xl font-bold">₹{product.price}</span>
              {product.originalPrice > product.price && (
                <>
                  <span className="text-lg text-muted-foreground line-through">₹{product.originalPrice}</span>
                  <Badge className="bg-green-100 text-green-800">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </Badge>
                </>
              )}
            </div>

            <p className="text-muted-foreground mt-4">{product.description}</p>

            <Separator className="my-6" />

            {/* Size Selection */}
            <div>
              <p className="font-medium mb-3">Select Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 rounded-lg border-2 font-medium transition ${
                      selectedSize === size 
                        ? 'border-black bg-black text-white' 
                        : 'border-border hover:border-black'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button size="lg" className="flex-1" onClick={handleAddToCart}>
                <ShoppingBag className="mr-2" size={18} />
                Add to Cart
              </Button>
              <Button size="lg" variant="outline" className="flex-1" onClick={handleBuyNow}>
                Buy Now
              </Button>
            </div>

            <button 
              onClick={() => store.toggleWishlist(product.id)}
              className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground hover:text-black"
            >
              <Heart size={18} fill={store.wishlist.includes(product.id) ? 'currentColor' : 'none'} />
              {store.wishlist.includes(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>

            {/* Features */}
            <div className="mt-8 p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Truck size={18} />
                <span>Free shipping on orders above ₹999</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Package size={18} />
                <span>Easy 7-day returns</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onClick={() => setCurrentPage({ page: 'product', id: p.id })}
                  onWishlist={store.toggleWishlist}
                  isWishlisted={store.wishlist.includes(p.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Checkout Page
const CheckoutPage = ({ store, setCurrentPage }) => {
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (!address.name || !address.phone || !address.addressLine || !address.city || !address.pincode) {
      toast.error('Please fill all address fields');
      return;
    }

    setLoading(true);

    try {
      if (paymentMethod === 'razorpay') {
        // Mock Razorpay payment
        toast.info('🔔 MOCK MODE: Simulating Razorpay payment...');
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Create order
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: store.user.id,
          items: store.cart.items,
          address,
          paymentMethod,
          total: store.cart.total
        })
      });

      const data = await res.json();
      if (data.order) {
        store.setCart({ items: [], total: 0 });
        toast.success('Order placed successfully!');
        setCurrentPage('orders');
      } else {
        toast.error('Failed to place order');
      }
    } catch (e) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!store.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please login to checkout</p>
          <Button onClick={() => setCurrentPage('home')}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (store.cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Your cart is empty</p>
          <Button onClick={() => setCurrentPage('shop')}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-8">Checkout</h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Address */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-4">Delivery Address</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <Input 
                      value={address.name}
                      onChange={(e) => setAddress({...address, name: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <Input 
                      value={address.phone}
                      onChange={(e) => setAddress({...address, phone: e.target.value})}
                      placeholder="9876543210"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium">Address</label>
                    <Input 
                      value={address.addressLine}
                      onChange={(e) => setAddress({...address, addressLine: e.target.value})}
                      placeholder="House no, Street, Area"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">City</label>
                    <Input 
                      value={address.city}
                      onChange={(e) => setAddress({...address, city: e.target.value})}
                      placeholder="Mumbai"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">State</label>
                    <Input 
                      value={address.state}
                      onChange={(e) => setAddress({...address, state: e.target.value})}
                      placeholder="Maharashtra"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Pincode</label>
                    <Input 
                      value={address.pincode}
                      onChange={(e) => setAddress({...address, pincode: e.target.value})}
                      placeholder="400001"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                    paymentMethod === 'razorpay' ? 'border-black bg-black/5' : 'border-border'
                  }`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={paymentMethod === 'razorpay'}
                      onChange={() => setPaymentMethod('razorpay')}
                      className="w-4 h-4"
                    />
                    <CreditCard size={20} />
                    <div>
                      <p className="font-medium">Pay Online (Razorpay)</p>
                      <p className="text-xs text-muted-foreground">Cards, UPI, Net Banking, Wallets</p>
                    </div>
                    <Badge className="ml-auto bg-yellow-100 text-yellow-800">MOCK</Badge>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                    paymentMethod === 'cod' ? 'border-black bg-black/5' : 'border-border'
                  }`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="w-4 h-4"
                    />
                    <Truck size={20} />
                    <div>
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">Pay when you receive</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="font-semibold mb-4">Order Summary</h2>
                <div className="space-y-3 mb-4">
                  {store.cart.items.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Size: {item.size} × {item.quantity}</p>
                        <p className="text-sm font-semibold">₹{item.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{store.cart.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₹{store.cart.total}</span>
                </div>
                <Button 
                  className="w-full mt-6" 
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Orders Page
const OrdersPage = ({ store, setCurrentPage }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (store.user) {
      fetchOrders();
    }
  }, [store.user]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders/${store.user.id}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!store.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please login to view orders</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-8">My Orders</h1>
        
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-32 bg-white rounded-lg animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No orders yet</p>
              <Button onClick={() => setCurrentPage('shop')}>Start Shopping</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                      <Badge variant="outline">
                        {order.paymentMethod === 'cod' ? 'COD' : 'Paid'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {order.items.map(item => (
                      <div key={item.id} className="flex gap-3">
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Size: {item.size} × {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {order.address.city}, {order.address.state}
                    </p>
                    <p className="font-semibold">₹{order.total}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Wishlist Page
const WishlistPage = ({ store, setCurrentPage }) => {
  const wishlistedProducts = store.products.filter(p => store.wishlist.includes(p.id));

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-8">My Wishlist ({wishlistedProducts.length})</h1>
        
        {wishlistedProducts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Heart size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
              <Button onClick={() => setCurrentPage('shop')}>Explore Products</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {wishlistedProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setCurrentPage({ page: 'product', id: product.id })}
                onWishlist={store.toggleWishlist}
                isWishlisted={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Admin Page
const AdminPage = ({ store }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'men',
    type: 'plain',
    price: '',
    originalPrice: '',
    images: '',
    sizes: 'S,M,L,XL',
    stock: '',
    description: ''
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsRes, ordersRes, productsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/orders'),
        fetch('/api/products')
      ]);
      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();
      
      setStats(statsData.stats);
      setOrders(ordersData.orders || []);
      setProducts(productsData.products || []);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          price: parseInt(newProduct.price),
          originalPrice: parseInt(newProduct.originalPrice) || parseInt(newProduct.price),
          images: newProduct.images.split(',').map(url => url.trim()),
          sizes: newProduct.sizes.split(',').map(s => s.trim()),
          stock: parseInt(newProduct.stock) || 0
        })
      });
      const data = await res.json();
      if (data.product) {
        toast.success('Product added!');
        setShowAddProduct(false);
        setNewProduct({
          name: '',
          category: 'men',
          type: 'plain',
          price: '',
          originalPrice: '',
          images: '',
          sizes: 'S,M,L,XL',
          stock: '',
          description: ''
        });
        fetchAdminData();
        store.fetchProducts();
      }
    } catch (e) {
      toast.error('Failed to add product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Delete this product?')) return;
    try {
      await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
      toast.success('Product deleted');
      fetchAdminData();
      store.fetchProducts();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      toast.success('Order updated');
      fetchAdminData();
    } catch (e) {
      toast.error('Failed to update order');
    }
  };

  if (store.user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Badge className="bg-yellow-100 text-yellow-800">MOCK MODE</Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="dashboard">
              <TrendingUp className="mr-2" size={16} /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="products">
              <Grid3X3 className="mr-2" size={16} /> Products
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Package className="mr-2" size={16} /> Orders
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            {loading ? (
              <div className="grid md:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-32 bg-white rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold">₹{stats?.totalRevenue || 0}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <DollarSign className="text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <ShoppingCart className="text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Products</p>
                        <p className="text-2xl font-bold">{stats?.totalProducts || 0}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <Grid3X3 className="text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Orders</p>
                        <p className="text-2xl font-bold">{stats?.pendingOrders || 0}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Package className="text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground">{products.length} products</p>
              <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2" size={16} /> Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <Input 
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        placeholder="Product name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Category</label>
                        <Select value={newProduct.category} onValueChange={(v) => setNewProduct({...newProduct, category: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="men">Men</SelectItem>
                            <SelectItem value="women">Women</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Type</label>
                        <Select value={newProduct.type} onValueChange={(v) => setNewProduct({...newProduct, type: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="plain">Plain</SelectItem>
                            <SelectItem value="printed">Printed</SelectItem>
                            <SelectItem value="polo">Polo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Price (₹)</label>
                        <Input 
                          type="number"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                          placeholder="1499"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Original Price (₹)</label>
                        <Input 
                          type="number"
                          value={newProduct.originalPrice}
                          onChange={(e) => setNewProduct({...newProduct, originalPrice: e.target.value})}
                          placeholder="1999"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Image URLs (comma separated)</label>
                      <Input 
                        value={newProduct.images}
                        onChange={(e) => setNewProduct({...newProduct, images: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Sizes (comma separated)</label>
                        <Input 
                          value={newProduct.sizes}
                          onChange={(e) => setNewProduct({...newProduct, sizes: e.target.value})}
                          placeholder="S,M,L,XL"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Stock</label>
                        <Input 
                          type="number"
                          value={newProduct.stock}
                          onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                          placeholder="50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Input 
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        placeholder="Product description"
                      />
                    </div>
                    <Button onClick={handleAddProduct} className="w-full">Add Product</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img src={product.images[0]} alt={product.name} className="w-20 h-20 object-cover rounded" />
                      <div className="flex-1">
                        <h4 className="font-medium line-clamp-1">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">{product.category} • {product.type}</p>
                        <p className="font-semibold">₹{product.price}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="space-y-4">
              {orders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No orders yet</p>
                  </CardContent>
                </Card>
              ) : (
                orders.map(order => (
                  <Card key={order.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                        <div>
                          <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString('en-IN')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.address?.name} • {order.address?.city}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Select 
                            value={order.status} 
                            onValueChange={(v) => handleUpdateOrderStatus(order.id, v)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Badge variant="outline">
                            {order.paymentMethod === 'cod' ? 'COD' : 'Paid'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {order.items.map(item => (
                          <div key={item.id} className="flex gap-2 items-center bg-muted p-2 rounded">
                            <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded" />
                            <div>
                              <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.size} × {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-4" />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-semibold">₹{order.total}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Mobile Bottom Navigation
const MobileNav = ({ currentPage, setCurrentPage, store, setShowAuth }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-40">
      <div className="flex items-center justify-around py-2">
        <button 
          onClick={() => setCurrentPage('home')}
          className={`flex flex-col items-center p-2 ${currentPage === 'home' ? 'text-black' : 'text-muted-foreground'}`}
        >
          <Home size={20} />
          <span className="text-[10px] mt-1">Home</span>
        </button>
        <button 
          onClick={() => setCurrentPage('shop')}
          className={`flex flex-col items-center p-2 ${currentPage === 'shop' ? 'text-black' : 'text-muted-foreground'}`}
        >
          <Grid3X3 size={20} />
          <span className="text-[10px] mt-1">Shop</span>
        </button>
        <button 
          onClick={() => store.user ? setCurrentPage('wishlist') : setShowAuth(true)}
          className={`flex flex-col items-center p-2 relative ${currentPage === 'wishlist' ? 'text-black' : 'text-muted-foreground'}`}
        >
          <Heart size={20} />
          {store.wishlist.length > 0 && (
            <span className="absolute top-1 right-3 w-3 h-3 bg-black text-white text-[8px] rounded-full flex items-center justify-center">
              {store.wishlist.length}
            </span>
          )}
          <span className="text-[10px] mt-1">Wishlist</span>
        </button>
        <button 
          onClick={() => store.user ? setCurrentPage('orders') : setShowAuth(true)}
          className={`flex flex-col items-center p-2 ${currentPage === 'orders' ? 'text-black' : 'text-muted-foreground'}`}
        >
          <Package size={20} />
          <span className="text-[10px] mt-1">Orders</span>
        </button>
        <button 
          onClick={() => store.user ? null : setShowAuth(true)}
          className="flex flex-col items-center p-2 text-muted-foreground"
        >
          <User size={20} />
          <span className="text-[10px] mt-1">{store.user ? 'Account' : 'Login'}</span>
        </button>
      </div>
    </div>
  );
};

// ============== MAIN APP ==============
export default function App() {
  const store = useStore();
  const [currentPage, setCurrentPage] = useState('home');
  const [showAuth, setShowAuth] = useState(false);

  // Handle page navigation with filters
  const handleSetCurrentPage = (page) => {
    if (typeof page === 'object') {
      setCurrentPage(page);
    } else {
      setCurrentPage(page);
    }
  };

  // Render current page
  const renderPage = () => {
    const page = typeof currentPage === 'object' ? currentPage.page : currentPage;

    switch (page) {
      case 'shop':
        return <ShopPage store={store} setCurrentPage={handleSetCurrentPage} initialFilter={currentPage.filter} />;
      case 'product':
        return <ProductPage store={store} productId={currentPage.id} setCurrentPage={handleSetCurrentPage} />;
      case 'checkout':
        return <CheckoutPage store={store} setCurrentPage={handleSetCurrentPage} />;
      case 'orders':
        return <OrdersPage store={store} setCurrentPage={handleSetCurrentPage} />;
      case 'wishlist':
        return <WishlistPage store={store} setCurrentPage={handleSetCurrentPage} />;
      case 'admin':
        return <AdminPage store={store} />;
      default:
        return <HomePage store={store} setCurrentPage={handleSetCurrentPage} />;
    }
  };

  if (store.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading SevenGhost...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16 md:pb-0">
      <Header 
        store={store} 
        currentPage={typeof currentPage === 'object' ? currentPage.page : currentPage} 
        setCurrentPage={handleSetCurrentPage}
        setShowAuth={setShowAuth}
      />
      
      <main>
        {renderPage()}
      </main>

      <MobileNav 
        currentPage={typeof currentPage === 'object' ? currentPage.page : currentPage}
        setCurrentPage={handleSetCurrentPage}
        store={store}
        setShowAuth={setShowAuth}
      />

      <AuthModal 
        show={showAuth} 
        onClose={() => setShowAuth(false)} 
        store={store} 
      />
    </div>
  );
}
