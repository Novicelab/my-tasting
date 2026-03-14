import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { TastingNote } from '../types';
import RatingStars from '../components/RatingStars';

interface ComparisonSectionProps {
  label: string;
  aiOptions: string[];
  userPicks: string[];
  colorClass: string;
  accentBorder: string;
}

function ComparisonSection({ label, aiOptions, userPicks, colorClass, accentBorder }: ComparisonSectionProps) {
  if (!aiOptions?.length && !userPicks?.length) return null;

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      {/* AI 대중 의견 */}
      <div className="px-4 pt-4 pb-3">
        <h3 className="text-sm font-semibold text-gray-300 mb-1">{label}</h3>
        <p className="text-xs text-gray-500 mb-2.5">AI가 분석한 대중 의견</p>
        <div className="flex flex-wrap gap-1.5">
          {aiOptions?.map((item) => (
            <span
              key={item}
              className={`text-xs px-2.5 py-1 rounded-full ${colorClass} ${accentBorder} border`}
            >
              {item}
            </span>
          ))}
          {!aiOptions?.length && (
            <p className="text-xs text-gray-600 italic">정보 없음</p>
          )}
        </div>
      </div>

      <hr className="border-gray-700/60" />

      {/* 내 의견 */}
      <div className="bg-gray-800/30 px-4 pt-3 pb-4">
        <p className="text-xs text-violet-400 mb-2.5">내가 선택한 의견</p>
        <div className="flex flex-wrap gap-1.5">
          {userPicks?.length ? (
            userPicks.map((item) => (
              <span
                key={item}
                className={`text-xs px-2.5 py-1 rounded-full ${colorClass} ${accentBorder} border`}
              >
                {item}
              </span>
            ))
          ) : (
            <p className="text-xs text-gray-600 italic">선택한 항목 없음</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<TastingNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadNote();
  }, [id]);

  const loadNote = async () => {
    const { data, error } = await supabase
      .from('tasting_notes')
      .select('*, liquor:liquors(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      navigate('/collection');
      return;
    }
    setNote(data as TastingNote);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('이 노트를 삭제하시겠습니까?')) return;
    setDeleting(true);
    const { error } = await supabase.from('tasting_notes').delete().eq('id', id);
    if (!error) navigate('/collection');
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!note) return null;

  const liquor = note.liquor;

  return (
    <div className="space-y-4 pb-6">
      {/* Header with Back + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/collection')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">테이스팅 노트</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/note/${id}/edit`, { state: { liquor } })}
            className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            삭제
          </button>
        </div>
      </div>

      {/* Photo */}
      {note.photo_urls?.[0] && (
        <img
          src={note.photo_urls[0]}
          alt="테이스팅 사진"
          className="w-full rounded-2xl max-h-64 object-cover"
        />
      )}

      {/* Liquor Info */}
      {liquor && (
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <h2 className="font-semibold text-white text-lg">{liquor.name}</h2>
          {liquor.name_original && (
            <p className="text-sm text-gray-500">{liquor.name_original}</p>
          )}
          <div className="mt-1 flex gap-2 text-sm text-gray-400">
            {liquor.country && <span>{liquor.country}</span>}
            {liquor.vintage && <span>{liquor.vintage}</span>}
            {liquor.abv && <span>{liquor.abv}%</span>}
          </div>
        </div>
      )}

      {/* Rating Comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 rounded-2xl p-3 border border-gray-800">
          <p className="text-xs text-gray-500 mb-2 text-center">대중 평점</p>
          <div className="flex justify-center">
            {liquor?.avg_rating ? (
              <RatingStars rating={liquor.avg_rating} size="sm" readonly />
            ) : (
              <p className="text-gray-600 text-sm">-</p>
            )}
          </div>
        </div>
        <div className="bg-gray-900 rounded-2xl p-3 border border-violet-500/30">
          <p className="text-xs text-violet-400 mb-2 text-center">내 평점</p>
          <div className="flex justify-center">
            {note.rating ? (
              <RatingStars rating={note.rating} size="sm" readonly />
            ) : (
              <p className="text-gray-600 text-sm">-</p>
            )}
          </div>
        </div>
      </div>

      {/* Sensory Comparisons */}
      <ComparisonSection
        label="향 (Aroma)"
        aiOptions={liquor?.aroma_options || []}
        userPicks={note.aroma || []}
        colorClass="bg-pink-500/30 text-pink-300"
        accentBorder="border-pink-500/40"
      />
      <ComparisonSection
        label="맛 (Taste)"
        aiOptions={liquor?.taste_options || []}
        userPicks={note.taste || []}
        colorClass="bg-amber-500/30 text-amber-300"
        accentBorder="border-amber-500/40"
      />
      <ComparisonSection
        label="여운 (Finish)"
        aiOptions={liquor?.finish_options || []}
        userPicks={note.finish || []}
        colorClass="bg-emerald-500/30 text-emerald-300"
        accentBorder="border-emerald-500/40"
      />
      <ComparisonSection
        label="음식 페어링"
        aiOptions={liquor?.food_pairing_options || []}
        userPicks={note.food_pairing || []}
        colorClass="bg-blue-500/30 text-blue-300"
        accentBorder="border-blue-500/40"
      />

      {/* Overall Notes Comparison */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {liquor?.overall_review && (
          <>
            <div className="px-4 pt-4 pb-3">
              <h3 className="text-sm font-semibold text-gray-300 mb-1">종합 후기</h3>
              <p className="text-xs text-gray-500 mb-2">대중 종합 후기</p>
              <p className="text-sm text-gray-400 leading-relaxed">{liquor.overall_review}</p>
            </div>
            <hr className="border-gray-700/60" />
          </>
        )}
        <div className={`bg-gray-800/30 px-4 pt-3 pb-4 ${!liquor?.overall_review ? 'rounded-2xl' : ''}`}>
          {!liquor?.overall_review && (
            <h3 className="text-sm font-semibold text-gray-300 mb-1">종합 후기</h3>
          )}
          <p className="text-xs text-violet-400 mb-2">내 종합 후기</p>
          {note.overall_notes ? (
            <p className="text-sm text-gray-300 leading-relaxed">{note.overall_notes}</p>
          ) : (
            <p className="text-xs text-gray-600 italic">작성한 후기 없음</p>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 text-sm text-gray-400 space-y-1.5">
        <div className="flex justify-between">
          <span>테이스팅 날짜</span>
          <span className="text-gray-300">{note.tasting_date}</span>
        </div>
        {note.location && (
          <div className="flex justify-between">
            <span>장소</span>
            <span className="text-gray-300">{note.location}</span>
          </div>
        )}
        {note.purchase_price != null && note.purchase_price > 0 && (
          <div className="flex justify-between">
            <span>구매가</span>
            <span className="text-gray-300">{note.purchase_price.toLocaleString()}원</span>
          </div>
        )}
      </div>
    </div>
  );
}
