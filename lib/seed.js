import { v4 as uuidv4 } from 'uuid';

export const sampleProducts = [
  // Plain T-Shirts - Men
  {
    id: uuidv4(),
    name: 'Essential Black Tee',
    category: 'men',
    type: 'plain',
    price: 1499,
    originalPrice: 1999,
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 50,
    description: 'Premium cotton essential tee in classic black. Soft, breathable, and perfect for everyday wear.',
    featured: true
  },
  {
    id: uuidv4(),
    name: 'Pure White Classic',
    category: 'men',
    type: 'plain',
    price: 1299,
    originalPrice: 1799,
    images: ['https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=800'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 45,
    description: 'Crisp white tee crafted from 100% organic cotton. Timeless and versatile.',
    featured: true
  },
  {
    id: uuidv4(),
    name: 'Stone Grey Minimal',
    category: 'men',
    type: 'plain',
    price: 1399,
    originalPrice: 1899,
    images: ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 35,
    description: 'Elegant stone grey tee with a relaxed fit. Premium comfort meets understated style.',
    featured: false
  },
  // Printed T-Shirts - Men
  {
    id: uuidv4(),
    name: 'Urban Abstract Print',
    category: 'men',
    type: 'printed',
    price: 1799,
    originalPrice: 2299,
    images: ['https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 30,
    description: 'Bold abstract print on premium cotton. Make a statement with modern art.',
    featured: true
  },
  {
    id: uuidv4(),
    name: 'Minimalist Logo Tee',
    category: 'men',
    type: 'printed',
    price: 1599,
    originalPrice: 2099,
    images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 40,
    description: 'Subtle logo placement on chest. Clean design for the modern minimalist.',
    featured: false
  },
  // Polo T-Shirts - Men
  {
    id: uuidv4(),
    name: 'Classic Navy Polo',
    category: 'men',
    type: 'polo',
    price: 2299,
    originalPrice: 2999,
    images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 25,
    description: 'Sophisticated navy polo with premium piqué fabric. Perfect for smart-casual occasions.',
    featured: true
  },
  {
    id: uuidv4(),
    name: 'Midnight Black Polo',
    category: 'men',
    type: 'polo',
    price: 2199,
    originalPrice: 2799,
    images: ['https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 30,
    description: 'Sleek black polo with subtle collar detail. Elevate your everyday look.',
    featured: false
  },
  // Plain T-Shirts - Women
  {
    id: uuidv4(),
    name: 'Soft Blush Essential',
    category: 'women',
    type: 'plain',
    price: 1399,
    originalPrice: 1899,
    images: ['https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: 40,
    description: 'Delicate blush pink tee with a flattering fit. Soft touch cotton blend.',
    featured: true
  },
  {
    id: uuidv4(),
    name: 'Ivory Relaxed Fit',
    category: 'women',
    type: 'plain',
    price: 1299,
    originalPrice: 1699,
    images: ['https://images.unsplash.com/photo-1611042553484-d61f84d22784?w=800'],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 35,
    description: 'Elegant ivory tee with relaxed silhouette. Effortless style for any occasion.',
    featured: false
  },
  // Printed T-Shirts - Women
  {
    id: uuidv4(),
    name: 'Botanical Print Tee',
    category: 'women',
    type: 'printed',
    price: 1699,
    originalPrice: 2199,
    images: ['https://images.unsplash.com/photo-1588117260148-b47818741c74?w=800'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: 30,
    description: 'Artistic botanical print on lightweight cotton. Nature-inspired elegance.',
    featured: true
  },
  {
    id: uuidv4(),
    name: 'Abstract Art Crop',
    category: 'women',
    type: 'printed',
    price: 1599,
    originalPrice: 2099,
    images: ['https://images.unsplash.com/photo-1627577279497-4b24bf1021b6?w=800'],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 25,
    description: 'Modern abstract design on a flattering crop cut. Express your artistic side.',
    featured: false
  },
  // Polo T-Shirts - Women
  {
    id: uuidv4(),
    name: 'Classic White Polo',
    category: 'women',
    type: 'polo',
    price: 2099,
    originalPrice: 2699,
    images: ['https://images.unsplash.com/photo-1499713907394-43c9d094ac2e?w=800'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: 30,
    description: 'Timeless white polo with feminine silhouette. Premium piqué cotton.',
    featured: true
  }
];

export const sampleCategories = [
  { id: 'plain', name: 'Plain T-Shirts', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600' },
  { id: 'printed', name: 'Printed T-Shirts', image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600' },
  { id: 'polo', name: 'Polo T-Shirts', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600' }
];
