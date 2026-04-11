import { StorefrontApp } from '@/app/page';

export function generateMetadata({ params }) {
  const segment = params.segment;
  const label = segment.charAt(0).toUpperCase() + segment.slice(1);

  return {
    title: `${label} T-Shirts | SevenGhost`,
    description: `Shop ${label.toLowerCase()} styles from SevenGhost.`,
  };
}

export default function SegmentRoutePage({ params }) {
  return <StorefrontApp initialPage={{ page: 'shop', filter: { type: params.segment } }} />;
}
