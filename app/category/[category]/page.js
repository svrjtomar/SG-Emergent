import { StorefrontApp } from '@/app/page';

export function generateMetadata({ params }) {
  const category = params.category;
  const label = category.charAt(0).toUpperCase() + category.slice(1);

  return {
    title: `${label} Collection | SevenGhost`,
    description: `Explore SevenGhost ${label.toLowerCase()} styles.`,
  };
}

export default function CategoryRoutePage({ params }) {
  return <StorefrontApp initialPage={{ page: 'shop', filter: { category: params.category } }} />;
}
