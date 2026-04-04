'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
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
  ShoppingCart, ArrowRight, Star, Filter, ChevronDown, ArrowUpRight
} from 'lucide-react';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }
  }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }
  }
};

// ============== STORE CONTEXT ==============
const useStore = () => {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [wishlist, setWishlist] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        toast.success('Added to bag');
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
        toast.success('Removed from bag');
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
      toast.error('Please login to save items');
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
          toast.success('Saved to wishlist');
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

// Premium Header
const Header = ({ store, currentPage, setCurrentPage, setShowAuth }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredProducts = store.products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass border-b border-black/5' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20 lg:h-24">
          {/* Mobile Menu */}
          <button 
            className="lg:hidden p-2 -ml-2" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <motion.div
              animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </motion.div>
          </button>

          {/* Logo */}
          <motion.div 
            className="flex-1 lg:flex-none text-center lg:text-left"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <h1 
              className="text-xl lg:text-2xl font-medium tracking-[0.3em] cursor-pointer font-sans"
              onClick={() => setCurrentPage('home')}
            >
              SEVENGHOST
            </h1>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-12">
            {['home', 'shop'].map((item) => (
              <button 
                key={item}
                onClick={() => setCurrentPage(item)} 
                className={`relative text-[13px] font-medium tracking-[0.2em] uppercase transition-colors duration-300 ${
                  currentPage === item ? 'text-black' : 'text-black/60 hover:text-black'
                }`}
              >
                {item}
                {currentPage === item && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute -bottom-1 left-0 right-0 h-[1px] bg-black"
                    transition={{ duration: 0.3 }}
                  />
                )}
              </button>
            ))}
            {store.user?.role === 'admin' && (
              <button 
                onClick={() => setCurrentPage('admin')} 
                className={`text-[13px] font-medium tracking-[0.2em] uppercase transition-colors duration-300 ${
                  currentPage === 'admin' ? 'text-black' : 'text-black/60 hover:text-black'
                }`}
              >
                Admin
              </button>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 lg:gap-3">
            {/* Search */}
            <div className="relative">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearchOpen(!searchOpen)} 
                className="p-3 hover:bg-black/5 rounded-full transition-colors duration-300"
              >
                <Search size={18} strokeWidth={1.5} />
              </motion.button>
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-3 w-80 bg-white shadow-2xl rounded-sm border border-black/10 p-4 z-50"
                  >
                    <Input
                      placeholder="Search collection..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-0 border-b border-black/10 rounded-none focus-visible:ring-0 text-sm placeholder:text-black/40"
                      autoFocus
                    />
                    {searchQuery && filteredProducts.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {filteredProducts.map(product => (
                          <motion.button
                            key={product.id}
                            whileHover={{ x: 4 }}
                            className="w-full flex items-center gap-4 p-2 hover:bg-black/5 rounded-sm text-left transition-colors"
                            onClick={() => {
                              setCurrentPage({ page: 'product', id: product.id });
                              setSearchOpen(false);
                              setSearchQuery('');
                            }}
                          >
                            <img src={product.images[0]} alt={product.name} className="w-12 h-14 object-cover" />
                            <div>
                              <p className="text-sm font-medium">{product.name}</p>
                              <p className="text-xs text-black/50">₹{product.price.toLocaleString()}</p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wishlist */}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => store.user ? setCurrentPage('wishlist') : setShowAuth(true)} 
              className="p-3 hover:bg-black/5 rounded-full transition-colors duration-300 relative"
            >
              <Heart size={18} strokeWidth={1.5} />
              {store.wishlist.length > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-4 h-4 bg-black text-white text-[9px] rounded-full flex items-center justify-center font-medium"
                >
                  {store.wishlist.length}
                </motion.span>
              )}
            </motion.button>

            {/* Cart */}
            <Sheet>
              <SheetTrigger asChild>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 hover:bg-black/5 rounded-full transition-colors duration-300 relative"
                >
                  <ShoppingBag size={18} strokeWidth={1.5} />
                  {store.cart.items.length > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1 right-1 w-4 h-4 bg-black text-white text-[9px] rounded-full flex items-center justify-center font-medium"
                    >
                      {store.cart.items.length}
                    </motion.span>
                  )}
                </motion.button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md border-l-0 shadow-2xl">
                <SheetHeader className="pb-6 border-b">
                  <SheetTitle className="text-lg tracking-wide font-sans font-medium">Shopping Bag ({store.cart.items.length})</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col h-[calc(100vh-220px)]">
                  {store.cart.items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <ShoppingBag size={48} className="mb-6 opacity-20" strokeWidth={1} />
                      <p className="text-black/40 text-sm tracking-wide">Your bag is empty</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-auto space-y-6 pr-2">
                        {store.cart.items.map((item, idx) => (
                          <motion.div 
                            key={item.id} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex gap-4"
                          >
                            <div className="w-24 h-32 bg-[#f8f8f8] overflow-hidden">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 py-1">
                              <h4 className="font-medium text-sm tracking-wide">{item.name}</h4>
                              <p className="text-xs text-black/50 mt-1 tracking-wide">Size: {item.size}</p>
                              <p className="text-sm font-medium mt-2">₹{item.price.toLocaleString()}</p>
                              <div className="flex items-center gap-3 mt-4">
                                <button 
                                  onClick={() => store.updateCartQuantity(item.id, item.quantity - 1)}
                                  className="w-7 h-7 border border-black/20 flex items-center justify-center hover:border-black transition-colors"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="text-sm w-4 text-center">{item.quantity}</span>
                                <button 
                                  onClick={() => store.updateCartQuantity(item.id, item.quantity + 1)}
                                  className="w-7 h-7 border border-black/20 flex items-center justify-center hover:border-black transition-colors"
                                >
                                  <Plus size={12} />
                                </button>
                                <button 
                                  onClick={() => store.removeFromCart(item.id)}
                                  className="ml-auto text-black/40 hover:text-black transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      <div className="pt-6 border-t mt-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-black/60">Subtotal</span>
                          <span>₹{store.cart.total.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-6">
                          <span className="text-black/60">Shipping</span>
                          <span className="text-green-700">Complimentary</span>
                        </div>
                        <Button 
                          className="w-full h-12 text-sm tracking-[0.15em] font-medium rounded-none" 
                          onClick={() => setCurrentPage('checkout')}
                        >
                          CHECKOUT — ₹{store.cart.total.toLocaleString()}
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
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 hover:bg-black/5 rounded-full transition-colors duration-300"
                  >
                    <User size={18} strokeWidth={1.5} />
                  </motion.button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm rounded-none border-0 shadow-2xl">
                  <DialogHeader className="pb-6 border-b">
                    <DialogTitle className="text-lg tracking-wide font-sans font-medium">Account</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-6">
                    <div className="text-center py-4">
                      <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4">
                        <User size={24} strokeWidth={1.5} />
                      </div>
                      <p className="font-medium tracking-wide">{store.user.name}</p>
                      <p className="text-sm text-black/50">{store.user.email}</p>
                      {store.user.role === 'admin' && (
                        <Badge className="mt-3 rounded-none text-[10px] tracking-wider">ADMIN</Badge>
                      )}
                    </div>
                    <Separator />
                    <Button variant="outline" className="w-full h-11 rounded-none text-sm tracking-wide" onClick={() => setCurrentPage('orders')}>
                      <Package className="mr-3" size={16} strokeWidth={1.5} /> Order History
                    </Button>
                    <Button variant="ghost" className="w-full h-11 rounded-none text-sm tracking-wide text-red-600 hover:text-red-700 hover:bg-red-50" onClick={store.logout}>
                      <LogOut className="mr-3" size={16} strokeWidth={1.5} /> Sign Out
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAuth(true)} 
                className="p-3 hover:bg-black/5 rounded-full transition-colors duration-300"
              >
                <User size={18} strokeWidth={1.5} />
              </motion.button>
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
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden border-t border-black/10"
            >
              <nav className="py-8 space-y-1">
                {['Home', 'Shop', 'Wishlist', 'Orders'].map((item, idx) => (
                  <motion.button 
                    key={item}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => { 
                      setCurrentPage(item.toLowerCase()); 
                      setMobileMenuOpen(false); 
                    }} 
                    className="block w-full text-left py-3 text-[13px] tracking-[0.2em] uppercase hover:pl-4 transition-all"
                  >
                    {item}
                  </motion.button>
                ))}
                {store.user?.role === 'admin' && (
                  <motion.button 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => { setCurrentPage('admin'); setMobileMenuOpen(false); }} 
                    className="block w-full text-left py-3 text-[13px] tracking-[0.2em] uppercase hover:pl-4 transition-all"
                  >
                    Admin Panel
                  </motion.button>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
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
      toast.success(`Welcome, ${result.user.name}`);
      onClose();
    } else {
      toast.error(result.error || 'Authentication failed');
    }
  };

  if (!show) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-8 md:p-12 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-serif">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[11px] font-medium tracking-[0.15em] uppercase text-black/60">Email</label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-2 h-12 rounded-none border-black/20 focus-visible:ring-0 focus-visible:border-black"
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-medium tracking-[0.15em] uppercase text-black/60">Password</label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2 h-12 rounded-none border-black/20 focus-visible:ring-0 focus-visible:border-black"
              required
            />
          </div>
          <Button type="submit" className="w-full h-12 rounded-none text-sm tracking-[0.15em]" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'SIGN IN' : 'CREATE ACCOUNT')}
          </Button>
        </form>
        <p className="text-center text-sm text-black/50 mt-8">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-black font-medium ml-2 hover:underline underline-offset-4"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
        <div className="mt-8 p-4 bg-black/5 text-center">
          <p className="text-xs text-black/60 tracking-wide">
            Demo: <span className="font-medium">admin@sevenghost.com</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Premium Product Card
const ProductCard = ({ product, onClick, onWishlist, isWishlisted, index }) => {
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative overflow-hidden bg-[#f5f5f5] aspect-[3/4]">
        <motion.img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        />
        <motion.button
          initial={{ opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          animate={{ opacity: 1 }}
          onClick={(e) => { e.stopPropagation(); onWishlist(product.id); }}
          className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
            isWishlisted ? 'bg-black text-white' : 'bg-white/90 hover:bg-white shadow-lg'
          }`}
        >
          <Heart size={16} fill={isWishlisted ? 'white' : 'none'} strokeWidth={1.5} />
        </motion.button>
        {discount > 0 && (
          <div className="absolute top-4 left-4 bg-black text-white text-[10px] tracking-[0.1em] px-3 py-1.5">
            -{discount}%
          </div>
        )}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        >
          <button className="w-full py-3 bg-white text-black text-[11px] tracking-[0.15em] font-medium hover:bg-black hover:text-white transition-colors">
            QUICK VIEW
          </button>
        </motion.div>
      </div>
      <div className="mt-5 space-y-1.5">
        <p className="text-[10px] text-black/40 tracking-[0.2em] uppercase">{product.type}</p>
        <h3 className="text-sm font-medium tracking-wide">{product.name}</h3>
        <div className="flex items-center gap-3 pt-1">
          <span className="text-sm font-medium">₹{product.price.toLocaleString()}</span>
          {product.originalPrice > product.price && (
            <span className="text-sm text-black/40 line-through">₹{product.originalPrice.toLocaleString()}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Premium Home Page
const HomePage = ({ store, setCurrentPage }) => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const featuredProducts = store.products.filter(p => p.featured).slice(0, 4);
  const categories = [
    { id: 'plain', name: 'Plain', subtitle: 'Timeless Essentials', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600' },
    { id: 'printed', name: 'Printed', subtitle: 'Artful Expression', image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600' },
    { id: 'polo', name: 'Polo', subtitle: 'Refined Elegance', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600' }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section ref={heroRef} className="relative h-screen">
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1611042553484-d61f84d22784?w=1920" 
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>
        <motion.div 
          style={{ opacity: heroOpacity }}
          className="relative h-full container mx-auto px-6 lg:px-12 flex items-center"
        >
          <div className="max-w-2xl text-white">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-[11px] tracking-[0.4em] uppercase mb-6 text-white/70"
            >
              New Collection 2025
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[0.9] mb-8"
            >
              Wear Your<br />Identity
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-lg md:text-xl text-white/70 mb-10 max-w-md leading-relaxed"
            >
              Premium quality t-shirts designed for those who appreciate minimal aesthetics and superior comfort.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button 
                size="lg" 
                className="h-14 px-10 bg-white text-black hover:bg-white/90 rounded-none text-[12px] tracking-[0.2em] font-medium"
                onClick={() => setCurrentPage('shop')}
              >
                SHOP COLLECTION
                <ArrowRight className="ml-3" size={16} />
              </Button>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-white"
        >
          <span className="text-[10px] tracking-[0.3em] mb-3">SCROLL</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-[1px] h-12 bg-white/50"
          />
        </motion.div>
      </section>

      {/* Marquee */}
      <section className="py-6 border-y border-black/10 overflow-hidden bg-white">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="mx-8 text-[11px] tracking-[0.4em] uppercase text-black/40">
              Free Shipping Over ₹999 • Premium Quality • Easy Returns • 100% Cotton
            </span>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 lg:py-32 container mx-auto px-6 lg:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <p className="text-[11px] tracking-[0.4em] uppercase text-black/40 mb-4">Categories</p>
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-serif">Shop by Style</h3>
        </motion.div>
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6 lg:gap-8"
        >
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              variants={fadeInUp}
              className="group cursor-pointer"
              onClick={() => setCurrentPage({ page: 'shop', filter: { type: cat.id } })}
            >
              <div className="relative overflow-hidden aspect-[3/4]">
                <motion.img 
                  src={cat.image} 
                  alt={cat.name}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <p className="text-[10px] tracking-[0.3em] uppercase opacity-70 mb-2">{cat.subtitle}</p>
                  <h4 className="text-2xl font-serif flex items-center gap-3">
                    {cat.name}
                    <motion.span
                      initial={{ x: 0, opacity: 0.5 }}
                      whileHover={{ x: 5, opacity: 1 }}
                      className="inline-block"
                    >
                      <ArrowUpRight size={20} strokeWidth={1.5} />
                    </motion.span>
                  </h4>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Featured Products */}
      <section className="py-24 lg:py-32 bg-[#fafafa]">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16"
          >
            <div>
              <p className="text-[11px] tracking-[0.4em] uppercase text-black/40 mb-4">Selection</p>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-serif">Featured Pieces</h3>
            </div>
            <motion.button 
              whileHover={{ x: 5 }}
              onClick={() => setCurrentPage('shop')}
              className="mt-6 md:mt-0 text-[12px] tracking-[0.15em] uppercase flex items-center gap-3 hover:gap-4 transition-all"
            >
              View All <ArrowRight size={14} />
            </motion.button>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {featuredProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                index={idx}
                onClick={() => setCurrentPage({ page: 'product', id: product.id })}
                onWishlist={store.toggleWishlist}
                isWishlisted={store.wishlist.includes(product.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Banner */}
      <section className="py-24 lg:py-32 container mx-auto px-6 lg:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={scaleIn}
          className="relative overflow-hidden"
        >
          <div className="grid md:grid-cols-2 min-h-[600px]">
            <div className="relative overflow-hidden">
              <motion.img 
                src="https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?w=1200" 
                alt="Editorial"
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <div className="bg-black text-white p-10 lg:p-16 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <p className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-6">Editorial</p>
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-serif mb-6 leading-tight">The Art of<br />Simplicity</h3>
                <p className="text-white/60 leading-relaxed mb-10 max-w-md">
                  Discover our philosophy of minimal design. Each piece is crafted to perfection, 
                  blending timeless aesthetics with contemporary style.
                </p>
                <Button 
                  variant="outline" 
                  className="w-fit h-12 px-8 rounded-none border-white text-white hover:bg-white hover:text-black text-[11px] tracking-[0.2em]"
                  onClick={() => setCurrentPage('shop')}
                >
                  EXPLORE
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Values */}
      <section className="py-20 border-t border-black/10">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-12 text-center"
          >
            {[
              { title: 'Free Shipping', desc: 'Complimentary delivery on orders over ₹999' },
              { title: 'Premium Quality', desc: '100% organic cotton, sustainably sourced' },
              { title: 'Easy Returns', desc: '7-day hassle-free return policy' }
            ].map((item, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <h4 className="text-[11px] tracking-[0.3em] uppercase mb-3">{item.title}</h4>
                <p className="text-sm text-black/50">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-20 lg:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-4 gap-12 lg:gap-16 mb-16">
            <div className="md:col-span-2">
              <h4 className="text-2xl tracking-[0.2em] font-medium mb-6">SEVENGHOST</h4>
              <p className="text-white/50 text-sm leading-relaxed max-w-sm mb-8">
                Premium fashion for the modern individual. Where quality meets style, 
                and every piece tells a story.
              </p>
              <div className="flex gap-4">
                <Input 
                  placeholder="Email address" 
                  className="bg-white/10 border-white/20 text-white rounded-none h-12 placeholder:text-white/40 focus-visible:ring-0 focus-visible:border-white/40" 
                />
                <Button className="h-12 px-6 rounded-none text-[11px] tracking-[0.15em]">JOIN</Button>
              </div>
            </div>
            <div>
              <h5 className="text-[11px] tracking-[0.2em] uppercase mb-6 text-white/50">Quick Links</h5>
              <ul className="space-y-4">
                {['Shop All', 'New Arrivals', 'Best Sellers', 'Sale'].map(item => (
                  <li key={item}>
                    <button className="text-sm text-white/70 hover:text-white transition-colors">{item}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-[11px] tracking-[0.2em] uppercase mb-6 text-white/50">Help</h5>
              <ul className="space-y-4">
                {['Contact Us', 'Shipping Info', 'Returns', 'Size Guide'].map(item => (
                  <li key={item}>
                    <button className="text-sm text-white/70 hover:text-white transition-colors">{item}</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Separator className="bg-white/10 mb-8" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[11px] text-white/40 tracking-wide">© 2025 SevenGhost. All rights reserved.</p>
            <p className="text-[10px] bg-amber-500/20 text-amber-400 px-4 py-2 tracking-wide">
              DEMO MODE — Payments are simulated
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
    <div className="min-h-screen pt-24 lg:pt-32">
      {/* Header */}
      <div className="container mx-auto px-6 lg:px-12 py-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-[11px] tracking-[0.4em] uppercase text-black/40 mb-4">Collection</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif mb-4">Shop All</h1>
          <p className="text-black/50">{filteredProducts.length} pieces</p>
        </motion.div>
      </div>

      <div className="container mx-auto px-6 lg:px-12 pb-24">
        {/* Filter Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-between mb-12 pb-6 border-b border-black/10"
        >
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden rounded-none h-10 text-[11px] tracking-[0.15em]"
          >
            <Filter size={14} className="mr-2" /> FILTERS
          </Button>
          
          <div className="hidden lg:flex items-center gap-6">
            <Select value={filters.category} onValueChange={(v) => setFilters({...filters, category: v})}>
              <SelectTrigger className="w-36 rounded-none h-10 text-[11px] tracking-[0.1em] border-black/20">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="women">Women</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.type} onValueChange={(v) => setFilters({...filters, type: v})}>
              <SelectTrigger className="w-36 rounded-none h-10 text-[11px] tracking-[0.1em] border-black/20">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="plain">Plain</SelectItem>
                <SelectItem value="printed">Printed</SelectItem>
                <SelectItem value="polo">Polo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priceRange} onValueChange={(v) => setFilters({...filters, priceRange: v})}>
              <SelectTrigger className="w-40 rounded-none h-10 text-[11px] tracking-[0.1em] border-black/20">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under1500">Under ₹1,500</SelectItem>
                <SelectItem value="1500to2000">₹1,500 - ₹2,000</SelectItem>
                <SelectItem value="above2000">Above ₹2,000</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <p className="text-[11px] text-black/40 tracking-wide hidden lg:block">{filteredProducts.length} RESULTS</p>
        </motion.div>

        {/* Mobile Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden mb-8 overflow-hidden"
            >
              <div className="p-6 bg-[#fafafa] space-y-4">
                <Select value={filters.category} onValueChange={(v) => setFilters({...filters, category: v})}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="men">Men</SelectItem>
                    <SelectItem value="women">Women</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.type} onValueChange={(v) => setFilters({...filters, type: v})}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="plain">Plain</SelectItem>
                    <SelectItem value="printed">Printed</SelectItem>
                    <SelectItem value="polo">Polo</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.priceRange} onValueChange={(v) => setFilters({...filters, priceRange: v})}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="under1500">Under ₹1,500</SelectItem>
                    <SelectItem value="1500to2000">₹1,500 - ₹2,000</SelectItem>
                    <SelectItem value="above2000">Above ₹2,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {filteredProducts.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              index={idx}
              onClick={() => setCurrentPage({ page: 'product', id: product.id })}
              onWishlist={store.toggleWishlist}
              isWishlisted={store.wishlist.includes(product.id)}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <p className="text-black/40 tracking-wide">No products found</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Product Detail Page
const ProductPage = ({ store, productId, setCurrentPage }) => {
  const [selectedSize, setSelectedSize] = useState('');
  const product = store.products.find(p => p.id === productId);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <p className="text-black/40">Product not found</p>
      </div>
    );
  }

  const relatedProducts = store.products
    .filter(p => p.type === product.type && p.id !== product.id)
    .slice(0, 4);
  
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    await store.addToCart(product.id, selectedSize);
  };

  const handleBuyNow = async () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    const success = await store.addToCart(product.id, selectedSize);
    if (success) setCurrentPage('checkout');
  };

  return (
    <div className="min-h-screen pt-24 lg:pt-32">
      <div className="container mx-auto px-6 lg:px-12 py-8">
        {/* Breadcrumb */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 text-[11px] text-black/40 mb-12 tracking-wide"
        >
          <button onClick={() => setCurrentPage('home')} className="hover:text-black transition-colors">Home</button>
          <span>/</span>
          <button onClick={() => setCurrentPage('shop')} className="hover:text-black transition-colors">Shop</button>
          <span>/</span>
          <span className="text-black">{product.name}</span>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="aspect-[3/4] bg-[#f5f5f5] overflow-hidden sticky top-32">
              <motion.img 
                src={product.images[0]} 
                alt={product.name}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:py-8"
          >
            <p className="text-[10px] text-black/40 tracking-[0.3em] uppercase mb-4">
              {product.category} · {product.type}
            </p>
            <h1 className="text-3xl lg:text-4xl font-serif mb-6">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-8">
              <span className="text-2xl font-medium">₹{product.price.toLocaleString()}</span>
              {product.originalPrice > product.price && (
                <>
                  <span className="text-lg text-black/40 line-through">₹{product.originalPrice.toLocaleString()}</span>
                  <span className="text-[10px] tracking-[0.1em] bg-green-100 text-green-800 px-3 py-1">
                    SAVE {discount}%
                  </span>
                </>
              )}
            </div>

            <p className="text-black/60 leading-relaxed mb-10">{product.description}</p>

            <Separator className="my-8" />

            {/* Size Selection */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <p className="text-[11px] tracking-[0.2em] uppercase">Select Size</p>
                <button className="text-[11px] text-black/50 underline underline-offset-4">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map(size => (
                  <motion.button
                    key={size}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedSize(size)}
                    className={`w-14 h-14 border text-sm font-medium transition-all duration-300 ${
                      selectedSize === size 
                        ? 'border-black bg-black text-white' 
                        : 'border-black/20 hover:border-black'
                    }`}
                  >
                    {size}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 mb-10">
              <Button 
                className="h-14 rounded-none text-[12px] tracking-[0.2em]" 
                onClick={handleAddToCart}
              >
                ADD TO BAG
              </Button>
              <Button 
                variant="outline" 
                className="h-14 rounded-none text-[12px] tracking-[0.2em] border-black" 
                onClick={handleBuyNow}
              >
                BUY NOW
              </Button>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              onClick={() => store.toggleWishlist(product.id)}
              className="flex items-center gap-3 text-[11px] tracking-[0.15em] uppercase text-black/60 hover:text-black transition-colors"
            >
              <Heart size={16} fill={store.wishlist.includes(product.id) ? 'currentColor' : 'none'} strokeWidth={1.5} />
              {store.wishlist.includes(product.id) ? 'Saved to Wishlist' : 'Add to Wishlist'}
            </motion.button>

            {/* Features */}
            <div className="mt-12 space-y-4">
              {[
                { icon: Truck, text: 'Free shipping on orders over ₹999' },
                { icon: Package, text: 'Easy 7-day returns' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 text-sm text-black/60">
                  <item.icon size={18} strokeWidth={1.5} />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-24 lg:mt-32 pt-16 border-t border-black/10">
            <h2 className="text-2xl font-serif mb-12 text-center">You May Also Like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {relatedProducts.map((p, idx) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={idx}
                  onClick={() => setCurrentPage({ page: 'product', id: p.id })}
                  onWishlist={store.toggleWishlist}
                  isWishlisted={store.wishlist.includes(p.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

// Checkout Page
const CheckoutPage = ({ store, setCurrentPage }) => {
  const [address, setAddress] = useState({
    name: '', phone: '', addressLine: '', city: '', state: '', pincode: ''
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
        toast.info('Simulating payment...');
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

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
      }
    } catch (e) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!store.user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <p className="text-black/40 mb-6">Please login to checkout</p>
          <Button onClick={() => setCurrentPage('home')} className="rounded-none">Go Home</Button>
        </div>
      </div>
    );
  }

  if (store.cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto mb-6 opacity-20" strokeWidth={1} />
          <p className="text-black/40 mb-6">Your bag is empty</p>
          <Button onClick={() => setCurrentPage('shop')} className="rounded-none">Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 lg:pt-32 bg-[#fafafa]">
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-serif mb-12 text-center"
        >
          Checkout
        </motion.h1>
        
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Address */}
            <div className="bg-white p-8">
              <h2 className="text-[11px] tracking-[0.2em] uppercase mb-6">Delivery Address</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] tracking-[0.15em] uppercase text-black/50">Full Name</label>
                  <Input 
                    value={address.name}
                    onChange={(e) => setAddress({...address, name: e.target.value})}
                    className="mt-2 rounded-none h-12 border-black/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.15em] uppercase text-black/50">Phone</label>
                  <Input 
                    value={address.phone}
                    onChange={(e) => setAddress({...address, phone: e.target.value})}
                    className="mt-2 rounded-none h-12 border-black/20"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] tracking-[0.15em] uppercase text-black/50">Address</label>
                  <Input 
                    value={address.addressLine}
                    onChange={(e) => setAddress({...address, addressLine: e.target.value})}
                    className="mt-2 rounded-none h-12 border-black/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.15em] uppercase text-black/50">City</label>
                  <Input 
                    value={address.city}
                    onChange={(e) => setAddress({...address, city: e.target.value})}
                    className="mt-2 rounded-none h-12 border-black/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.15em] uppercase text-black/50">Pincode</label>
                  <Input 
                    value={address.pincode}
                    onChange={(e) => setAddress({...address, pincode: e.target.value})}
                    className="mt-2 rounded-none h-12 border-black/20"
                  />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white p-8">
              <h2 className="text-[11px] tracking-[0.2em] uppercase mb-6">Payment Method</h2>
              <div className="space-y-4">
                {[
                  { id: 'razorpay', label: 'Pay Online', desc: 'Cards, UPI, Net Banking', icon: CreditCard, mock: true },
                  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive', icon: Truck }
                ].map((method) => (
                  <label 
                    key={method.id}
                    className={`flex items-center gap-4 p-5 border cursor-pointer transition-all ${
                      paymentMethod === method.id ? 'border-black' : 'border-black/10 hover:border-black/30'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      className="w-4 h-4"
                    />
                    <method.icon size={20} strokeWidth={1.5} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{method.label}</p>
                      <p className="text-xs text-black/50">{method.desc}</p>
                    </div>
                    {method.mock && (
                      <span className="text-[9px] tracking-wide bg-amber-100 text-amber-800 px-2 py-1">DEMO</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Order Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white p-8 sticky top-32">
              <h2 className="text-[11px] tracking-[0.2em] uppercase mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {store.cart.items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <img src={item.image} alt={item.name} className="w-20 h-24 object-cover" />
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-black/50">Size: {item.size} × {item.quantity}</p>
                      <p className="text-sm mt-1">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-6" />
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-black/50">Subtotal</span>
                  <span>₹{store.cart.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/50">Shipping</span>
                  <span className="text-green-700">Free</span>
                </div>
              </div>
              <Separator className="my-6" />
              <div className="flex justify-between text-lg font-medium mb-8">
                <span>Total</span>
                <span>₹{store.cart.total.toLocaleString()}</span>
              </div>
              <Button 
                className="w-full h-14 rounded-none text-[12px] tracking-[0.2em]" 
                onClick={handlePlaceOrder}
                disabled={loading}
              >
                {loading ? 'PROCESSING...' : 'PLACE ORDER'}
              </Button>
            </div>
          </motion.div>
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
    if (store.user) fetchOrders();
  }, [store.user]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders/${store.user.id}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!store.user) return null;

  return (
    <div className="min-h-screen pt-24 lg:pt-32 bg-[#fafafa]">
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-serif mb-12 text-center"
        >
          My Orders
        </motion.h1>
        
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-32 bg-white animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-16 text-center"
          >
            <Package size={48} className="mx-auto mb-6 opacity-20" strokeWidth={1} />
            <p className="text-black/40 mb-6">No orders yet</p>
            <Button onClick={() => setCurrentPage('shop')} className="rounded-none">Start Shopping</Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, idx) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-6 lg:p-8"
              >
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                  <div>
                    <p className="text-[11px] text-black/40 tracking-wide">ORDER #{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm mt-1">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Badge variant="secondary" className="rounded-none text-[10px] tracking-wide">{order.status}</Badge>
                    <Badge variant="outline" className="rounded-none text-[10px] tracking-wide">
                      {order.paymentMethod === 'cod' ? 'COD' : 'PAID'}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  {order.items.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <img src={item.image} alt={item.name} className="w-16 h-20 object-cover" />
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-black/50">{item.size} × {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-6" />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-black/50">{order.address?.city}</p>
                  <p className="font-medium">₹{order.total.toLocaleString()}</p>
                </div>
              </motion.div>
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
    <div className="min-h-screen pt-24 lg:pt-32 bg-[#fafafa]">
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <p className="text-[11px] tracking-[0.4em] uppercase text-black/40 mb-4">Saved Items</p>
          <h1 className="text-3xl font-serif">Wishlist ({wishlistedProducts.length})</h1>
        </motion.div>
        
        {wishlistedProducts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-16 text-center"
          >
            <Heart size={48} className="mx-auto mb-6 opacity-20" strokeWidth={1} />
            <p className="text-black/40 mb-6">Your wishlist is empty</p>
            <Button onClick={() => setCurrentPage('shop')} className="rounded-none">Explore Collection</Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {wishlistedProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                index={idx}
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

// Admin Page (keeping it simpler for space)
const AdminPage = ({ store }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setStats((await statsRes.json()).stats);
      setOrders((await ordersRes.json()).orders || []);
      setProducts((await productsRes.json()).products || []);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (store.user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <p className="text-black/40">Access denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 lg:pt-32 bg-[#fafafa]">
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-3xl font-serif">Admin Panel</h1>
          <Badge className="rounded-none bg-amber-100 text-amber-800 text-[10px] tracking-wide">DEMO MODE</Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 rounded-none bg-white p-1">
            <TabsTrigger value="dashboard" className="rounded-none text-[11px] tracking-wide">Dashboard</TabsTrigger>
            <TabsTrigger value="products" className="rounded-none text-[11px] tracking-wide">Products</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-none text-[11px] tracking-wide">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            {loading ? (
              <div className="grid md:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white animate-pulse" />)}
              </div>
            ) : (
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Revenue', value: `₹${stats?.totalRevenue?.toLocaleString() || 0}`, icon: DollarSign, color: 'green' },
                  { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingCart, color: 'blue' },
                  { label: 'Products', value: stats?.totalProducts || 0, icon: Grid3X3, color: 'purple' },
                  { label: 'Pending', value: stats?.pendingOrders || 0, icon: Package, color: 'amber' }
                ].map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] tracking-wide text-black/40 uppercase">{item.label}</p>
                        <p className="text-2xl font-medium mt-2">{item.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-full bg-${item.color}-100 flex items-center justify-center`}>
                        <item.icon className={`text-${item.color}-600`} size={20} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="products">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => (
                <div key={product.id} className="bg-white p-4 flex gap-4">
                  <img src={product.images[0]} alt={product.name} className="w-20 h-24 object-cover" />
                  <div>
                    <h4 className="font-medium text-sm">{product.name}</h4>
                    <p className="text-xs text-black/50">{product.category} · {product.type}</p>
                    <p className="font-medium mt-2">₹{product.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="bg-white p-8 text-center">
                  <p className="text-black/40">No orders yet</p>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="bg-white p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-black/50">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge className="rounded-none">{order.status}</Badge>
                    </div>
                    <p className="text-sm text-black/50">{order.items.length} items · ₹{order.total.toLocaleString()}</p>
                  </div>
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
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-black/10 lg:hidden z-40"
    >
      <div className="flex items-center justify-around py-3">
        {[
          { icon: Home, label: 'Home', page: 'home' },
          { icon: Grid3X3, label: 'Shop', page: 'shop' },
          { icon: Heart, label: 'Saved', page: 'wishlist', count: store.wishlist.length },
          { icon: Package, label: 'Orders', page: 'orders' },
          { icon: User, label: 'Account', page: 'account' }
        ].map((item) => (
          <button 
            key={item.page}
            onClick={() => {
              if (item.page === 'account') {
                if (!store.user) setShowAuth(true);
              } else if (['wishlist', 'orders'].includes(item.page) && !store.user) {
                setShowAuth(true);
              } else {
                setCurrentPage(item.page);
              }
            }}
            className={`flex flex-col items-center p-2 relative ${
              currentPage === item.page ? 'text-black' : 'text-black/40'
            }`}
          >
            <item.icon size={20} strokeWidth={1.5} />
            {item.count > 0 && (
              <span className="absolute top-1 right-1 w-3 h-3 bg-black text-white text-[8px] rounded-full flex items-center justify-center">
                {item.count}
              </span>
            )}
            <span className="text-[9px] mt-1 tracking-wide">{item.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

// ============== MAIN APP ==============
export default function App() {
  const store = useStore();
  const [currentPage, setCurrentPage] = useState('home');
  const [showAuth, setShowAuth] = useState(false);

  const handleSetCurrentPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border border-black border-t-transparent rounded-full mx-auto mb-6"
          />
          <p className="text-[11px] tracking-[0.3em] uppercase text-black/40">Loading</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      <Header 
        store={store} 
        currentPage={typeof currentPage === 'object' ? currentPage.page : currentPage} 
        setCurrentPage={handleSetCurrentPage}
        setShowAuth={setShowAuth}
      />
      
      <main>
        <AnimatePresence mode="wait">
          {renderPage()}
        </AnimatePresence>
      </main>

      <MobileNav 
        currentPage={typeof currentPage === 'object' ? currentPage.page : currentPage}
        setCurrentPage={handleSetCurrentPage}
        store={store}
        setShowAuth={setShowAuth}
      />

      <AnimatePresence>
        {showAuth && (
          <AuthModal 
            show={showAuth} 
            onClose={() => setShowAuth(false)} 
            store={store} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
