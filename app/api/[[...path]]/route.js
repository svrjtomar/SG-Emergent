import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseServerClient, hasSupabaseEnv, isUsingServiceRole } from '@/lib/supabase';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const defaultSettings = {
  supabase: { url: '', anonKey: '', serviceRoleKey: '', configured: false },
  razorpay: { keyId: '', keySecret: '', configured: false, mode: 'test' },
  payment: { mode: 'mock', codEnabled: true, razorpayEnabled: false },
  store: { name: 'SevenGhost', currency: 'INR', freeShippingThreshold: 999 },
  cms: {
    heroBadge: 'New Collection 2025',
    heroTitle: 'Wear Your Identity',
    heroSubtitle: 'Premium quality t-shirts designed for minimal aesthetics and superior comfort.',
    heroImage: 'https://images.unsplash.com/photo-1611042553484-d61f84d22784?w=1920',
    marqueeText: 'Free Shipping Over ₹999 • Premium Quality • Easy Returns',
    featuredHeading: 'Featured Pieces',
    categoryHeading: 'Shop by Style',
    footerBlurb: 'Premium fashion for the modern individual.',
    footerEmailPlaceholder: 'Email',
    footerCopyright: '© 2025 SevenGhost. All rights reserved.',
  },
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function getPathSegments(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');
  return path.split('/').filter(Boolean);
}

function json(data, init = {}) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...(init.headers || {}),
    },
  });
}

function enrichSupabaseError(error) {
  const message = String(error?.message || error || 'Unknown Supabase error');
  if (!isUsingServiceRole() && /row-level security|permission denied|not allowed|violates row-level security/i.test(message)) {
    return `${message}. Add SUPABASE_SERVICE_ROLE_KEY to .env.local for server-side writes or disable RLS on these tables.`;
  }
  return message;
}

function isMissingColumnError(error) {
  return /schema cache|column|does not exist/i.test(String(error?.message || error || ''));
}

function isMaskedSecret(value) {
  return typeof value === 'string' && /^\*{4,}/.test(value);
}

function fallbackCart(userId) {
  return { userId, items: [], total: 0 };
}

function fallbackWishlist(userId) {
  return { userId, items: [] };
}

function mapProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    price: row.price ?? 0,
    originalPrice: row.original_price ?? row.price ?? 0,
    images: Array.isArray(row.images) ? row.images : [],
    category: row.category,
    type: row.type,
    sizes: Array.isArray(row.sizes) && row.sizes.length > 0 ? row.sizes : ['S', 'M', 'L', 'XL'],
    stock: row.stock ?? 0,
    description: row.description || 'Premium everyday essential.',
    featured: row.featured ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at || null,
  };
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role || 'user',
    createdAt: row.created_at,
  };
}

function mapCart(row, userId) {
  if (!row) return fallbackCart(userId);
  return {
    userId,
    items: Array.isArray(row.items) ? row.items : [],
    total: row.total ?? 0,
  };
}

function mapWishlist(row, userId) {
  if (!row) return fallbackWishlist(userId);
  return {
    userId,
    items: Array.isArray(row.items) ? row.items : [],
  };
}

function mapOrder(row) {
  return {
    id: row.id,
    orderNumber: row.order_number || `SG${String(row.id).slice(0, 8).toUpperCase()}`,
    userId: row.user_id,
    userEmail: row.user_email || '',
    userName: row.user_name || '',
    items: Array.isArray(row.items) ? row.items : [],
    address: row.address || {},
    paymentMethod: row.payment_method || 'cod',
    total: row.total ?? 0,
    status: row.status || 'pending',
    paymentStatus: row.payment_status || 'pending',
    razorpayOrderId: row.razorpay_order_id || null,
    razorpayPaymentId: row.razorpay_payment_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at || null,
  };
}

function maskSettings(settings) {
  return {
    ...settings,
    supabase: {
      ...settings.supabase,
      anonKey: settings.supabase?.anonKey ? `********${settings.supabase.anonKey.slice(-8)}` : '',
      serviceRoleKey: settings.supabase?.serviceRoleKey ? `********${settings.supabase.serviceRoleKey.slice(-8)}` : '',
    },
    razorpay: {
      ...settings.razorpay,
      keySecret: settings.razorpay?.keySecret ? `********${settings.razorpay.keySecret.slice(-4)}` : '',
    },
  };
}

function calcCartTotal(items) {
  return (items || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
}

function generateOrderNumber() {
  const stamp = Date.now().toString().slice(-8);
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `SG${stamp}${suffix}`;
}

function normalizeAddress(address = {}) {
  return {
    ...address,
    address: address.address || address.addressLine || '',
  };
}

function buildOrderPayload({ userId, userRow, items, address, paymentMethod, total, orderNumber }) {
  const normalizedAddress = normalizeAddress(address);
  return {
    user_id: userId,
    order_number: orderNumber,
    user_email: normalizedAddress.email || userRow?.email || '',
    user_name: userRow?.name || normalizedAddress.name || '',
    items,
    address: normalizedAddress,
    payment_method: paymentMethod,
    total,
    status: 'pending',
    payment_status: paymentMethod === 'cod' ? 'pending' : 'created',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function buildReadFallback(segments) {
  if (segments[0] === 'products' && segments.length === 1) return { products: [] };
  if (segments[0] === 'products' && segments.length === 2) return { product: null };
  if (segments[0] === 'cart' && segments.length === 2) return { cart: fallbackCart(segments[1]) };
  if (segments[0] === 'orders' && segments.length === 2) return { orders: [] };
  if (segments[0] === 'wishlist' && segments.length === 2) return { wishlist: fallbackWishlist(segments[1]) };
  if (segments[0] === 'admin' && segments[1] === 'orders') return { orders: [] };
  if (segments[0] === 'admin' && segments[1] === 'users') return { users: [] };
  if (segments[0] === 'admin' && segments[1] === 'stats') {
    return {
      stats: {
        totalOrders: 0,
        totalProducts: 0,
        totalUsers: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        chartData: [],
        recentOrders: [],
      },
    };
  }
  if (segments[0] === 'admin' && segments[1] === 'settings') return { settings: maskSettings(defaultSettings) };
  if (segments[0] === 'settings') return { settings: defaultSettings };
  if (segments[0] === 'seed') return { message: 'Supabase mode enabled. Seed via SQL or Supabase Studio.', count: 0 };
  return null;
}

function getClientOrFallback(segments) {
  if (!hasSupabaseEnv()) {
    return { client: null, fallback: buildReadFallback(segments), error: 'Supabase environment variables are missing' };
  }
  return { client: getSupabaseServerClient(), fallback: null, error: null };
}

async function getSettingsRecord(supabase) {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 'app_settings').maybeSingle();
  if (error) {
    return { id: 'app_settings', ...defaultSettings };
  }
  if (!data) return { id: 'app_settings', ...defaultSettings };
  const storeSettings = data.store || defaultSettings.store;
  const cmsSettings = data.cms || data.store?.cms || data.store?._cms || defaultSettings.cms;
  return {
    id: data.id,
    supabase: data.supabase || defaultSettings.supabase,
    razorpay: data.razorpay || defaultSettings.razorpay,
    payment: data.payment || defaultSettings.payment,
    store: storeSettings,
    cms: cmsSettings,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

async function fetchCartRecord(supabase, userId) {
  const { data, error } = await supabase.from('cart').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return mapCart(data, userId);
}

async function fetchWishlistRecord(supabase, userId) {
  const { data, error } = await supabase.from('wishlist').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return mapWishlist(data, userId);
}

async function upsertCart(supabase, userId, items) {
  const { data, error } = await supabase
    .from('cart')
    .upsert(
      {
        user_id: userId,
        items,
        total: calcCartTotal(items),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select('*')
    .single();
  if (error) throw error;
  return mapCart(data, userId);
}

async function upsertWishlist(supabase, userId, items) {
  const { data, error } = await supabase
    .from('wishlist')
    .upsert(
      {
        user_id: userId,
        items,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select('*')
    .single();
  if (error) throw error;
  return mapWishlist(data, userId);
}

export async function GET(request) {
  const segments = getPathSegments(request);
  const url = new URL(request.url);

  if (segments.length === 0 || segments[0] === 'health') {
    return json({ status: 'SevenGhost API is running', timestamp: new Date().toISOString() });
  }

  const { client: supabase, fallback, error: envError } = getClientOrFallback(segments);
  if (!supabase && fallback) {
    return json({ ...fallback, warning: envError });
  }

  try {
    if (segments[0] === 'products' && segments.length === 1) {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false });
      const category = url.searchParams.get('category');
      const type = url.searchParams.get('type');
      const search = url.searchParams.get('search');
      const featured = url.searchParams.get('featured');
      const minPrice = url.searchParams.get('minPrice');
      const maxPrice = url.searchParams.get('maxPrice');

      if (category) query = query.eq('category', category);
      if (type) query = query.eq('type', type);
      if (search) query = query.ilike('name', `%${search}%`);
      if (minPrice) query = query.gte('price', Number.parseInt(minPrice, 10));
      if (maxPrice) query = query.lte('price', Number.parseInt(maxPrice, 10));

      const { data, error } = await query;
      if (error) throw error;
      let products = (data || []).map(mapProduct);
      if (featured === 'true') {
        products = products.filter((product) => product.featured);
      }
      return json({ products });
    }

    if (segments[0] === 'products' && segments.length === 2) {
      const { data, error } = await supabase.from('products').select('*').eq('id', segments[1]).maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: 'Product not found' }, { status: 404 });
      return json({ product: mapProduct(data) });
    }

    if (segments[0] === 'cart' && segments.length === 2) {
      return json({ cart: await fetchCartRecord(supabase, segments[1]) });
    }

    if (segments[0] === 'orders' && segments.length === 2) {
      const { data, error } = await supabase.from('orders').select('*').eq('user_id', segments[1]).order('created_at', { ascending: false });
      if (error) throw error;
      const { data: userRow } = await supabase.from('users').select('*').eq('id', segments[1]).maybeSingle();
      const orders = (data || []).map((row) => ({
        ...mapOrder(row),
        userName: userRow?.name || '',
      }));
      return json({ orders });
    }

    if (segments[0] === 'admin' && segments[1] === 'orders') {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      const status = url.searchParams.get('status');
      const search = url.searchParams.get('search');
      if (status && status !== 'all') query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      const userIds = [...new Set((data || []).map((row) => row.user_id).filter(Boolean))];
      let userMap = new Map();
      if (userIds.length > 0) {
        const { data: usersData } = await supabase.from('users').select('*').in('id', userIds);
        userMap = new Map((usersData || []).map((user) => [user.id, mapUser(user)]));
      }
      let orders = (data || []).map((row) => {
        const order = mapOrder(row);
        const user = userMap.get(order.userId);
        return {
          ...order,
          userName: order.userName || user?.name || '',
          userEmail: order.userEmail || user?.email || '',
        };
      });
      if (search) {
        const needle = search.toLowerCase();
        orders = orders.filter((order) =>
          order.id?.toLowerCase().includes(needle) ||
          order.orderNumber?.toLowerCase().includes(needle) ||
          order.userName?.toLowerCase().includes(needle) ||
          order.address?.name?.toLowerCase().includes(needle) ||
          order.address?.phone?.toLowerCase().includes(needle)
        );
      }
      return json({ orders });
    }

    if (segments[0] === 'admin' && segments[1] === 'stats') {
      const [ordersRes, productsRes, usersRes] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('products').select('id'),
        supabase.from('users').select('id'),
      ]);
      if (ordersRes.error) throw ordersRes.error;
      if (productsRes.error) throw productsRes.error;
      if (usersRes.error) throw usersRes.error;

      const orders = (ordersRes.data || []).map(mapOrder);
      const chartData = [];
      for (let i = 6; i >= 0; i -= 1) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayOrders = orders.filter((order) => order.createdAt?.startsWith(dateStr));
        chartData.push({
          date: dateStr,
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, order) => sum + (order.total || 0), 0),
        });
      }

      return json({
        stats: {
          totalOrders: orders.length,
          totalProducts: productsRes.data?.length || 0,
          totalUsers: usersRes.data?.length || 0,
          totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
          pendingOrders: orders.filter((order) => order.status === 'pending').length,
          deliveredOrders: orders.filter((order) => order.status === 'delivered').length,
          chartData,
          recentOrders: orders.slice(0, 5),
        },
      });
    }

    if (segments[0] === 'admin' && segments[1] === 'users') {
      const [usersRes, ordersRes] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*'),
      ]);
      if (usersRes.error) throw usersRes.error;
      if (ordersRes.error) throw ordersRes.error;

      const orders = (ordersRes.data || []).map(mapOrder);
      const users = (usersRes.data || []).map((row) => {
        const user = mapUser(row);
        const userOrders = orders.filter((order) => order.userId === user.id);
        return {
          ...user,
          orderCount: userOrders.length,
          totalSpent: userOrders.reduce((sum, order) => sum + (order.total || 0), 0),
        };
      });

      return json({ users });
    }

    if (segments[0] === 'admin' && segments[1] === 'settings') {
      return json({ settings: maskSettings(await getSettingsRecord(supabase)) });
    }

    if (segments[0] === 'settings') {
      return json({ settings: await getSettingsRecord(supabase) });
    }

    if (segments[0] === 'wishlist' && segments.length === 2) {
      return json({ wishlist: await fetchWishlistRecord(supabase, segments[1]) });
    }

    if (segments[0] === 'seed') {
      return json({ message: 'Supabase mode enabled. Seed via SQL or Supabase Studio.', count: 0 });
    }

    return json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('GET Error:', error);
    const message = enrichSupabaseError(error);
    if (fallback) return json({ ...fallback, warning: message });
    return json({ error: message }, { status: 500 });
  }
}

export async function POST(request) {
  const segments = getPathSegments(request);
  const body = await request.json();
  const { client: supabase } = getClientOrFallback(segments);

  if (!supabase) {
    return json({ error: 'Supabase environment variables are missing' }, { status: 500 });
  }

  try {
    if (segments[0] === 'auth' && segments[1] === 'login') {
      const { email, password } = body;
      if (!email || !password) {
        return json({ error: 'Email and password required' }, { status: 400 });
      }

      const { data: existing, error: lookupError } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      if (lookupError) throw lookupError;

      let user = existing;
      if (!user) {
        const { data, error } = await supabase
          .from('users')
          .insert({
            email,
            name: email.split('@')[0],
            role: email === 'admin@sevenghost.com' ? 'admin' : 'user',
          })
          .select('*')
          .single();
        if (error) throw error;
        user = data;
      }

      return json({ user: mapUser(user), token: `mock-jwt-token-${user.id}` });
    }

    if (segments[0] === 'cart' && segments[1] === 'add') {
      const { userId, productId, size, quantity = 1 } = body;
      if (!userId || !productId || !size) {
        return json({ error: 'userId, productId, and size required' }, { status: 400 });
      }

      const { data: productRow, error: productError } = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
      if (productError) throw productError;
      if (!productRow) return json({ error: 'Product not found' }, { status: 404 });

      const cart = await fetchCartRecord(supabase, userId);
      const items = [...cart.items];
      const index = items.findIndex((item) => item.productId === productId && item.size === size);
      if (index >= 0) {
        items[index].quantity += quantity;
      } else {
        items.push({
          id: uuidv4(),
          productId,
          name: productRow.name,
          price: productRow.price,
          image: Array.isArray(productRow.images) ? productRow.images[0] : '',
          size,
          quantity,
        });
      }

      return json({ cart: await upsertCart(supabase, userId, items) });
    }

    if (segments[0] === 'cart' && segments[1] === 'remove') {
      const { userId, itemId } = body;
      if (!userId || !itemId) {
        return json({ error: 'userId and itemId required' }, { status: 400 });
      }

      const cart = await fetchCartRecord(supabase, userId);
      return json({ cart: await upsertCart(supabase, userId, cart.items.filter((item) => item.id !== itemId)) });
    }

    if (segments[0] === 'orders' && segments[1] === 'create') {
      const { userId, items, address, paymentMethod, total } = body;
      if (!userId || !items || !address || !paymentMethod) {
        return json({ error: 'Missing required fields' }, { status: 400 });
      }

      const { data: userRow } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      const orderNumber = body.orderNumber || generateOrderNumber();
      const normalizedAddress = normalizeAddress(address);
      const richOrderPayload = buildOrderPayload({
        userId,
        userRow,
        items,
        address: normalizedAddress,
        paymentMethod,
        total,
        orderNumber,
      });
      const baseOrderPayload = {
        user_id: userId,
        items,
        total,
        status: 'pending',
        created_at: richOrderPayload.created_at,
      };

      let data;
      let error;
      ({ data, error } = await supabase.from('orders').insert(richOrderPayload).select('*').single());
      if (error && isMissingColumnError(error)) {
        ({ data, error } = await supabase.from('orders').insert(baseOrderPayload).select('*').single());
      }
      if (error) throw error;

      await upsertCart(supabase, userId, []);
      return json({
        order: {
          ...mapOrder(data),
          userName: userRow?.name || normalizedAddress.name || '',
          userEmail: normalizedAddress.email || userRow?.email || '',
          address: normalizedAddress,
          paymentMethod,
          paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed',
          orderNumber,
        },
      });
    }

    if (segments[0] === 'payment' && segments[1] === 'create') {
      const { userId, items, address, amount, total, currency = 'INR' } = body;
      if (!userId || !items || !address || !amount) {
        return json({ error: 'userId, items, address, and amount are required' }, { status: 400 });
      }

      const settings = await getSettingsRecord(supabase);
      const keyId = settings?.razorpay?.keyId?.trim();
      const keySecret = settings?.razorpay?.keySecret?.trim();
      const { data: userRow } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      const orderNumber = generateOrderNumber();
      const normalizedAddress = normalizeAddress(address);
      const orderPayload = buildOrderPayload({
        userId,
        userRow,
        items,
        address: normalizedAddress,
        paymentMethod: 'razorpay',
        total: total ?? amount,
        orderNumber,
      });
      const isRazorpayLive =
        settings?.payment?.razorpayEnabled &&
        settings?.payment?.mode === 'live' &&
        settings?.razorpay?.configured &&
        keyId &&
        keySecret;

      const { data: createdOrder, error: createOrderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select('*')
        .single();
      if (createOrderError) throw createOrderError;

      if (isRazorpayLive) {
        const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount * 100,
            currency,
            receipt: orderNumber,
            notes: {
              internal_order_id: createdOrder.id,
              order_number: orderNumber,
              customer_name: normalizedAddress.name || '',
            },
          }),
        });

        const razorpayOrder = await razorpayRes.json();
        if (!razorpayRes.ok) {
          await supabase
            .from('orders')
            .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
            .eq('id', createdOrder.id);
          throw new Error(razorpayOrder?.error?.description || 'Failed to create Razorpay order. Check Razorpay key ID/secret and test/live mode.');
        }

        const { error: updateOrderError } = await supabase
          .from('orders')
          .update({
            razorpay_order_id: razorpayOrder.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', createdOrder.id);
        if (updateOrderError && !isMissingColumnError(updateOrderError)) throw updateOrderError;

        return json({
          order: razorpayOrder,
          appOrder: {
            ...mapOrder(createdOrder),
            orderNumber,
            address: normalizedAddress,
            userName: userRow?.name || normalizedAddress.name || '',
            userEmail: normalizedAddress.email || userRow?.email || '',
          },
          isLive: true,
          keyId,
        });
      }

      const mockRazorpayOrderId = `order_${uuidv4().substring(0, 14)}`;
      const { error: updateMockOrderError } = await supabase
        .from('orders')
        .update({
          razorpay_order_id: mockRazorpayOrderId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', createdOrder.id);
      if (updateMockOrderError && !isMissingColumnError(updateMockOrderError)) throw updateMockOrderError;

      return json({
        order: {
          id: mockRazorpayOrderId,
          amount: amount * 100,
          currency,
          status: 'created',
          created_at: Date.now(),
          mock: true,
        },
        appOrder: {
          ...mapOrder(createdOrder),
          orderNumber,
          address: normalizedAddress,
          userName: userRow?.name || normalizedAddress.name || '',
          userEmail: normalizedAddress.email || userRow?.email || '',
        },
        isLive: false,
        keyId,
      });
    }

    if (segments[0] === 'payment' && segments[1] === 'verify') {
      const settings = await getSettingsRecord(supabase);
      const keySecret = settings?.razorpay?.keySecret;
      const { orderId, userId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      if (!orderId || !userId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return json({ error: 'Missing order or Razorpay verification fields' }, { status: 400 });
      }

      const verifyUpdatePayload = {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        payment_status: 'completed',
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      };
      const isRazorpayLive =
        settings?.payment?.razorpayEnabled &&
        settings?.payment?.mode === 'live' &&
        settings?.razorpay?.configured &&
        keySecret;

      if (!isRazorpayLive) {
        const { data: orderRow, error: updateError } = await supabase
          .from('orders')
          .update(verifyUpdatePayload)
          .eq('id', orderId)
          .select('*')
          .single();
        if (updateError && !isMissingColumnError(updateError)) throw updateError;
        if (updateError && isMissingColumnError(updateError)) {
          const { error: fallbackUpdateError } = await supabase
            .from('orders')
            .update({ payment_status: 'completed', status: 'confirmed', updated_at: new Date().toISOString() })
            .eq('id', orderId);
          if (fallbackUpdateError) throw fallbackUpdateError;
        }
        await upsertCart(supabase, userId, []);
        return json({ verified: true, message: 'Mock payment verified successfully', order: orderRow ? mapOrder(orderRow) : null });
      }

      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        await supabase
          .from('orders')
          .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', orderId);
        return json({ error: 'Payment verification failed' }, { status: 400 });
      }

      const { data: orderRow, error: updateError } = await supabase
        .from('orders')
        .update(verifyUpdatePayload)
        .eq('id', orderId)
        .select('*')
        .single();
      if (updateError && !isMissingColumnError(updateError)) throw updateError;

      if (updateError && isMissingColumnError(updateError)) {
        const { error: fallbackUpdateError } = await supabase
          .from('orders')
          .update({ payment_status: 'completed', status: 'confirmed', updated_at: new Date().toISOString() })
          .eq('id', orderId);
        if (fallbackUpdateError) throw fallbackUpdateError;
      }

      await upsertCart(supabase, userId, []);

      return json({ verified: true, message: 'Payment verified successfully', order: orderRow ? mapOrder(orderRow) : null });
    }

    if (segments[0] === 'admin' && segments[1] === 'products') {
      const { name, category, type, price } = body;
      if (!name || !category || !type || !price) {
        return json({ error: 'Missing required fields' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          name,
          category,
          type,
          price: Number.parseInt(price, 10),
          images: Array.isArray(body.images) ? body.images : [],
          stock: Number.parseInt(body.stock, 10) || 0,
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single();
      if (error) throw error;
      return json({
        product: {
          ...mapProduct(data),
          originalPrice: Number.parseInt(body.originalPrice, 10) || Number.parseInt(price, 10),
          sizes: Array.isArray(body.sizes) && body.sizes.length > 0 ? body.sizes : ['S', 'M', 'L', 'XL'],
          description: body.description || 'Premium everyday essential.',
          featured: body.featured ?? true,
        },
      });
    }

    if (segments[0] === 'admin' && segments[1] === 'settings') {
      const current = await getSettingsRecord(supabase);
      const nextSupabase = body.supabase
        ? {
            url: body.supabase.url || '',
            anonKey: isMaskedSecret(body.supabase.anonKey) ? current.supabase?.anonKey || '' : body.supabase.anonKey || '',
            serviceRoleKey: isMaskedSecret(body.supabase.serviceRoleKey) ? current.supabase?.serviceRoleKey || '' : body.supabase.serviceRoleKey || '',
            configured: Boolean(body.supabase.url && (isMaskedSecret(body.supabase.anonKey) ? current.supabase?.anonKey : body.supabase.anonKey)),
          }
        : current.supabase;
      const nextRazorpay = body.razorpay
        ? {
            keyId: body.razorpay.keyId || '',
            keySecret: isMaskedSecret(body.razorpay.keySecret) ? current.razorpay?.keySecret || '' : body.razorpay.keySecret || '',
            configured: Boolean(body.razorpay.keyId && (isMaskedSecret(body.razorpay.keySecret) ? current.razorpay?.keySecret : body.razorpay.keySecret)),
            mode: body.razorpay.mode || 'test',
          }
        : current.razorpay;
      const nextPayment = body.payment
        ? {
            mode: body.payment.mode || 'mock',
            codEnabled: body.payment.codEnabled !== false,
            razorpayEnabled: Boolean(body.payment.razorpayEnabled),
          }
        : current.payment;
      const nextStore = body.store
        ? {
            name: body.store.name || 'SevenGhost',
            currency: body.store.currency || 'INR',
            freeShippingThreshold: Number.parseInt(body.store.freeShippingThreshold, 10) || 999,
          }
        : current.store;
      const nextCms = body.cms
        ? {
            ...current.cms,
            ...body.cms,
          }
        : current.cms;
      const settingsPayload = {
        id: 'app_settings',
        supabase: nextSupabase,
        razorpay: nextRazorpay,
        payment: nextPayment,
        store: nextStore,
        cms: nextCms,
        updated_at: new Date().toISOString(),
      };

      let { error } = await supabase.from('settings').upsert(settingsPayload, { onConflict: 'id' });
      if (error && isMissingColumnError(error) && /cms/i.test(String(error.message || ''))) {
        ({ error } = await supabase.from('settings').upsert(
          {
            ...settingsPayload,
            store: {
              ...nextStore,
              _cms: nextCms,
            },
          },
          { onConflict: 'id' }
        ));
      }
      if (error) throw error;
      return json({ success: true, message: 'Settings updated' });
    }

    if (segments[0] === 'wishlist' && segments[1] === 'toggle') {
      const { userId, productId } = body;
      if (!userId || !productId) {
        return json({ error: 'userId and productId required' }, { status: 400 });
      }

      const wishlist = await fetchWishlistRecord(supabase, userId);
      const items = wishlist.items.includes(productId)
        ? wishlist.items.filter((itemId) => itemId !== productId)
        : [...wishlist.items, productId];
      return json({ wishlist: await upsertWishlist(supabase, userId, items) });
    }

    return json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('POST Error:', error);
    return json({ error: enrichSupabaseError(error) }, { status: 500 });
  }
}

export async function PUT(request) {
  const segments = getPathSegments(request);
  const body = await request.json();
  const { client: supabase } = getClientOrFallback(segments);

  if (!supabase) {
    return json({ error: 'Supabase environment variables are missing' }, { status: 500 });
  }

  try {
    if (segments[0] === 'admin' && segments[1] === 'products' && segments.length === 3) {
      const { data, error } = await supabase
        .from('products')
        .update({
          name: body.name,
          category: body.category,
          type: body.type,
          price: Number.parseInt(body.price, 10),
          images: Array.isArray(body.images) ? body.images : [],
          stock: Number.parseInt(body.stock, 10) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', segments[2])
        .select('*')
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: 'Product not found' }, { status: 404 });
      return json({
        product: {
          ...mapProduct(data),
          originalPrice: Number.parseInt(body.originalPrice, 10) || Number.parseInt(body.price, 10),
          sizes: Array.isArray(body.sizes) && body.sizes.length > 0 ? body.sizes : ['S', 'M', 'L', 'XL'],
          description: body.description || 'Premium everyday essential.',
          featured: body.featured ?? true,
        },
      });
    }

    if (segments[0] === 'admin' && segments[1] === 'orders' && segments.length === 3) {
      const payload = { updated_at: new Date().toISOString() };
      if (body.status) payload.status = body.status;
      const { data, error } = await supabase.from('orders').update(payload).eq('id', segments[2]).select('*').maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: 'Order not found' }, { status: 404 });
      return json({ order: mapOrder(data) });
    }

    if (segments[0] === 'cart' && segments[1] === 'update') {
      const { userId, itemId, quantity } = body;
      if (!userId || !itemId || quantity === undefined) {
        return json({ error: 'userId, itemId, and quantity required' }, { status: 400 });
      }

      const cart = await fetchCartRecord(supabase, userId);
      if (!cart.items.some((item) => item.id === itemId)) {
        return json({ error: 'Cart item not found' }, { status: 404 });
      }
      const items = cart.items
        .map((item) => (item.id === itemId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0);
      return json({ cart: await upsertCart(supabase, userId, items) });
    }

    return json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('PUT Error:', error);
    return json({ error: enrichSupabaseError(error) }, { status: 500 });
  }
}

export async function DELETE(request) {
  const segments = getPathSegments(request);
  const { client: supabase } = getClientOrFallback(segments);

  if (!supabase) {
    return json({ error: 'Supabase environment variables are missing' }, { status: 500 });
  }

  try {
    if (segments[0] === 'admin' && segments[1] === 'products' && segments.length === 3) {
      const { error } = await supabase.from('products').delete().eq('id', segments[2]);
      if (error) throw error;
      return json({ message: 'Product deleted successfully' });
    }

    return json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('DELETE Error:', error);
    return json({ error: enrichSupabaseError(error) }, { status: 500 });
  }
}
