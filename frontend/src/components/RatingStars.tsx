import { useId } from 'react';

interface RatingStarsProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

export default function RatingStars({ rating, onChange, size = 'md', readonly = false }: RatingStarsProps) {
  const instanceId = useId();
  const gradientId = `half-${instanceId}`;
  const sizeClass = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size];

  const handleClick = (value: number) => {
    if (readonly || !onChange) return;
    // If clicking the same star, allow half-star toggle
    onChange(rating === value ? value - 0.5 : value);
  };

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half = !filled && rating >= star - 0.5;

        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => handleClick(star)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          >
            <svg className={sizeClass} viewBox="0 0 24 24" fill="none">
              {/* Background star */}
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={filled ? '#a78bfa' : half ? `url(#${gradientId})` : '#374151'}
                stroke={filled || half ? '#a78bfa' : '#4b5563'}
                strokeWidth="1"
              />
              {half && (
                <defs>
                  <linearGradient id={gradientId}>
                    <stop offset="50%" stopColor="#a78bfa" />
                    <stop offset="50%" stopColor="#374151" />
                  </linearGradient>
                </defs>
              )}
            </svg>
          </button>
        );
      })}
      <span className="ml-2 text-gray-400 text-sm self-center">{rating.toFixed(1)}</span>
    </div>
  );
}
