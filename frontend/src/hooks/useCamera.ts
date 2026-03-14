import { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

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

      const ext = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('tasting-images')
        .upload(fileName, file, { contentType: file.type });

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
