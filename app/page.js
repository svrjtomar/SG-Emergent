'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  ShoppingBag, Heart, Search, Menu, X, User, Package, 
  ChevronRight, Minus, Plus, Trash2, CreditCard, Truck,
  Home, Grid3X3, Settings, LogOut, TrendingUp, DollarSign,
  ShoppingCart, ArrowRight, Star, Filter, ChevronDown, ArrowUpRight,
  LayoutDashboard, Users, Box, FileText, Bell, ChevronLeft,
  Edit, Eye, MoreHorizontal, RefreshCw, Download, Upload,
  Check, AlertCircle, Database, Key, Globe, Wallet, Store,
  IndianRupee, Calendar, Clock, MapPin, Phone, Mail
} from 'lucide-react';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
    try { await fetch('/api/seed'); } catch (e) { console.log('Seed:', e); }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e) { console.error('Error:', e); }
    finally { setLoading(false); }
  };

  const fetchCart = async (userId) => {
    try {
      const res = await fetch(`/api/cart/${userId}`);
      const data = await res.json();
      setCart(data.cart || { items: [], total: 0 });
    } catch (e) { console.error('Error:', e); }
  };

  const fetchWishlist = async (userId) => {
    try {
      const res = await fetch(`/api/wishlist/${userId}`);
      const data = await res.json();
      setWishlist(data.wishlist?.items || []);
    } catch (e) { console.error('Error:', e); }
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
    } catch (e) { return { success: false, error: e.message }; }
  };

  const logout = () => {
    setUser(null);
    setCart({ items: [], total: 0 });
    setWishlist([]);
    localStorage.removeItem('sevenghost_user');
  };

  const addToCart = async (productId, size) => {
    if (!user) { toast.error('Please login'); return false; }
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId, size })
      });
      const data = await res.json();
      if (data.cart) { setCart(data.cart); toast.success('Added to bag'); return true; }
    } catch (e) { toast.error('Failed'); }
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
      if (data.cart) { setCart(data.cart); toast.success('Removed'); }
    } catch (e) { toast.error('Failed'); }
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
      if (data.cart) setCart(data.cart);
    } catch (e) { toast.error('Failed'); }
  };

  const toggleWishlist = async (productId) => {
    if (!user) { toast.error('Please login'); return; }
    try {
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId })
      });
      const data = await res.json();
      if (data.wishlist) {
        setWishlist(data.wishlist.items);
        toast.success(data.wishlist.items.includes(productId) ? 'Saved' : 'Removed');
      }
    } catch (e) { toast.error('Failed'); }
  };

  return {
    user, cart, wishlist, products, loading,
    login, logout, addToCart, removeFromCart, updateCartQuantity, toggleWishlist,
    setCart, fetchProducts, fetchCart
  };
};

// ============== STOREFRONT COMPONENTS ==============

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
      initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass border-b border-black/5' : 'bg-transparent'}`}
    >
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20 lg:h-24">
          <button className="lg:hidden p-2 -ml-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <motion.div className="flex-1 lg:flex-none text-center lg:text-left" whileHover={{ scale: 1.02 }}>
            <h1 className="text-xl lg:text-2xl font-medium tracking-[0.3em] cursor-pointer font-sans" onClick={() => setCurrentPage('home')}>
              SEVENGHOST
            </h1>
          </motion.div>

          <nav className="hidden lg:flex items-center gap-12">
            {['home', 'shop'].map((item) => (
              <button key={item} onClick={() => setCurrentPage(item)} 
                className={`relative text-[13px] font-medium tracking-[0.2em] uppercase transition-colors duration-300 ${currentPage === item ? 'text-black' : 'text-black/60 hover:text-black'}`}>
                {item}
                {currentPage === item && <motion.div layoutId="navIndicator" className="absolute -bottom-1 left-0 right-0 h-[1px] bg-black" />}
              </button>
            ))}
            {store.user?.role === 'admin' && (
              <button onClick={() => setCurrentPage('admin')} className={`text-[13px] font-medium tracking-[0.2em] uppercase ${currentPage === 'admin' ? 'text-black' : 'text-black/60 hover:text-black'}`}>
                Admin
              </button>
            )}
          </nav>

          <div className="flex items-center gap-1 lg:gap-3">
            <div className="relative">
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => setSearchOpen(!searchOpen)} className="p-3 hover:bg-black/5 rounded-full">
                <Search size={18} strokeWidth={1.5} />
              </motion.button>
              <AnimatePresence>
                {searchOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-3 w-80 bg-white shadow-2xl rounded-sm border border-black/10 p-4 z-50">
                    <Input placeholder="Search collection..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-0 border-b border-black/10 rounded-none focus-visible:ring-0" autoFocus />
                    {searchQuery && filteredProducts.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {filteredProducts.map(product => (
                          <button key={product.id} className="w-full flex items-center gap-4 p-2 hover:bg-black/5 rounded-sm text-left"
                            onClick={() => { setCurrentPage({ page: 'product', id: product.id }); setSearchOpen(false); setSearchQuery(''); }}>
                            <img src={product.images[0]} alt={product.name} className="w-12 h-14 object-cover" />
                            <div>
                              <p className="text-sm font-medium">{product.name}</p>
                              <p className="text-xs text-black/50">₹{product.price.toLocaleString()}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button whileHover={{ scale: 1.05 }} onClick={() => store.user ? setCurrentPage('wishlist') : setShowAuth(true)} className="p-3 hover:bg-black/5 rounded-full relative">
              <Heart size={18} strokeWidth={1.5} />
              {store.wishlist.length > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-black text-white text-[9px] rounded-full flex items-center justify-center">{store.wishlist.length}</span>}
            </motion.button>

            <Sheet>
              <SheetTrigger asChild>
                <motion.button whileHover={{ scale: 1.05 }} className="p-3 hover:bg-black/5 rounded-full relative">
                  <ShoppingBag size={18} strokeWidth={1.5} />
                  {store.cart.items.length > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-black text-white text-[9px] rounded-full flex items-center justify-center">{store.cart.items.length}</span>}
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
                      <p className="text-black/40 text-sm">Your bag is empty</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-auto space-y-6 pr-2">
                        {store.cart.items.map((item, idx) => (
                          <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="flex gap-4">
                            <div className="w-24 h-32 bg-[#f8f8f8] overflow-hidden">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 py-1">
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <p className="text-xs text-black/50 mt-1">Size: {item.size}</p>
                              <p className="text-sm font-medium mt-2">₹{item.price.toLocaleString()}</p>
                              <div className="flex items-center gap-3 mt-4">
                                <button onClick={() => store.updateCartQuantity(item.id, item.quantity - 1)} className="w-7 h-7 border border-black/20 flex items-center justify-center"><Minus size={12} /></button>
                                <span className="text-sm w-4 text-center">{item.quantity}</span>
                                <button onClick={() => store.updateCartQuantity(item.id, item.quantity + 1)} className="w-7 h-7 border border-black/20 flex items-center justify-center"><Plus size={12} /></button>
                                <button onClick={() => store.removeFromCart(item.id)} className="ml-auto text-black/40 hover:text-black"><Trash2 size={16} /></button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      <div className="pt-6 border-t mt-6">
                        <div className="flex justify-between text-sm mb-2"><span className="text-black/60">Subtotal</span><span>₹{store.cart.total.toLocaleString()}</span></div>
                        <div className="flex justify-between text-sm mb-6"><span className="text-black/60">Shipping</span><span className="text-green-700">Free</span></div>
                        <Button className="w-full h-12 text-sm tracking-[0.15em] rounded-none" onClick={() => setCurrentPage('checkout')}>
                          CHECKOUT — ₹{store.cart.total.toLocaleString()}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {store.user ? (
              <Dialog>
                <DialogTrigger asChild>
                  <motion.button whileHover={{ scale: 1.05 }} className="p-3 hover:bg-black/5 rounded-full"><User size={18} strokeWidth={1.5} /></motion.button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm rounded-none border-0 shadow-2xl">
                  <DialogHeader className="pb-6 border-b"><DialogTitle className="text-lg">Account</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-6">
                    <div className="text-center py-4">
                      <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4"><User size={24} strokeWidth={1.5} /></div>
                      <p className="font-medium">{store.user.name}</p>
                      <p className="text-sm text-black/50">{store.user.email}</p>
                      {store.user.role === 'admin' && <Badge className="mt-3 rounded-none text-[10px]">ADMIN</Badge>}
                    </div>
                    <Separator />
                    <Button variant="outline" className="w-full h-11 rounded-none" onClick={() => setCurrentPage('orders')}><Package className="mr-3" size={16} /> Orders</Button>
                    {store.user.role === 'admin' && <Button variant="outline" className="w-full h-11 rounded-none" onClick={() => setCurrentPage('admin')}><Settings className="mr-3" size={16} /> Admin Panel</Button>}
                    <Button variant="ghost" className="w-full h-11 rounded-none text-red-600" onClick={store.logout}><LogOut className="mr-3" size={16} /> Sign Out</Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowAuth(true)} className="p-3 hover:bg-black/5 rounded-full"><User size={18} strokeWidth={1.5} /></motion.button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="lg:hidden overflow-hidden border-t border-black/10">
              <nav className="py-8 space-y-1">
                {['Home', 'Shop', 'Wishlist', 'Orders'].map((item, idx) => (
                  <motion.button key={item} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.05 }}
                    onClick={() => { setCurrentPage(item.toLowerCase()); setMobileMenuOpen(false); }} 
                    className="block w-full text-left py-3 text-[13px] tracking-[0.2em] uppercase">{item}</motion.button>
                ))}
                {store.user?.role === 'admin' && (
                  <motion.button initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} onClick={() => { setCurrentPage('admin'); setMobileMenuOpen(false); }}
                    className="block w-full text-left py-3 text-[13px] tracking-[0.2em] uppercase">Admin Panel</motion.button>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

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
    if (result.success) { toast.success(`Welcome, ${result.user.name}`); onClose(); }
    else toast.error(result.error || 'Failed');
  };

  if (!show) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 md:p-12 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-serif">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[11px] font-medium tracking-[0.15em] uppercase text-black/60">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="mt-2 h-12 rounded-none" required />
          </div>
          <div>
            <label className="text-[11px] font-medium tracking-[0.15em] uppercase text-black/60">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-2 h-12 rounded-none" required />
          </div>
          <Button type="submit" className="w-full h-12 rounded-none text-sm tracking-[0.15em]" disabled={loading}>{loading ? 'Please wait...' : (isLogin ? 'SIGN IN' : 'CREATE ACCOUNT')}</Button>
        </form>
        <p className="text-center text-sm text-black/50 mt-8">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button onClick={() => setIsLogin(!isLogin)} className="text-black font-medium ml-2 hover:underline">{isLogin ? 'Sign Up' : 'Sign In'}</button>
        </p>
        <div className="mt-8 p-4 bg-black/5 text-center">
          <p className="text-xs text-black/60">Admin: <span className="font-medium">admin@sevenghost.com</span></p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ProductCard = ({ product, onClick, onWishlist, isWishlisted, index }) => {
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }} className="group cursor-pointer" onClick={onClick}>
      <div className="relative overflow-hidden bg-[#f5f5f5] aspect-[3/4]">
        <motion.img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" loading="lazy" whileHover={{ scale: 1.05 }} transition={{ duration: 0.8 }} />
        <motion.button initial={{ opacity: 0 }} whileHover={{ scale: 1.1 }} animate={{ opacity: 1 }} onClick={(e) => { e.stopPropagation(); onWishlist(product.id); }}
          className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center ${isWishlisted ? 'bg-black text-white' : 'bg-white/90 hover:bg-white shadow-lg'}`}>
          <Heart size={16} fill={isWishlisted ? 'white' : 'none'} strokeWidth={1.5} />
        </motion.button>
        {discount > 0 && <div className="absolute top-4 left-4 bg-black text-white text-[10px] tracking-[0.1em] px-3 py-1.5">-{discount}%</div>}
      </div>
      <div className="mt-5 space-y-1.5">
        <p className="text-[10px] text-black/40 tracking-[0.2em] uppercase">{product.type}</p>
        <h3 className="text-sm font-medium">{product.name}</h3>
        <div className="flex items-center gap-3 pt-1">
          <span className="text-sm font-medium">₹{product.price.toLocaleString()}</span>
          {product.originalPrice > product.price && <span className="text-sm text-black/40 line-through">₹{product.originalPrice.toLocaleString()}</span>}
        </div>
      </div>
    </motion.div>
  );
};

// ============== PAGE COMPONENTS ==============

const HomePage = ({ store, setCurrentPage }) => {
  const featuredProducts = store.products.filter(p => p.featured).slice(0, 4);
  const categories = [
    { id: 'plain', name: 'Plain', subtitle: 'Timeless Essentials', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600' },
    { id: 'printed', name: 'Printed', subtitle: 'Artful Expression', image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600' },
    { id: 'polo', name: 'Polo', subtitle: 'Refined Elegance', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600' }
  ];

  return (
    <div className="overflow-hidden">
      <section className="relative h-screen">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1611042553484-d61f84d22784?w=1920" alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="relative h-full container mx-auto px-6 lg:px-12 flex items-center">
          <div className="max-w-2xl text-white">
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-[11px] tracking-[0.4em] uppercase mb-6 text-white/70">New Collection 2025</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[0.9] mb-8">Wear Your<br />Identity</motion.h2>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-lg text-white/70 mb-10 max-w-md">Premium quality t-shirts designed for minimal aesthetics and superior comfort.</motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              <Button size="lg" className="h-14 px-10 bg-white text-black hover:bg-white/90 rounded-none text-[12px] tracking-[0.2em]" onClick={() => setCurrentPage('shop')}>
                SHOP COLLECTION <ArrowRight className="ml-3" size={16} />
              </Button>
            </motion.div>
          </div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-white">
          <span className="text-[10px] tracking-[0.3em] mb-3">SCROLL</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-[1px] h-12 bg-white/50" />
        </motion.div>
      </section>

      <section className="py-6 border-y border-black/10 overflow-hidden bg-white">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(10)].map((_, i) => <span key={i} className="mx-8 text-[11px] tracking-[0.4em] uppercase text-black/40">Free Shipping Over ₹999 • Premium Quality • Easy Returns</span>)}
        </div>
      </section>

      <section className="py-24 lg:py-32 container mx-auto px-6 lg:px-12">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
          <p className="text-[11px] tracking-[0.4em] uppercase text-black/40 mb-4">Categories</p>
          <h3 className="text-3xl md:text-5xl font-serif">Shop by Style</h3>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((cat, idx) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
              className="group cursor-pointer" onClick={() => setCurrentPage({ page: 'shop', filter: { type: cat.id } })}>
              <div className="relative overflow-hidden aspect-[3/4]">
                <motion.img src={cat.image} alt={cat.name} className="w-full h-full object-cover" whileHover={{ scale: 1.08 }} transition={{ duration: 0.8 }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <p className="text-[10px] tracking-[0.3em] uppercase opacity-70 mb-2">{cat.subtitle}</p>
                  <h4 className="text-2xl font-serif flex items-center gap-3">{cat.name} <ArrowUpRight size={20} strokeWidth={1.5} /></h4>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-24 lg:py-32 bg-[#fafafa]">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
            <div>
              <p className="text-[11px] tracking-[0.4em] uppercase text-black/40 mb-4">Selection</p>
              <h3 className="text-3xl md:text-5xl font-serif">Featured Pieces</h3>
            </div>
            <motion.button whileHover={{ x: 5 }} onClick={() => setCurrentPage('shop')} className="mt-6 md:mt-0 text-[12px] tracking-[0.15em] uppercase flex items-center gap-3">View All <ArrowRight size={14} /></motion.button>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {featuredProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} onClick={() => setCurrentPage({ page: 'product', id: product.id })} onWishlist={store.toggleWishlist} isWishlisted={store.wishlist.includes(product.id)} />
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-black text-white py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <h4 className="text-2xl tracking-[0.2em] font-medium mb-6">SEVENGHOST</h4>
              <p className="text-white/50 text-sm leading-relaxed max-w-sm mb-8">Premium fashion for the modern individual.</p>
              <div className="flex gap-2">
                <Input placeholder="Email" className="bg-white/10 border-white/20 text-white rounded-none h-12" />
                <Button className="h-12 px-6 rounded-none">JOIN</Button>
              </div>
            </div>
            <div>
              <h5 className="text-[11px] tracking-[0.2em] uppercase mb-6 text-white/50">Quick Links</h5>
              <ul className="space-y-4">{['Shop All', 'New Arrivals', 'Sale'].map(item => <li key={item}><button className="text-sm text-white/70 hover:text-white">{item}</button></li>)}</ul>
            </div>
            <div>
              <h5 className="text-[11px] tracking-[0.2em] uppercase mb-6 text-white/50">Help</h5>
              <ul className="space-y-4">{['Contact', 'Shipping', 'Returns'].map(item => <li key={item}><button className="text-sm text-white/70 hover:text-white">{item}</button></li>)}</ul>
            </div>
          </div>
          <Separator className="bg-white/10 mb-8" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[11px] text-white/40">© 2025 SevenGhost</p>
            <p className="text-[10px] bg-amber-500/20 text-amber-400 px-4 py-2">DEMO MODE</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const ShopPage = ({ store, setCurrentPage, initialFilter }) => {
  const [filters, setFilters] = useState({ category: initialFilter?.category || 'all', type: initialFilter?.type || 'all', priceRange: 'all' });
  const filteredProducts = store.products.filter(product => {
    if (filters.category !== 'all' && product.category !== filters.category) return false;
    if (filters.type !== 'all' && product.type !== filters.type) return false;
    return true;
  });

  return (
    <div className="min-h-screen pt-24 lg:pt-32">
      <div className="container mx-auto px-6 lg:px-12 py-12 lg:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-[11px] tracking-[0.4em] uppercase text-black/40 mb-4">Collection</p>
          <h1 className="text-4xl md:text-6xl font-serif mb-4">Shop All</h1>
          <p className="text-black/50">{filteredProducts.length} pieces</p>
        </motion.div>
      </div>
      <div className="container mx-auto px-6 lg:px-12 pb-24">
        <div className="flex items-center gap-6 mb-12 pb-6 border-b border-black/10">
          <Select value={filters.category} onValueChange={(v) => setFilters({...filters, category: v})}>
            <SelectTrigger className="w-36 rounded-none h-10 text-[11px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="men">Men</SelectItem>
              <SelectItem value="women">Women</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.type} onValueChange={(v) => setFilters({...filters, type: v})}>
            <SelectTrigger className="w-36 rounded-none h-10 text-[11px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="plain">Plain</SelectItem>
              <SelectItem value="printed">Printed</SelectItem>
              <SelectItem value="polo">Polo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {filteredProducts.map((product, idx) => (
            <ProductCard key={product.id} product={product} index={idx} onClick={() => setCurrentPage({ page: 'product', id: product.id })} onWishlist={store.toggleWishlist} isWishlisted={store.wishlist.includes(product.id)} />
          ))}
        </div>
      </div>
    </div>
  );
};

const ProductPage = ({ store, productId, setCurrentPage }) => {
  const [selectedSize, setSelectedSize] = useState('');
  const product = store.products.find(p => p.id === productId);
  if (!product) return <div className="min-h-screen flex items-center justify-center pt-24"><p>Product not found</p></div>;
  
  const relatedProducts = store.products.filter(p => p.type === product.type && p.id !== product.id).slice(0, 4);
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  const handleAddToCart = async () => {
    if (!selectedSize) { toast.error('Please select a size'); return; }
    await store.addToCart(product.id, selectedSize);
  };

  return (
    <div className="min-h-screen pt-24 lg:pt-32">
      <div className="container mx-auto px-6 lg:px-12 py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-[11px] text-black/40 mb-12">
          <button onClick={() => setCurrentPage('home')}>Home</button><span>/</span>
          <button onClick={() => setCurrentPage('shop')}>Shop</button><span>/</span>
          <span className="text-black">{product.name}</span>
        </motion.div>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <div className="aspect-[3/4] bg-[#f5f5f5] overflow-hidden sticky top-32">
              <motion.img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" whileHover={{ scale: 1.03 }} transition={{ duration: 0.8 }} />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="lg:py-8">
            <p className="text-[10px] text-black/40 tracking-[0.3em] uppercase mb-4">{product.category} · {product.type}</p>
            <h1 className="text-3xl lg:text-4xl font-serif mb-6">{product.name}</h1>
            <div className="flex items-center gap-4 mb-8">
              <span className="text-2xl font-medium">₹{product.price.toLocaleString()}</span>
              {product.originalPrice > product.price && (
                <>
                  <span className="text-lg text-black/40 line-through">₹{product.originalPrice.toLocaleString()}</span>
                  <span className="text-[10px] bg-green-100 text-green-800 px-3 py-1">SAVE {discount}%</span>
                </>
              )}
            </div>
            <p className="text-black/60 leading-relaxed mb-10">{product.description}</p>
            <Separator className="my-8" />
            <div className="mb-10">
              <p className="text-[11px] tracking-[0.2em] uppercase mb-4">Select Size</p>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map(size => (
                  <motion.button key={size} whileHover={{ scale: 1.05 }} onClick={() => setSelectedSize(size)}
                    className={`w-14 h-14 border text-sm font-medium ${selectedSize === size ? 'border-black bg-black text-white' : 'border-black/20 hover:border-black'}`}>{size}</motion.button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4 mb-10">
              <Button className="h-14 rounded-none text-[12px] tracking-[0.2em]" onClick={handleAddToCart}>ADD TO BAG</Button>
              <Button variant="outline" className="h-14 rounded-none text-[12px] tracking-[0.2em] border-black" onClick={async () => { if (!selectedSize) { toast.error('Select size'); return; } const s = await store.addToCart(product.id, selectedSize); if (s) setCurrentPage('checkout'); }}>BUY NOW</Button>
            </div>
            <button onClick={() => store.toggleWishlist(product.id)} className="flex items-center gap-3 text-[11px] tracking-[0.15em] uppercase text-black/60 hover:text-black">
              <Heart size={16} fill={store.wishlist.includes(product.id) ? 'currentColor' : 'none'} />
              {store.wishlist.includes(product.id) ? 'Saved' : 'Add to Wishlist'}
            </button>
          </motion.div>
        </div>
        {relatedProducts.length > 0 && (
          <section className="mt-24 pt-16 border-t border-black/10">
            <h2 className="text-2xl font-serif mb-12 text-center">You May Also Like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p, idx) => <ProductCard key={p.id} product={p} index={idx} onClick={() => setCurrentPage({ page: 'product', id: p.id })} onWishlist={store.toggleWishlist} isWishlisted={store.wishlist.includes(p.id)} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

const CheckoutPage = ({ store, setCurrentPage }) => {
  const [address, setAddress] = useState({ name: '', phone: '', addressLine: '', city: '', state: '', pincode: '' });
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (!address.name || !address.phone || !address.addressLine || !address.city || !address.pincode) { toast.error('Fill all fields'); return; }
    setLoading(true);
    try {
      if (paymentMethod === 'razorpay') { toast.info('Simulating payment...'); await new Promise(r => setTimeout(r, 1500)); }
      const res = await fetch('/api/orders/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: store.user.id, items: store.cart.items, address, paymentMethod, total: store.cart.total }) });
      const data = await res.json();
      if (data.order) { store.setCart({ items: [], total: 0 }); toast.success('Order placed!'); setCurrentPage('orders'); }
    } catch (e) { toast.error('Failed'); } finally { setLoading(false); }
  };

  if (!store.user) return <div className="min-h-screen flex items-center justify-center pt-24"><div className="text-center"><p className="text-black/40 mb-6">Please login</p><Button onClick={() => setCurrentPage('home')} className="rounded-none">Go Home</Button></div></div>;
  if (store.cart.items.length === 0) return <div className="min-h-screen flex items-center justify-center pt-24"><div className="text-center"><ShoppingBag size={48} className="mx-auto mb-6 opacity-20" /><p className="text-black/40 mb-6">Cart is empty</p><Button onClick={() => setCurrentPage('shop')} className="rounded-none">Shop</Button></div></div>;

  return (
    <div className="min-h-screen pt-24 lg:pt-32 bg-[#fafafa]">
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-serif mb-12 text-center">Checkout</motion.h1>
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8">
              <h2 className="text-[11px] tracking-[0.2em] uppercase mb-6">Delivery Address</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="text-[10px] tracking-[0.15em] uppercase text-black/50">Name</label><Input value={address.name} onChange={(e) => setAddress({...address, name: e.target.value})} className="mt-2 rounded-none h-12" /></div>
                <div><label className="text-[10px] tracking-[0.15em] uppercase text-black/50">Phone</label><Input value={address.phone} onChange={(e) => setAddress({...address, phone: e.target.value})} className="mt-2 rounded-none h-12" /></div>
                <div className="sm:col-span-2"><label className="text-[10px] tracking-[0.15em] uppercase text-black/50">Address</label><Input value={address.addressLine} onChange={(e) => setAddress({...address, addressLine: e.target.value})} className="mt-2 rounded-none h-12" /></div>
                <div><label className="text-[10px] tracking-[0.15em] uppercase text-black/50">City</label><Input value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} className="mt-2 rounded-none h-12" /></div>
                <div><label className="text-[10px] tracking-[0.15em] uppercase text-black/50">Pincode</label><Input value={address.pincode} onChange={(e) => setAddress({...address, pincode: e.target.value})} className="mt-2 rounded-none h-12" /></div>
              </div>
            </div>
            <div className="bg-white p-8">
              <h2 className="text-[11px] tracking-[0.2em] uppercase mb-6">Payment</h2>
              <div className="space-y-4">
                {[{ id: 'razorpay', label: 'Pay Online', desc: 'Cards, UPI, Net Banking', icon: CreditCard, mock: true }, { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive', icon: Truck }].map((m) => (
                  <label key={m.id} className={`flex items-center gap-4 p-5 border cursor-pointer ${paymentMethod === m.id ? 'border-black' : 'border-black/10'}`}>
                    <input type="radio" name="payment" checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="w-4 h-4" />
                    <m.icon size={20} /><div className="flex-1"><p className="text-sm font-medium">{m.label}</p><p className="text-xs text-black/50">{m.desc}</p></div>
                    {m.mock && <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-1">MOCK</span>}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="bg-white p-8 sticky top-32">
              <h2 className="text-[11px] tracking-[0.2em] uppercase mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">{store.cart.items.map(item => (<div key={item.id} className="flex gap-4"><img src={item.image} alt={item.name} className="w-20 h-24 object-cover" /><div><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-black/50">Size: {item.size} × {item.quantity}</p><p className="text-sm mt-1">₹{(item.price * item.quantity).toLocaleString()}</p></div></div>))}</div>
              <Separator className="my-6" />
              <div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-black/50">Subtotal</span><span>₹{store.cart.total.toLocaleString()}</span></div><div className="flex justify-between"><span className="text-black/50">Shipping</span><span className="text-green-700">Free</span></div></div>
              <Separator className="my-6" />
              <div className="flex justify-between text-lg font-medium mb-8"><span>Total</span><span>₹{store.cart.total.toLocaleString()}</span></div>
              <Button className="w-full h-14 rounded-none text-[12px] tracking-[0.2em]" onClick={handlePlaceOrder} disabled={loading}>{loading ? 'PROCESSING...' : 'PLACE ORDER'}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrdersPage = ({ store, setCurrentPage }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (store.user) fetchOrders(); }, [store.user]);
  const fetchOrders = async () => { try { const res = await fetch(`/api/orders/${store.user.id}`); const data = await res.json(); setOrders(data.orders || []); } catch (e) {} finally { setLoading(false); } };
  if (!store.user) return null;

  return (
    <div className="min-h-screen pt-24 lg:pt-32 bg-[#fafafa]">
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-serif mb-12 text-center">My Orders</motion.h1>
        {loading ? <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-white animate-pulse" />)}</div>
        : orders.length === 0 ? <div className="bg-white p-16 text-center"><Package size={48} className="mx-auto mb-6 opacity-20" /><p className="text-black/40 mb-6">No orders yet</p><Button onClick={() => setCurrentPage('shop')} className="rounded-none">Shop</Button></div>
        : <div className="space-y-6">{orders.map((order, idx) => (<motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white p-6 lg:p-8"><div className="flex flex-wrap justify-between items-start gap-4 mb-6"><div><p className="text-[11px] text-black/40">ORDER #{order.id.slice(0, 8).toUpperCase()}</p><p className="text-sm mt-1">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div><div className="flex gap-3"><Badge variant="secondary" className="rounded-none text-[10px]">{order.status}</Badge><Badge variant="outline" className="rounded-none text-[10px]">{order.paymentMethod === 'cod' ? 'COD' : 'PAID'}</Badge></div></div><div className="flex flex-wrap gap-4">{order.items.map(item => (<div key={item.id} className="flex gap-3"><img src={item.image} alt={item.name} className="w-16 h-20 object-cover" /><div><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-black/50">{item.size} × {item.quantity}</p></div></div>))}</div><Separator className="my-6" /><div className="flex justify-between items-center"><p className="text-sm text-black/50">{order.address?.city}</p><p className="font-medium">₹{order.total.toLocaleString()}</p></div></motion.div>))}</div>}
      </div>
    </div>
  );
};

const WishlistPage = ({ store, setCurrentPage }) => {
  const wishlistedProducts = store.products.filter(p => store.wishlist.includes(p.id));
  return (
    <div className="min-h-screen pt-24 lg:pt-32 bg-[#fafafa]">
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12"><p className="text-[11px] tracking-[0.4em] uppercase text-black/40 mb-4">Saved</p><h1 className="text-3xl font-serif">Wishlist ({wishlistedProducts.length})</h1></motion.div>
        {wishlistedProducts.length === 0 ? <div className="bg-white p-16 text-center"><Heart size={48} className="mx-auto mb-6 opacity-20" /><p className="text-black/40 mb-6">Empty</p><Button onClick={() => setCurrentPage('shop')} className="rounded-none">Explore</Button></div>
        : <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">{wishlistedProducts.map((product, idx) => <ProductCard key={product.id} product={product} index={idx} onClick={() => setCurrentPage({ page: 'product', id: product.id })} onWishlist={store.toggleWishlist} isWishlisted={true} />)}</div>}
      </div>
    </div>
  );
};

// ============== ADMIN PANEL ==============

const AdminPanel = ({ store, setCurrentPage }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Product form state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', category: 'men', type: 'plain', price: '', originalPrice: '', images: '', sizes: 'S,M,L,XL', stock: '', description: '', featured: false });

  // Order filter
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, productsRes, usersRes, settingsRes] = await Promise.all([
        fetch('/api/admin/stats'), fetch('/api/admin/orders'), fetch('/api/products'), fetch('/api/admin/users'), fetch('/api/admin/settings')
      ]);
      setStats((await statsRes.json()).stats);
      setOrders((await ordersRes.json()).orders || []);
      setProducts((await productsRes.json()).products || []);
      setUsers((await usersRes.json()).users || []);
      setSettings((await settingsRes.json()).settings);
    } catch (e) { console.error('Error:', e); }
    finally { setLoading(false); }
  };

  const handleSaveProduct = async () => {
    try {
      const data = {
        ...productForm,
        price: parseInt(productForm.price),
        originalPrice: parseInt(productForm.originalPrice) || parseInt(productForm.price),
        images: productForm.images.split(',').map(url => url.trim()).filter(Boolean),
        sizes: productForm.sizes.split(',').map(s => s.trim()).filter(Boolean),
        stock: parseInt(productForm.stock) || 0
      };

      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await res.json();
      if (result.product) {
        toast.success(editingProduct ? 'Product updated!' : 'Product added!');
        setShowProductModal(false);
        setEditingProduct(null);
        setProductForm({ name: '', category: 'men', type: 'plain', price: '', originalPrice: '', images: '', sizes: 'S,M,L,XL', stock: '', description: '', featured: false });
        fetchAll();
        store.fetchProducts();
      }
    } catch (e) { toast.error('Failed to save product'); }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Delete this product?')) return;
    try {
      await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
      toast.success('Product deleted');
      fetchAll();
      store.fetchProducts();
    } catch (e) { toast.error('Failed'); }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await fetch(`/api/admin/orders/${orderId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      toast.success('Order updated');
      fetchAll();
    } catch (e) { toast.error('Failed'); }
  };

  const handleSaveSettings = async (section, data) => {
    try {
      const res = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [section]: data }) });
      const result = await res.json();
      if (result.success) {
        toast.success('Settings saved!');
        fetchAll();
      }
    } catch (e) { toast.error('Failed'); }
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      type: product.type,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      images: product.images.join(', '),
      sizes: product.sizes.join(', '),
      stock: product.stock?.toString() || '0',
      description: product.description || '',
      featured: product.featured || false
    });
    setShowProductModal(true);
  };

  const filteredOrders = orders.filter(o => {
    if (orderFilter !== 'all' && o.status !== orderFilter) return false;
    if (orderSearch) {
      const search = orderSearch.toLowerCase();
      return o.id.toLowerCase().includes(search) || o.address?.name?.toLowerCase().includes(search) || o.address?.phone?.includes(search);
    }
    return true;
  });

  if (store.user?.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-black/40">Access denied. Admin only.</p></div>;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Box },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-black/10 z-40 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 border-b border-black/10">
          <div className="flex items-center justify-between">
            {sidebarOpen && <h1 className="text-lg font-semibold tracking-wide">SevenGhost</h1>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-black/5 rounded-lg">
              {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === item.id ? 'bg-black text-white' : 'hover:bg-black/5'}`}>
              <item.icon size={20} />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-black/10">
          <button onClick={() => setCurrentPage('home')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-black/5">
            <Store size={20} />
            {sidebarOpen && <span className="text-sm">View Store</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="sticky top-0 bg-white border-b border-black/10 z-30">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h2 className="text-xl font-semibold capitalize">{activeTab}</h2>
              <p className="text-sm text-black/50">Manage your store</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-amber-100 text-amber-800 rounded-full">Demo Mode</Badge>
              <button onClick={fetchAll} className="p-2 hover:bg-black/5 rounded-lg"><RefreshCw size={20} /></button>
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium">
                {store.user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Revenue', value: `₹${stats?.totalRevenue?.toLocaleString() || 0}`, icon: IndianRupee, color: 'green', change: '+12%' },
                  { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingCart, color: 'blue', change: '+8%' },
                  { label: 'Products', value: stats?.totalProducts || 0, icon: Box, color: 'purple' },
                  { label: 'Customers', value: stats?.totalUsers || 0, icon: Users, color: 'orange' }
                ].map((item, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-black/50">{item.label}</p>
                            <p className="text-2xl font-semibold mt-2">{item.value}</p>
                            {item.change && <p className="text-xs text-green-600 mt-1">{item.change} from last month</p>}
                          </div>
                          <div className={`w-12 h-12 rounded-xl bg-${item.color}-100 flex items-center justify-center`}>
                            <item.icon className={`text-${item.color}-600`} size={22} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Revenue Overview</CardTitle>
                  <CardDescription>Last 7 days performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.chartData || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#000" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-xs font-medium text-black/50">ORDER</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-black/50">CUSTOMER</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-black/50">AMOUNT</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-black/50">STATUS</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-black/50">DATE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(stats?.recentOrders || []).map((order) => (
                          <tr key={order.id} className="border-b hover:bg-black/5">
                            <td className="py-3 px-4 text-sm font-medium">#{order.id.slice(0, 8)}</td>
                            <td className="py-3 px-4 text-sm">{order.userName || order.address?.name}</td>
                            <td className="py-3 px-4 text-sm font-medium">₹{order.total.toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="capitalize">{order.status}</Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-black/50">{new Date(order.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Products */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-black/50">{products.length} products</p>
                <Button onClick={() => { setEditingProduct(null); setProductForm({ name: '', category: 'men', type: 'plain', price: '', originalPrice: '', images: '', sizes: 'S,M,L,XL', stock: '', description: '', featured: false }); setShowProductModal(true); }}>
                  <Plus size={18} className="mr-2" /> Add Product
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-black/5">
                          <th className="text-left py-4 px-6 text-xs font-medium text-black/50">PRODUCT</th>
                          <th className="text-left py-4 px-6 text-xs font-medium text-black/50">CATEGORY</th>
                          <th className="text-left py-4 px-6 text-xs font-medium text-black/50">PRICE</th>
                          <th className="text-left py-4 px-6 text-xs font-medium text-black/50">STOCK</th>
                          <th className="text-left py-4 px-6 text-xs font-medium text-black/50">FEATURED</th>
                          <th className="text-left py-4 px-6 text-xs font-medium text-black/50">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id} className="border-b hover:bg-black/5">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-4">
                                <img src={product.images[0]} alt={product.name} className="w-12 h-14 object-cover rounded" />
                                <div>
                                  <p className="font-medium text-sm">{product.name}</p>
                                  <p className="text-xs text-black/50">{product.type}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm capitalize">{product.category}</td>
                            <td className="py-4 px-6 text-sm font-medium">₹{product.price.toLocaleString()}</td>
                            <td className="py-4 px-6 text-sm">{product.stock || 0}</td>
                            <td className="py-4 px-6">{product.featured && <Badge>Featured</Badge>}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => openEditProduct(product)}><Edit size={16} /></Button>
                                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteProduct(product.id)}><Trash2 size={16} /></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Orders */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Input placeholder="Search orders..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} className="max-w-sm" />
                <Select value={orderFilter} onValueChange={setOrderFilter}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-black/5">
                          <th className="text-left py-4 px-6 text-xs font-medium text-black/50">ORDER</th>
                          <th className="text-left py-4 px-6 text-xs font-medium text-black/50">CUSTOMER</th>
                          <th className="text-left py-4 px-6 text-xs font-medium text-black/50">ITEMS</th>
                          <th className="text-left py-4 px-6 text-xs font-medium text-black/50">AMOUNT</th>
                          <th className="text-left py-4 px-6 text-xs font-medium text-black/50">PAYMENT</th>
                          <th className="text-left py-4 px-6 text-xs font-medium text-black/50">STATUS</th>
                          <th className="text-left py-4 px-6 text-xs font-medium text-black/50">DATE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-black/5">
                            <td className="py-4 px-6 font-medium text-sm">#{order.orderNumber || order.id.slice(0, 8)}</td>
                            <td className="py-4 px-6">
                              <div>
                                <p className="text-sm font-medium">{order.userName || order.address?.name}</p>
                                <p className="text-xs text-black/50">{order.address?.phone}</p>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm">{order.items?.length} items</td>
                            <td className="py-4 px-6 text-sm font-medium">₹{order.total.toLocaleString()}</td>
                            <td className="py-4 px-6"><Badge variant="outline">{order.paymentMethod === 'cod' ? 'COD' : 'Paid'}</Badge></td>
                            <td className="py-4 px-6">
                              <Select value={order.status} onValueChange={(v) => handleUpdateOrderStatus(order.id, v)}>
                                <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="shipped">Shipped</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="py-4 px-6 text-sm text-black/50">{new Date(order.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-black/5">
                        <th className="text-left py-4 px-6 text-xs font-medium text-black/50">USER</th>
                        <th className="text-left py-4 px-6 text-xs font-medium text-black/50">ROLE</th>
                        <th className="text-left py-4 px-6 text-xs font-medium text-black/50">ORDERS</th>
                        <th className="text-left py-4 px-6 text-xs font-medium text-black/50">TOTAL SPENT</th>
                        <th className="text-left py-4 px-6 text-xs font-medium text-black/50">JOINED</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-black/5">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center"><User size={18} /></div>
                              <div>
                                <p className="font-medium text-sm">{user.name}</p>
                                <p className="text-xs text-black/50">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6"><Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge></td>
                          <td className="py-4 px-6 text-sm">{user.orderCount || 0}</td>
                          <td className="py-4 px-6 text-sm font-medium">₹{(user.totalSpent || 0).toLocaleString()}</td>
                          <td className="py-4 px-6 text-sm text-black/50">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl space-y-8">
              {/* Supabase Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><Database className="text-green-600" size={20} /></div>
                    <div>
                      <CardTitle className="text-lg">Supabase Configuration</CardTitle>
                      <CardDescription>Configure Supabase for authentication and database</CardDescription>
                    </div>
                  </div>
                  {settings?.supabase?.configured && <Badge className="ml-auto bg-green-100 text-green-800">Connected</Badge>}
                </CardHeader>
                <CardContent className="space-y-4">
                  <SettingsForm 
                    fields={[
                      { key: 'url', label: 'Supabase URL', placeholder: 'https://your-project.supabase.co' },
                      { key: 'anonKey', label: 'Anon Key', placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', type: 'password' },
                      { key: 'serviceRoleKey', label: 'Service Role Key', placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', type: 'password' }
                    ]}
                    initialData={settings?.supabase || {}}
                    onSave={(data) => handleSaveSettings('supabase', data)}
                  />
                </CardContent>
              </Card>

              {/* Razorpay Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><CreditCard className="text-blue-600" size={20} /></div>
                    <div>
                      <CardTitle className="text-lg">Razorpay Configuration</CardTitle>
                      <CardDescription>Configure Razorpay for payment processing</CardDescription>
                    </div>
                  </div>
                  {settings?.razorpay?.configured && <Badge className="ml-auto bg-green-100 text-green-800">Connected</Badge>}
                </CardHeader>
                <CardContent className="space-y-4">
                  <SettingsForm 
                    fields={[
                      { key: 'keyId', label: 'Key ID', placeholder: 'rzp_test_xxxxx' },
                      { key: 'keySecret', label: 'Key Secret', placeholder: 'Your key secret', type: 'password' },
                      { key: 'mode', label: 'Mode', type: 'select', options: [{ value: 'test', label: 'Test' }, { value: 'live', label: 'Live' }] }
                    ]}
                    initialData={settings?.razorpay || {}}
                    onSave={(data) => handleSaveSettings('razorpay', data)}
                  />
                </CardContent>
              </Card>

              {/* Payment Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Wallet className="text-purple-600" size={20} /></div>
                    <div>
                      <CardTitle className="text-lg">Payment Settings</CardTitle>
                      <CardDescription>Configure payment methods and modes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Payment Mode</p>
                      <p className="text-sm text-black/50">Switch between mock and live payments</p>
                    </div>
                    <Select defaultValue={settings?.payment?.mode || 'mock'} onValueChange={(v) => handleSaveSettings('payment', { ...settings?.payment, mode: v })}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mock">Mock</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-sm text-black/50">Enable COD payment option</p>
                    </div>
                    <Switch defaultChecked={settings?.payment?.codEnabled !== false} onCheckedChange={(v) => handleSaveSettings('payment', { ...settings?.payment, codEnabled: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Razorpay</p>
                      <p className="text-sm text-black/50">Enable online payments via Razorpay</p>
                    </div>
                    <Switch defaultChecked={settings?.payment?.razorpayEnabled} onCheckedChange={(v) => handleSaveSettings('payment', { ...settings?.payment, razorpayEnabled: v })} />
                  </div>
                </CardContent>
              </Card>

              {/* Store Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><Store className="text-orange-600" size={20} /></div>
                    <div>
                      <CardTitle className="text-lg">Store Settings</CardTitle>
                      <CardDescription>General store configuration</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SettingsForm 
                    fields={[
                      { key: 'name', label: 'Store Name', placeholder: 'SevenGhost' },
                      { key: 'currency', label: 'Currency', type: 'select', options: [{ value: 'INR', label: 'INR (₹)' }, { value: 'USD', label: 'USD ($)' }] },
                      { key: 'freeShippingThreshold', label: 'Free Shipping Threshold', placeholder: '999', type: 'number' }
                    ]}
                    initialData={settings?.store || {}}
                    onSave={(data) => handleSaveSettings('store', data)}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} className="mt-1" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={productForm.category} onValueChange={(v) => setProductForm({...productForm, category: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="men">Men</SelectItem>
                    <SelectItem value="women">Women</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={productForm.type} onValueChange={(v) => setProductForm({...productForm, type: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plain">Plain</SelectItem>
                    <SelectItem value="printed">Printed</SelectItem>
                    <SelectItem value="polo">Polo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price (₹)</Label>
                <Input type="number" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} className="mt-1" />
              </div>
              <div>
                <Label>Original Price (₹)</Label>
                <Input type="number" value={productForm.originalPrice} onChange={(e) => setProductForm({...productForm, originalPrice: e.target.value})} className="mt-1" />
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" value={productForm.stock} onChange={(e) => setProductForm({...productForm, stock: e.target.value})} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Sizes (comma separated)</Label>
              <Input value={productForm.sizes} onChange={(e) => setProductForm({...productForm, sizes: e.target.value})} className="mt-1" placeholder="S, M, L, XL" />
            </div>
            <div>
              <Label>Image URLs (comma separated)</Label>
              <Textarea value={productForm.images} onChange={(e) => setProductForm({...productForm, images: e.target.value})} className="mt-1" placeholder="https://..." rows={2} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} className="mt-1" rows={3} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={productForm.featured} onCheckedChange={(v) => setProductForm({...productForm, featured: v})} />
              <Label>Featured Product</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductModal(false)}>Cancel</Button>
            <Button onClick={handleSaveProduct}>{editingProduct ? 'Update' : 'Add'} Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Settings Form Component
const SettingsForm = ({ fields, initialData, onSave }) => {
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(data);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.key}>
          <Label className="text-sm">{field.label}</Label>
          {field.type === 'select' ? (
            <Select value={data[field.key] || ''} onValueChange={(v) => setData({...data, [field.key]: v})}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {field.options.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Input 
              type={field.type || 'text'} 
              value={data[field.key] || ''} 
              onChange={(e) => setData({...data, [field.key]: e.target.value})} 
              placeholder={field.placeholder}
              className="mt-1"
            />
          )}
        </div>
      ))}
      <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
    </div>
  );
};

// Mobile Navigation
const MobileNav = ({ currentPage, setCurrentPage, store, setShowAuth }) => (
  <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-black/10 lg:hidden z-40">
    <div className="flex items-center justify-around py-3">
      {[{ icon: Home, label: 'Home', page: 'home' }, { icon: Grid3X3, label: 'Shop', page: 'shop' }, { icon: Heart, label: 'Saved', page: 'wishlist', count: store.wishlist.length }, { icon: Package, label: 'Orders', page: 'orders' }, { icon: User, label: 'Account', page: 'account' }].map((item) => (
        <button key={item.page} onClick={() => { if (item.page === 'account') { if (!store.user) setShowAuth(true); } else if (['wishlist', 'orders'].includes(item.page) && !store.user) { setShowAuth(true); } else { setCurrentPage(item.page); } }}
          className={`flex flex-col items-center p-2 relative ${currentPage === item.page ? 'text-black' : 'text-black/40'}`}>
          <item.icon size={20} strokeWidth={1.5} />
          {item.count > 0 && <span className="absolute top-1 right-1 w-3 h-3 bg-black text-white text-[8px] rounded-full flex items-center justify-center">{item.count}</span>}
          <span className="text-[9px] mt-1">{item.label}</span>
        </button>
      ))}
    </div>
  </motion.div>
);

// ============== MAIN APP ==============
export default function App() {
  const store = useStore();
  const [currentPage, setCurrentPage] = useState('home');
  const [showAuth, setShowAuth] = useState(false);

  const handleSetCurrentPage = (page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const renderPage = () => {
    const page = typeof currentPage === 'object' ? currentPage.page : currentPage;
    switch (page) {
      case 'shop': return <ShopPage store={store} setCurrentPage={handleSetCurrentPage} initialFilter={currentPage.filter} />;
      case 'product': return <ProductPage store={store} productId={currentPage.id} setCurrentPage={handleSetCurrentPage} />;
      case 'checkout': return <CheckoutPage store={store} setCurrentPage={handleSetCurrentPage} />;
      case 'orders': return <OrdersPage store={store} setCurrentPage={handleSetCurrentPage} />;
      case 'wishlist': return <WishlistPage store={store} setCurrentPage={handleSetCurrentPage} />;
      case 'admin': return <AdminPanel store={store} setCurrentPage={handleSetCurrentPage} />;
      default: return <HomePage store={store} setCurrentPage={handleSetCurrentPage} />;
    }
  };

  if (store.loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border border-black border-t-transparent rounded-full mx-auto mb-6" />
        <p className="text-[11px] tracking-[0.3em] uppercase text-black/40">Loading</p>
      </motion.div>
    </div>
  );

  const page = typeof currentPage === 'object' ? currentPage.page : currentPage;

  return (
    <div className={page !== 'admin' ? 'pb-20 lg:pb-0' : ''}>
      {page !== 'admin' && <Header store={store} currentPage={page} setCurrentPage={handleSetCurrentPage} setShowAuth={setShowAuth} />}
      <main><AnimatePresence mode="wait">{renderPage()}</AnimatePresence></main>
      {page !== 'admin' && <MobileNav currentPage={page} setCurrentPage={handleSetCurrentPage} store={store} setShowAuth={setShowAuth} />}
      <AnimatePresence>{showAuth && <AuthModal show={showAuth} onClose={() => setShowAuth(false)} store={store} />}</AnimatePresence>
    </div>
  );
}
