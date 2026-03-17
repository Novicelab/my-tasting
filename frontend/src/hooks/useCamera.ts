import { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const MAX_SIZE = 1280;
const JPEG_QUALITY = 0.8;

function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_SIZE || height > MAX_SIZE) {
        const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('이미지 변환에 실패했습니다.'))),
        'image/jpeg',
        JPEG_QUALITY,
      );
    };
    img.onerror = () => reject(new Error('이미지를 읽을 수 없습니다.'));
    img.src = URL.createObjectURL(file);
  });
}

export function useCamera() {
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openCamera = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  }, []);

  const openGallery = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  }, []);

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const resized = await resizeImage(file);
      const fileName = `${user.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('tasting-images')
        .upload(fileName, resized, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('tasting-images')
        .getPublicUrl(fileName);

      setImageUrl(data.publicUrl);
      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturing(true);
    try {
      await uploadImage(file);
    } finally {
      setCapturing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [uploadImage]);

  return {
    fileInputRef,
    capturing,
    uploading,
    imageUrl,
    setImageUrl,
    openCamera,
    openGallery,
    handleFileChange,
    uploadImage,
  };
}
