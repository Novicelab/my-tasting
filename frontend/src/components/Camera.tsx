import { useEffect, useRef } from 'react';
import { useCamera } from '../hooks/useCamera';

interface CameraProps {
  onImageCaptured: (imageUrl: string) => void;
}

export default function Camera({ onImageCaptured }: CameraProps) {
  const { fileInputRef, capturing, uploading, imageUrl, handleFileChange, openCamera, openGallery } = useCamera();
  const prevImageUrl = useRef<string | null>(null);

  useEffect(() => {
    if (imageUrl && imageUrl !== prevImageUrl.current) {
      prevImageUrl.current = imageUrl;
      onImageCaptured(imageUrl);
    }
  }, [imageUrl, onImageCaptured]);

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={openCamera}
          disabled={capturing || uploading}
          className="flex flex-col items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 text-white rounded-2xl p-6 transition-colors"
        >
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-medium">카메라</span>
        </button>

        <button
          onClick={openGallery}
          disabled={capturing || uploading}
          className="flex flex-col items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 text-white rounded-2xl p-6 transition-colors"
        >
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-medium">앨범</span>
        </button>
      </div>

      {(capturing || uploading) && (
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span>{uploading ? '업로드 중...' : '처리 중...'}</span>
        </div>
      )}
    </div>
  );
}
