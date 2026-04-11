import { StorefrontApp } from '@/app/page';

export const metadata = {
  title: 'Product | SevenGhost',
  description: 'View product details from the SevenGhost collection.',
};

export default function ProductRoutePage({ params }) {
  return <StorefrontApp initialPage={{ page: 'product', id: params.id }} />;
}
