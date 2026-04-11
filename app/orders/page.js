import { StorefrontApp } from '@/app/page';

export const metadata = {
  title: 'My Orders | SevenGhost',
  description: 'Track and review your SevenGhost orders.',
};

export default function OrdersRoutePage() {
  return <StorefrontApp initialPage="orders" />;
}
