import { useState } from 'react';
import type { TastingNote } from '../types';
import RatingStars from './RatingStars';
import CategoryBadge from './CategoryBadge';

interface NoteCardProps {
  note: TastingNote;
  onClick?: () => void;
}

export default function NoteCard({ note, onClick }: NoteCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onClick={onClick}
      className="bg-gray-900 rounded-2xl p-4 cursor-pointer hover:bg-gray-800 active:bg-gray-800/80 transition-all border border-gray-800"
    >
      <div className="flex gap-3">
        {note.photo_urls?.[0] && !imgError && (
          <img
            src={note.photo_urls[0]}
            alt="테이스팅 사진"
            className="w-16 h-20 object-cover rounded-lg flex-shrink-0 bg-gray-800"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
        {(imgError || !note.photo_urls?.[0]) && (
          <div className="w-16 h-20 rounded-lg flex-shrink-0 bg-gray-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-white truncate">
              {note.liquor?.name || '주류'}
            </h3>
            <CategoryBadge category={note.liquor?.category} />
          </div>
          {note.rating !== null && note.rating > 0 && (
            <div className="mt-1">
              <RatingStars rating={note.rating} size="sm" readonly />
            </div>
          )}
          <div className="mt-1 flex flex-wrap gap-1">
            {note.aroma?.slice(0, 3).map((a) => (
              <span key={a} className="text-xs bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded">
                {a}
              </span>
            ))}
            {note.taste?.slice(0, 3).map((t) => (
              <span key={t} className="text-xs bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <span>{note.tasting_date}</span>
            {note.location && <span>{note.location}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
