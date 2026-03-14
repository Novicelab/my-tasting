const CATEGORY_MAP: Record<string, { label: string; bg: string; text: string; border: string }> = {
  sake: { label: '사케', bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/40' },
  wine: { label: '와인', bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40' },
  traditional_korean: { label: '전통주', bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/40' },
  whisky: { label: '증류주', bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/40' },
  spirits: { label: '증류주', bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/40' },
};

const DEFAULT_STYLE = { label: '기타', bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/40' };

interface CategoryBadgeProps {
  category: string | undefined | null;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ category, size = 'sm' }: CategoryBadgeProps) {
  if (!category) return null;

  const style = CATEGORY_MAP[category] || DEFAULT_STYLE;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span className={`inline-block rounded-full border font-medium ${sizeClass} ${style.bg} ${style.text} ${style.border}`}>
      {style.label}
    </span>
  );
}
