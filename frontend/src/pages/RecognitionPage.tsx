import { useLocation, useNavigate } from 'react-router-dom';
import type { Liquor } from '../types';
import RatingStars from '../components/RatingStars';

const categoryLabel: Record<string, string> = {
  wine: '와인',
  sake: '사케',
  traditional_korean: '전통주',
  whisky: '위스키',
  beer: '맥주',
  spirits: '증류주',
};

export default function RecognitionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { liquor, imageUrl } = (location.state as { liquor: Liquor; imageUrl: string }) || {};

  if (!liquor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">인식 결과가 없습니다.</p>
        <button
          onClick={() => navigate('/capture')}
          className="mt-4 text-violet-400 hover:text-violet-300"
        >
          다시 촬영하기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">AI 인식 결과</h1>

      {/* Image + Basic Info */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        {imageUrl && (
          <img src={imageUrl} alt={liquor.name} className="w-full rounded-xl max-h-48 object-cover mb-4" />
        )}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{liquor.name}</h2>
              {liquor.name_original && (
                <p className="text-sm text-gray-400">{liquor.name_original}</p>
              )}
            </div>
            <span className="text-xs bg-violet-500/20 text-violet-300 px-2.5 py-1 rounded-full">
              {categoryLabel[liquor.category] || liquor.category}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {liquor.country && (
              <div className="text-gray-400">
                <span className="text-gray-600">국가</span> {liquor.country}
              </div>
            )}
            {liquor.region && (
              <div className="text-gray-400">
                <span className="text-gray-600">지역</span> {liquor.region}
              </div>
            )}
            {liquor.producer && (
              <div className="text-gray-400">
                <span className="text-gray-600">생산자</span> {liquor.producer}
              </div>
            )}
            {liquor.vintage && (
              <div className="text-gray-400">
                <span className="text-gray-600">빈티지</span> {liquor.vintage}
              </div>
            )}
            {liquor.abv && (
              <div className="text-gray-400">
                <span className="text-gray-600">도수</span> {liquor.abv}%
              </div>
            )}
            {liquor.price_range && (
              <div className="text-gray-400">
                <span className="text-gray-600">가격대</span> {liquor.price_range}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Overall Review */}
      {liquor.avg_rating && (
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">대중 평점</h3>
          <RatingStars rating={liquor.avg_rating} size="md" readonly />
        </div>
      )}

      {/* AI Review Sections */}
      <div className="space-y-3">
        {liquor.description && (
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">설명</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{liquor.description}</p>
          </div>
        )}

        {liquor.aroma_options?.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">향 (대중 의견)</h3>
            <div className="flex flex-wrap gap-2">
              {liquor.aroma_options.map((a) => (
                <span key={a} className="text-sm bg-pink-500/20 text-pink-300 px-2.5 py-1 rounded-full">{a}</span>
              ))}
            </div>
          </div>
        )}

        {liquor.taste_options?.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">맛 (대중 의견)</h3>
            <div className="flex flex-wrap gap-2">
              {liquor.taste_options.map((t) => (
                <span key={t} className="text-sm bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        )}

        {liquor.finish_options?.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">여운 (대중 의견)</h3>
            <div className="flex flex-wrap gap-2">
              {liquor.finish_options.map((f) => (
                <span key={f} className="text-sm bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full">{f}</span>
              ))}
            </div>
          </div>
        )}

        {liquor.food_pairing_options?.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">음식 페어링 추천</h3>
            <div className="flex flex-wrap gap-2">
              {liquor.food_pairing_options.map((f) => (
                <span key={f} className="text-sm bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full">{f}</span>
              ))}
            </div>
          </div>
        )}

        {liquor.overall_review && (
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">대중 종합 후기</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{liquor.overall_review}</p>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={() => navigate('/note/new', { state: { liquor, imageUrl } })}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-2xl py-4 font-semibold text-lg transition-colors"
      >
        내 테이스팅 노트 작성하기
      </button>
    </div>
  );
}
