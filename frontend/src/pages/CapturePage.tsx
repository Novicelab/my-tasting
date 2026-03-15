import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera';
import { recognizeLiquor } from '../lib/openai';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CapturePage() {
  const navigate = useNavigate();
  const { fileInputRef, uploading, imageUrl, setImageUrl, openCamera, openGallery, uploadImage } = useCamera();
  const [recognizing, setRecognizing] = useState(false);
  const [error, setError] = useState('');
  const [manualName, setManualName] = useState('');
  const [isManualSearch, setIsManualSearch] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);

  // Focus manual input when error appears
  useEffect(() => {
    if (error && imageUrl) {
      const timer = setTimeout(() => manualInputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [error, imageUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setManualName('');
    setIsManualSearch(false);
    setImageUrl(null);
    setImageBase64(null);

    try {
      // Convert file to base64 for AI recognition
      const base64 = await fileToBase64(file);
      setImageBase64(base64);

      const url = await uploadImage(file);
      await handleRecognize(url, undefined, base64);
    } catch (err: any) {
      setError(err.message || '이미지 업로드에 실패했습니다.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRecognize = async (url: string, liquorName?: string, base64?: string) => {
    setRecognizing(true);
    setError('');
    try {
      const liquor = await recognizeLiquor(url, { liquorName, imageBase64: base64 || imageBase64 || undefined });
      navigate('/recognition', { state: { liquor, imageUrl: url } });
    } catch (err: any) {
      setError(err.message || 'AI 인식에 실패했습니다.');
    } finally {
      setRecognizing(false);
    }
  };

  const handleManualSearch = () => {
    const trimmed = manualName.trim();
    if (!trimmed || !imageUrl || recognizing) return;
    setIsManualSearch(true);
    handleRecognize(imageUrl, trimmed);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">주류 촬영</h1>
        <p className="text-gray-400 mt-1">라벨이 잘 보이도록 촬영해주세요</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Preview */}
      {imageUrl ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt="캡처된 이미지"
            className="w-full rounded-2xl max-h-80 object-cover bg-gray-800"
          />
          {recognizing && (
            <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-white font-medium">AI가 주류를 인식하고 있습니다...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-900 border-2 border-dashed border-gray-700 rounded-2xl p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-500">아래 버튼으로 사진을 촬영하거나 선택하세요</p>
        </div>
      )}

      {/* Capture Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={openCamera}
          disabled={uploading || recognizing}
          className="flex flex-col items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-2xl p-5 transition-colors"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-medium text-sm">카메라</span>
        </button>
        <button
          onClick={openGallery}
          disabled={uploading || recognizing}
          className="flex flex-col items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-2xl p-5 transition-colors"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-medium text-sm">앨범</span>
        </button>
      </div>

      {(uploading || recognizing) && (
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span>{uploading ? '업로드 중...' : 'AI 인식 중...'}</span>
        </div>
      )}

      {/* Error + Manual Input Fallback */}
      {error && imageUrl && !recognizing && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm text-gray-300">{isManualSearch ? '주류 검색에 실패했습니다' : 'AI 인식에 실패했습니다'}</p>
              <p className="text-xs text-gray-500 mt-0.5">{error}</p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-3">
            <p className="text-xs text-gray-400 mb-2">주류 이름을 직접 입력하여 검색할 수 있습니다.</p>
            <div className="flex gap-2">
              <input
                ref={manualInputRef}
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                placeholder="주류 이름 입력 (예: 구보타 준마이)"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
              <button
                onClick={handleManualSearch}
                disabled={!manualName.trim()}
                className="bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shrink-0"
              >
                검색
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error without image (upload failure) */}
      {error && !imageUrl && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}
    </div>
  );
}
