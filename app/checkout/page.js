import { StorefrontApp } from '@/app/page';

export const metadata = {
  title: 'Checkout | SevenGhost',
  description: 'Complete your SevenGhost order.',
};

export default function CheckoutRoutePage() {
  return <StorefrontApp initialPage="checkout" />;
}
