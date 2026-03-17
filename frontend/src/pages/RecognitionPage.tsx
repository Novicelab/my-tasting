import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Liquor, ProvisionalLiquor } from '../types';
import RatingStars from '../components/RatingStars';
import LiquorConfirmationBanner from '../components/LiquorConfirmationBanner';
import { recognizeLiquor, confirmLiquor } from '../lib/openai';

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
  const { liquor: initialLiquor, imageUrl } = (location.state as { liquor: ProvisionalLiquor; imageUrl: string }) || {};

  const [currentLiquor, setCurrentLiquor] = useState<ProvisionalLiquor | null>(initialLiquor || null);
  const [confirmedLiquor, setConfirmedLiquor] = useState<Liquor | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);
  const [correctionFailed, setCorrectionFailed] = useState(false);
  const [lastCorrectionName, setLastCorrectionName] = useState('');

  if (!currentLiquor || !imageUrl) {
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

  const handleConfirm = async () => {
    setIsLoading(true);
    setError('');
    try {
      const saved = await confirmLiquor(imageUrl, currentLiquor);
      setConfirmedLiquor(saved);
      setIsConfirmed(true);
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCorrect = async (correctedName: string) => {
    setIsLoading(true);
    setError('');
    setCorrectionFailed(false);
    setLastCorrectionName(correctedName);
    try {
      const result = await recognizeLiquor(imageUrl, { liquorName: correctedName });
      setCurrentLiquor(result);
      setAttemptCount((c) => c + 1);
    } catch {
      setCorrectionFailed(true);
      setError('주류 정보를 찾을 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterAsIs = async (name: string) => {
    setIsLoading(true);
    setError('');
    try {
      const minimalLiquor: ProvisionalLiquor = {
        name,
        name_original: null,
        category: 'etc',
        sub_category: null,
        country: null,
        region: null,
        producer: null,
        vintage: null,
        abv: null,
        price_range: null,
        description: null,
        aroma_options: [],
        taste_options: [],
        finish_options: [],
        overall_review: null,
        food_pairing_options: [],
        avg_rating: null,
        drinking_timing: null,
        image_url: null,
      };
      const saved = await confirmLiquor(imageUrl, minimalLiquor);
      navigate('/note/new', { state: { liquor: saved, imageUrl } });
    } catch {
      setError('등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const liquor = currentLiquor;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">AI 인식 결과</h1>
        <button
          onClick={() => navigate('/capture')}
          className="text-sm text-gray-400 hover:text-gray-200 flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          다시 촬영
        </button>
      </div>

      {/* Image + Basic Info */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        {imageUrl && !imgError && (
          <img src={imageUrl} alt={liquor.name} className="w-full rounded-xl max-h-48 object-cover mb-4 bg-gray-800" onError={() => setImgError(true)} />
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

      {/* Confirmation Banner */}
      {!isConfirmed ? (
        <LiquorConfirmationBanner
          liquorName={liquor.name}
          attemptCount={attemptCount}
          onConfirm={handleConfirm}
          onCorrect={handleCorrect}
          onRegisterAsIs={handleRegisterAsIs}
          onRetakePhoto={() => navigate('/capture')}
          isLoading={isLoading}
          correctionFailed={correctionFailed}
          lastCorrectionName={lastCorrectionName}
        />
      ) : (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-3">
          <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-emerald-300">확인된 주류입니다</p>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      {/* 확인 전 안내 메시지 */}
      {!isConfirmed && !isLoading && !correctionFailed && (
        <p className="text-sm text-gray-500 text-center">
          주류가 맞는지 확인하시면 상세 검색 결과를 보여드립니다.
        </p>
      )}

      {/* 상세 검색 결과 - 확인 후에만 노출 */}
      {isConfirmed && (
        <>
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

            {liquor.drinking_timing && (
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">음용 타이밍</h3>
                <span className="text-sm bg-violet-500/20 text-violet-300 px-2.5 py-1 rounded-full">
                  {liquor.drinking_timing}
                </span>
              </div>
            )}

            {liquor.overall_review && (
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">대중 종합 후기</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{liquor.overall_review}</p>
              </div>
            )}
          </div>

          {/* Action Button - 확인 후에만 노출 */}
          <button
            onClick={() => navigate('/note/new', { state: { liquor: confirmedLiquor, imageUrl } })}
            className="w-full rounded-2xl py-4 font-semibold text-lg transition-colors bg-violet-600 hover:bg-violet-700 text-white"
          >
            내 테이스팅 노트 작성하기
          </button>
        </>
      )}
    </div>
  );
}
