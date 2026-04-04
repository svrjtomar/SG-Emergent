import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { sampleProducts } from '@/lib/seed';
import { v4 as uuidv4 } from 'uuid';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Helper to get path segments
function getPathSegments(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');
  return path.split('/').filter(Boolean);
}

// ============== GET HANDLERS ==============
export async function GET(request) {
  try {
    const segments = getPathSegments(request);
    const url = new URL(request.url);

    // Health check
    if (segments.length === 0 || segments[0] === 'health') {
      return NextResponse.json({ status: 'SevenGhost API is running', timestamp: new Date().toISOString() }, { headers: corsHeaders });
    }

    const { db } = await connectToDatabase();

    // GET /api/products - List all products with filters
    if (segments[0] === 'products' && segments.length === 1) {
      const category = url.searchParams.get('category');
      const type = url.searchParams.get('type');
      const search = url.searchParams.get('search');
      const featured = url.searchParams.get('featured');
      const minPrice = url.searchParams.get('minPrice');
      const maxPrice = url.searchParams.get('maxPrice');

      let query = {};
      if (category) query.category = category;
      if (type) query.type = type;
      if (featured === 'true') query.featured = true;
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseInt(minPrice);
        if (maxPrice) query.price.$lte = parseInt(maxPrice);
      }

      const products = await db.collection('products').find(query).toArray();
      return NextResponse.json({ products }, { headers: corsHeaders });
    }

    // GET /api/products/:id - Get single product
    if (segments[0] === 'products' && segments.length === 2) {
      const productId = segments[1];
      const product = await db.collection('products').findOne({ id: productId });
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
      }
      return NextResponse.json({ product }, { headers: corsHeaders });
    }

    // GET /api/cart/:userId - Get user's cart
    if (segments[0] === 'cart' && segments.length === 2) {
      const userId = segments[1];
      const cart = await db.collection('carts').findOne({ userId });
      return NextResponse.json({ cart: cart || { userId, items: [], total: 0 } }, { headers: corsHeaders });
    }

    // GET /api/orders/:userId - Get user's orders
    if (segments[0] === 'orders' && segments.length === 2) {
      const userId = segments[1];
      const orders = await db.collection('orders').find({ userId }).sort({ createdAt: -1 }).toArray();
      return NextResponse.json({ orders }, { headers: corsHeaders });
    }

    // GET /api/admin/orders - Get all orders (admin)
    if (segments[0] === 'admin' && segments[1] === 'orders') {
      const orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).toArray();
      return NextResponse.json({ orders }, { headers: corsHeaders });
    }

    // GET /api/admin/stats - Get dashboard stats
    if (segments[0] === 'admin' && segments[1] === 'stats') {
      const totalOrders = await db.collection('orders').countDocuments();
      const totalProducts = await db.collection('products').countDocuments();
      const orders = await db.collection('orders').find({}).toArray();
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      const pendingOrders = await db.collection('orders').countDocuments({ status: 'pending' });
      
      return NextResponse.json({
        stats: {
          totalOrders,
          totalProducts,
          totalRevenue,
          pendingOrders
        }
      }, { headers: corsHeaders });
    }

    // GET /api/wishlist/:userId - Get user's wishlist
    if (segments[0] === 'wishlist' && segments.length === 2) {
      const userId = segments[1];
      const wishlist = await db.collection('wishlists').findOne({ userId });
      return NextResponse.json({ wishlist: wishlist || { userId, items: [] } }, { headers: corsHeaders });
    }

    // GET /api/seed - Seed database with sample products
    if (segments[0] === 'seed') {
      const existingProducts = await db.collection('products').countDocuments();
      if (existingProducts === 0) {
        await db.collection('products').insertMany(sampleProducts);
        return NextResponse.json({ message: 'Database seeded with sample products', count: sampleProducts.length }, { headers: corsHeaders });
      }
      return NextResponse.json({ message: 'Database already has products', count: existingProducts }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// ============== POST HANDLERS ==============
export async function POST(request) {
  try {
    const segments = getPathSegments(request);
    const body = await request.json();
    const { db } = await connectToDatabase();

    // POST /api/auth/login - Mock login
    if (segments[0] === 'auth' && segments[1] === 'login') {
      const { email, password } = body;
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400, headers: corsHeaders });
      }
      
      let user = await db.collection('users').findOne({ email });
      if (!user) {
        // Create new user (mock signup)
        user = {
          id: uuidv4(),
          email,
          name: email.split('@')[0],
          role: email === 'admin@sevenghost.com' ? 'admin' : 'user',
          createdAt: new Date().toISOString()
        };
        await db.collection('users').insertOne(user);
      }
      
      return NextResponse.json({ user, token: 'mock-jwt-token-' + user.id }, { headers: corsHeaders });
    }

    // POST /api/cart/add - Add item to cart
    if (segments[0] === 'cart' && segments[1] === 'add') {
      const { userId, productId, size, quantity = 1 } = body;
      if (!userId || !productId || !size) {
        return NextResponse.json({ error: 'userId, productId, and size required' }, { status: 400, headers: corsHeaders });
      }

      const product = await db.collection('products').findOne({ id: productId });
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
      }

      let cart = await db.collection('carts').findOne({ userId });
      if (!cart) {
        cart = { userId, items: [], total: 0 };
      }

      const existingItemIndex = cart.items.findIndex(item => item.productId === productId && item.size === size);
      if (existingItemIndex >= 0) {
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        cart.items.push({
          id: uuidv4(),
          productId,
          name: product.name,
          price: product.price,
          image: product.images[0],
          size,
          quantity
        });
      }

      cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      await db.collection('carts').updateOne(
        { userId },
        { $set: cart },
        { upsert: true }
      );

      return NextResponse.json({ cart }, { headers: corsHeaders });
    }

    // POST /api/cart/remove - Remove item from cart
    if (segments[0] === 'cart' && segments[1] === 'remove') {
      const { userId, itemId } = body;
      if (!userId || !itemId) {
        return NextResponse.json({ error: 'userId and itemId required' }, { status: 400, headers: corsHeaders });
      }

      let cart = await db.collection('carts').findOne({ userId });
      if (!cart) {
        return NextResponse.json({ error: 'Cart not found' }, { status: 404, headers: corsHeaders });
      }

      cart.items = cart.items.filter(item => item.id !== itemId);
      cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      await db.collection('carts').updateOne({ userId }, { $set: cart });
      return NextResponse.json({ cart }, { headers: corsHeaders });
    }

    // POST /api/orders/create - Create order
    if (segments[0] === 'orders' && segments[1] === 'create') {
      const { userId, items, address, paymentMethod, total } = body;
      if (!userId || !items || !address || !paymentMethod) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders });
      }

      const order = {
        id: uuidv4(),
        userId,
        items,
        address,
        paymentMethod,
        total,
        status: paymentMethod === 'cod' ? 'confirmed' : 'pending',
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed',
        createdAt: new Date().toISOString()
      };

      await db.collection('orders').insertOne(order);
      
      // Clear cart after order
      await db.collection('carts').updateOne(
        { userId },
        { $set: { items: [], total: 0 } }
      );

      return NextResponse.json({ order }, { headers: corsHeaders });
    }

    // POST /api/payment/create - Mock Razorpay order
    if (segments[0] === 'payment' && segments[1] === 'create') {
      const { amount, currency = 'INR' } = body;
      if (!amount) {
        return NextResponse.json({ error: 'Amount required' }, { status: 400, headers: corsHeaders });
      }

      // Mock Razorpay order response
      const razorpayOrder = {
        id: 'order_' + uuidv4().substring(0, 14),
        amount: amount * 100, // Razorpay uses paise
        currency,
        status: 'created',
        created_at: Date.now()
      };

      return NextResponse.json({ order: razorpayOrder }, { headers: corsHeaders });
    }

    // POST /api/payment/verify - Mock payment verification
    if (segments[0] === 'payment' && segments[1] === 'verify') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      
      // Mock verification (always succeeds in mock mode)
      return NextResponse.json({ 
        verified: true, 
        message: 'Payment verified successfully (MOCK MODE)' 
      }, { headers: corsHeaders });
    }

    // POST /api/admin/products - Add product (admin)
    if (segments[0] === 'admin' && segments[1] === 'products') {
      const { name, category, type, price, originalPrice, images, sizes, stock, description } = body;
      if (!name || !category || !type || !price) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders });
      }

      const product = {
        id: uuidv4(),
        name,
        category,
        type,
        price,
        originalPrice: originalPrice || price,
        images: images || [],
        sizes: sizes || ['S', 'M', 'L', 'XL'],
        stock: stock || 0,
        description: description || '',
        featured: false,
        createdAt: new Date().toISOString()
      };

      await db.collection('products').insertOne(product);
      return NextResponse.json({ product }, { headers: corsHeaders });
    }

    // POST /api/wishlist/toggle - Toggle wishlist item
    if (segments[0] === 'wishlist' && segments[1] === 'toggle') {
      const { userId, productId } = body;
      if (!userId || !productId) {
        return NextResponse.json({ error: 'userId and productId required' }, { status: 400, headers: corsHeaders });
      }

      let wishlist = await db.collection('wishlists').findOne({ userId });
      if (!wishlist) {
        wishlist = { userId, items: [] };
      }

      const existingIndex = wishlist.items.findIndex(id => id === productId);
      if (existingIndex >= 0) {
        wishlist.items.splice(existingIndex, 1);
      } else {
        wishlist.items.push(productId);
      }

      await db.collection('wishlists').updateOne(
        { userId },
        { $set: wishlist },
        { upsert: true }
      );

      return NextResponse.json({ wishlist }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// ============== PUT HANDLERS ==============
export async function PUT(request) {
  try {
    const segments = getPathSegments(request);
    const body = await request.json();
    const { db } = await connectToDatabase();

    // PUT /api/admin/products/:id - Update product
    if (segments[0] === 'admin' && segments[1] === 'products' && segments.length === 3) {
      const productId = segments[2];
      const updateData = { ...body };
      delete updateData.id;
      delete updateData._id;

      const result = await db.collection('products').updateOne(
        { id: productId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
      }

      const product = await db.collection('products').findOne({ id: productId });
      return NextResponse.json({ product }, { headers: corsHeaders });
    }

    // PUT /api/admin/orders/:id - Update order status
    if (segments[0] === 'admin' && segments[1] === 'orders' && segments.length === 3) {
      const orderId = segments[2];
      const { status, paymentStatus } = body;

      const updateData = {};
      if (status) updateData.status = status;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;

      const result = await db.collection('orders').updateOne(
        { id: orderId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: corsHeaders });
      }

      const order = await db.collection('orders').findOne({ id: orderId });
      return NextResponse.json({ order }, { headers: corsHeaders });
    }

    // PUT /api/cart/update - Update cart item quantity
    if (segments[0] === 'cart' && segments[1] === 'update') {
      const { userId, itemId, quantity } = body;
      if (!userId || !itemId || quantity === undefined) {
        return NextResponse.json({ error: 'userId, itemId, and quantity required' }, { status: 400, headers: corsHeaders });
      }

      let cart = await db.collection('carts').findOne({ userId });
      if (!cart) {
        return NextResponse.json({ error: 'Cart not found' }, { status: 404, headers: corsHeaders });
      }

      const itemIndex = cart.items.findIndex(item => item.id === itemId);
      if (itemIndex >= 0) {
        if (quantity <= 0) {
          cart.items.splice(itemIndex, 1);
        } else {
          cart.items[itemIndex].quantity = quantity;
        }
      }

      cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      await db.collection('carts').updateOne({ userId }, { $set: cart });
      return NextResponse.json({ cart }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// ============== DELETE HANDLERS ==============
export async function DELETE(request) {
  try {
    const segments = getPathSegments(request);
    const { db } = await connectToDatabase();

    // DELETE /api/admin/products/:id - Delete product
    if (segments[0] === 'admin' && segments[1] === 'products' && segments.length === 3) {
      const productId = segments[2];
      const result = await db.collection('products').deleteOne({ id: productId });

      if (result.deletedCount === 0) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
      }

      return NextResponse.json({ message: 'Product deleted successfully' }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
