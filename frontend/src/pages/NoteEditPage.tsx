import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Liquor, TastingNote } from '../types';
import RatingStars from '../components/RatingStars';

interface CheckboxGroupProps {
  label: string;
  categoryName: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  colorClass: string;
  accentBorder: string;
}

function CheckboxGroup({ label, categoryName, options, selected, onChange, colorClass, accentBorder }: CheckboxGroupProps) {
  const toggle = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option]
    );
  };

  if (!options?.length) return null;

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Section 1: AI가 pick한 대중 의견 (read-only) */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-300">{label}</h3>
          <span className="text-xs text-gray-500">{selected.length}/{options.length} 선택</span>
        </div>
        <p className="text-xs text-gray-500 mb-2.5">AI가 분석한 대중 의견입니다.</p>
        <div className="flex flex-wrap gap-1.5">
          {options.map((option) => (
            <span
              key={option}
              className={`text-xs px-2.5 py-1 rounded-full ${colorClass} ${accentBorder} border`}
            >
              {option}
            </span>
          ))}
        </div>
      </div>

      {/* Divider */}
      <hr className="border-gray-700/60" />

      {/* Section 2: 내 선택 영역 (칩 버튼) */}
      <div className="bg-gray-800/30 px-4 pt-3 pb-4">
        <p className="text-xs text-gray-500 mb-3">나도 느낀 {categoryName}을 선택하세요.</p>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggle(option)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  isSelected
                    ? `${colorClass} ${accentBorder}`
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function NoteEditPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditing = !!id && id !== 'new';

  const stateData = location.state as { liquor?: Liquor; imageUrl?: string } | null;
  const [liquor, setLiquor] = useState<Liquor | null>(stateData?.liquor || null);

  const [rating, setRating] = useState(0);
  const [aroma, setAroma] = useState<string[]>([]);
  const [taste, setTaste] = useState<string[]>([]);
  const [finish, setFinish] = useState<string[]>([]);
  const [foodPairing, setFoodPairing] = useState<string[]>([]);
  const [overallNotes, setOverallNotes] = useState('');
  const [tastingDate, setTastingDate] = useState(new Date().toISOString().split('T')[0]);
  const [locationText, setLocationText] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAiReview, setShowAiReview] = useState(false);

  useEffect(() => {
    if (isEditing) loadNote();
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

    const note = data as TastingNote;
    setLiquor(note.liquor || null);
    setPhotoUrls(note.photo_urls || []);
    setRating(note.rating || 0);
    setAroma(note.aroma || []);
    setTaste(note.taste || []);
    setFinish(note.finish || []);
    setFoodPairing(note.food_pairing || []);
    setOverallNotes(note.overall_notes || '');
    setTastingDate(note.tasting_date || new Date().toISOString().split('T')[0]);
    setLocationText(note.location || '');
    setPurchasePrice(note.purchase_price?.toString() || '');
  };

  const handleSave = async () => {
    if (!liquor) return;
    setSaving(true);
    setError('');

    try {
      const noteData = {
        liquor_id: liquor.id,
        photo_urls: stateData?.imageUrl ? [stateData.imageUrl] : photoUrls,
        rating: rating || null,
        aroma,
        taste,
        finish,
        food_pairing: foodPairing,
        overall_notes: overallNotes || null,
        tasting_date: tastingDate,
        location: locationText || null,
        purchase_price: purchasePrice ? parseInt(purchasePrice) : null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('tasting_notes')
          .update(noteData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tasting_notes')
          .insert(noteData);
        if (error) throw error;
      }

      navigate('/collection');
    } catch (err: any) {
      setError(err.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!liquor) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>주류 정보가 없습니다.</p>
        <button onClick={() => navigate('/capture')} className="mt-4 text-violet-400">
          촬영하기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/collection')}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-white">
          {isEditing ? '노트 수정' : '테이스팅 노트 작성'}
        </h1>
      </div>

      {/* Liquor Info Summary */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <h2 className="font-semibold text-white">{liquor.name}</h2>
        {liquor.name_original && (
          <p className="text-sm text-gray-500">{liquor.name_original}</p>
        )}
        <div className="mt-1 flex gap-2 text-xs text-gray-400">
          {liquor.country && <span>{liquor.country}</span>}
          {liquor.vintage && <span>{liquor.vintage}</span>}
          {liquor.abv && <span>{liquor.abv}%</span>}
        </div>
      </div>

      {/* Rating Comparison: AI vs My */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 rounded-2xl p-3 border border-gray-800 text-center">
          <p className="text-xs text-gray-500 mb-2">대중 평점</p>
          {liquor.avg_rating ? (
            <RatingStars rating={liquor.avg_rating} size="sm" readonly />
          ) : (
            <p className="text-gray-600 text-sm">정보 없음</p>
          )}
        </div>
        <div className="bg-gray-900 rounded-2xl p-3 border border-violet-500/30 text-center">
          <p className="text-xs text-violet-400 mb-2">내 평점</p>
          <RatingStars rating={rating} onChange={setRating} size="sm" />
        </div>
      </div>

      {/* Sensory Sections with AI context */}
      <CheckboxGroup
        label="향 (Aroma)"
        categoryName="향"
        options={liquor.aroma_options || []}
        selected={aroma}
        onChange={setAroma}
        colorClass="bg-pink-500/30 text-pink-300"
        accentBorder="border-pink-500/40"
      />
      <CheckboxGroup
        label="맛 (Taste)"
        categoryName="맛"
        options={liquor.taste_options || []}
        selected={taste}
        onChange={setTaste}
        colorClass="bg-amber-500/30 text-amber-300"
        accentBorder="border-amber-500/40"
      />
      <CheckboxGroup
        label="여운 (Finish)"
        categoryName="여운"
        options={liquor.finish_options || []}
        selected={finish}
        onChange={setFinish}
        colorClass="bg-emerald-500/30 text-emerald-300"
        accentBorder="border-emerald-500/40"
      />
      <CheckboxGroup
        label="음식 페어링"
        categoryName="음식"
        options={liquor.food_pairing_options || []}
        selected={foodPairing}
        onChange={setFoodPairing}
        colorClass="bg-blue-500/30 text-blue-300"
        accentBorder="border-blue-500/40"
      />

      {/* Overall Notes with AI Reference */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">종합 후기</h3>

        {/* AI Review Toggle */}
        {liquor.overall_review && (
          <div>
            <button
              type="button"
              onClick={() => setShowAiReview(!showAiReview)}
              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${showAiReview ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              대중 종합 후기 참고하기
            </button>
            {showAiReview && (
              <div className="mt-2 bg-violet-500/10 rounded-xl p-3 border border-violet-500/20">
                <p className="text-xs text-gray-400 leading-relaxed">{liquor.overall_review}</p>
              </div>
            )}
          </div>
        )}

        <textarea
          value={overallNotes}
          onChange={(e) => setOverallNotes(e.target.value)}
          placeholder="이 주류에 대한 나의 느낌을 자유롭게 적어보세요..."
          rows={4}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none transition-colors"
        />
      </div>

      {/* Meta Info */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-3">
        <div>
          <label className="text-sm text-gray-400 block mb-1">테이스팅 날짜</label>
          <input type="date" value={tastingDate} onChange={(e) => setTastingDate(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors" />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">장소</label>
          <input type="text" value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="예: 홍대 와인바" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors" />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">구매가 (원)</label>
          <input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="예: 35000" min="0" inputMode="numeric" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors" />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 text-white rounded-2xl py-4 font-semibold text-lg transition-colors"
      >
        {saving ? '저장 중...' : isEditing ? '수정 완료' : '노트 저장'}
      </button>
    </div>
  );
}
