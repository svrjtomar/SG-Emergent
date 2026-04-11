import { StorefrontApp } from '@/app/page';

export const metadata = {
  title: 'Shop | SevenGhost',
  description: 'Browse the full SevenGhost collection.',
};

export default function ShopRoutePage() {
  return <StorefrontApp initialPage="shop" />;
}
