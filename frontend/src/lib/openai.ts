import { supabase } from './supabase';
import type { Liquor } from '../types';

export async function recognizeLiquor(imageUrl: string): Promise<Liquor> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase.functions.invoke('recognize', {
    body: { imageUrl },
  });

  if (error) throw new Error(error.message || 'AI 인식에 실패했습니다.');
  return data as Liquor;
}
