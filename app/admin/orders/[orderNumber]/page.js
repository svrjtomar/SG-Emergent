import { StorefrontApp } from '@/app/page';

export function generateMetadata({ params }) {
  return {
    title: `Order ${params.orderNumber} | SevenGhost Admin`,
    description: `Admin details for order ${params.orderNumber}.`,
  };
}

export default function AdminOrderRoutePage({ params }) {
  return <StorefrontApp initialPage={{ page: 'admin', tab: 'orders', orderNumber: params.orderNumber }} />;
}
