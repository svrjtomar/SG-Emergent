import { StorefrontApp } from '@/app/page';

export const metadata = {
  title: 'Admin | SevenGhost',
  description: 'SevenGhost admin dashboard.',
};

export default function AdminRoutePage() {
  return <StorefrontApp initialPage={{ page: 'admin', tab: 'dashboard' }} />;
}
