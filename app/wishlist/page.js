import { StorefrontApp } from '@/app/page';

export const metadata = {
  title: 'Wishlist | SevenGhost',
  description: 'Your saved products at SevenGhost.',
};

export default function WishlistRoutePage() {
  return <StorefrontApp initialPage="wishlist" />;
}
