import { useState, useRef, useEffect } from 'react';

interface LiquorConfirmationBannerProps {
  liquorName: string;
  attemptCount: number;
  onConfirm: () => void;
  onCorrect: (correctedName: string) => void;
  isLoading: boolean;
}

export default function LiquorConfirmationBanner({
  liquorName,
  attemptCount,
  onConfirm,
  onCorrect,
  isLoading,
}: LiquorConfirmationBannerProps) {
  const [mode, setMode] = useState<'asking' | 'input'>('asking');
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'input') {
      inputRef.current?.focus();
    }
  }, [mode]);

  // Reset to asking mode when liquorName changes (after re-search)
  useEffect(() => {
    setMode('asking');
    setInputValue('');
  }, [liquorName]);

  const handleSubmitCorrection = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onCorrect(trimmed);
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-violet-500/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-gray-300">
          AI가 인식한 주류가 맞나요?
        </p>
      </div>

      <p className="text-lg font-bold text-white pl-7">
        {liquorName}
      </p>

      {mode === 'asking' && (
        <div className="flex gap-2 pl-7">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                확인 중...
              </span>
            ) : (
              '맞아요'
            )}
          </button>
          <button
            onClick={() => setMode('input')}
            disabled={isLoading}
            className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition-colors border border-gray-700"
          >
            다른 주류예요
          </button>
        </div>
      )}

      {mode === 'input' && (
        <div className="space-y-2 pl-7">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitCorrection()}
              placeholder="정확한 주류 이름을 입력하세요"
              disabled={isLoading}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <button
              onClick={handleSubmitCorrection}
              disabled={isLoading || !inputValue.trim()}
              className="bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shrink-0"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                '재검색'
              )}
            </button>
          </div>
          <button
            onClick={() => { setMode('asking'); setInputValue(''); }}
            disabled={isLoading}
            className="text-xs text-gray-500 hover:text-gray-400"
          >
            취소
          </button>
          {attemptCount >= 1 && (
            <p className="text-xs text-amber-400/70">
              여러 번 검색했습니다. 라벨이 선명하게 보이는 다른 사진을 시도해보세요.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
