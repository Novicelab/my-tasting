import type { TastingNote } from '../types';
import RatingStars from './RatingStars';

interface NoteCardProps {
  note: TastingNote;
  onClick?: () => void;
}

export default function NoteCard({ note, onClick }: NoteCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-900 rounded-2xl p-4 cursor-pointer hover:bg-gray-800 transition-colors border border-gray-800"
    >
      <div className="flex gap-3">
        {note.photo_urls?.[0] && (
          <img
            src={note.photo_urls[0]}
            alt="테이스팅 사진"
            className="w-16 h-20 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">
            {note.liquor?.name || '주류'}
          </h3>
          {note.rating !== null && (
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
