import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera';
import { recognizeLiquor } from '../lib/openai';

export default function CapturePage() {
  const navigate = useNavigate();
  const { fileInputRef, uploading, imageUrl, openCamera, openGallery, uploadImage } = useCamera();
  const [recognizing, setRecognizing] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    try {
      const url = await uploadImage(file);
      await handleRecognize(url);
    } catch (err: any) {
      setError(err.message || '이미지 업로드에 실패했습니다.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRecognize = async (url: string) => {
    setRecognizing(true);
    try {
      const liquor = await recognizeLiquor(url);
      // Navigate to recognition result with liquor data
      navigate('/recognition', { state: { liquor, imageUrl: url } });
    } catch (err: any) {
      setError(err.message || 'AI 인식에 실패했습니다.');
    } finally {
      setRecognizing(false);
    }
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
            className="w-full rounded-2xl max-h-80 object-cover"
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

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}
    </div>
  );
}
