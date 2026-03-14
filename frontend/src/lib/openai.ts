import { supabase } from './supabase';
import type { Liquor } from '../types';
import { FunctionsHttpError } from '@supabase/supabase-js';

export async function recognizeLiquor(imageUrl: string): Promise<Liquor> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase.functions.invoke('recognize', {
    body: { imageUrl },
  });

  if (error) {
    let msg = 'AI 인식에 실패했습니다.';
    if (error instanceof FunctionsHttpError) {
      try {
        const errBody = await error.context.json();
        msg = errBody.error || msg;
      } catch { /* ignore parse errors */ }
    } else {
      msg = data?.error || error.message || msg;
    }
    throw new Error(msg);
  }
  return data as Liquor;
}
