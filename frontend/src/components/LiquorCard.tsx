import type { Liquor } from '../types';
import RatingStars from './RatingStars';

interface LiquorCardProps {
  liquor: Liquor;
  onClick?: () => void;
}

const categoryLabel: Record<string, string> = {
  wine: '와인',
  sake: '사케',
  traditional_korean: '전통주',
  whisky: '위스키',
  beer: '맥주',
  spirits: '증류주',
};

export default function LiquorCard({ liquor, onClick }: LiquorCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-900 rounded-2xl p-4 cursor-pointer hover:bg-gray-800 transition-colors border border-gray-800"
    >
      <div className="flex gap-3">
        {liquor.image_url && (
          <img
            src={liquor.image_url}
            alt={liquor.name}
            className="w-16 h-20 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-white truncate">{liquor.name}</h3>
              {liquor.name_original && (
                <p className="text-sm text-gray-500 truncate">{liquor.name_original}</p>
              )}
            </div>
            <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full whitespace-nowrap">
              {categoryLabel[liquor.category] || liquor.category}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
            {liquor.country && <span>{liquor.country}</span>}
            {liquor.vintage && <span>{liquor.vintage}년</span>}
            {liquor.abv && <span>{liquor.abv}%</span>}
          </div>
          {liquor.avg_rating && (
            <div className="mt-1">
              <RatingStars rating={liquor.avg_rating} size="sm" readonly />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
