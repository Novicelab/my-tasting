import { supabase } from './supabase';
import type { Liquor, ProvisionalLiquor } from '../types';
import { FunctionsHttpError } from '@supabase/supabase-js';

async function invokeRecognize(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase.functions.invoke('recognize', { body });

  if (error) {
    let msg = 'AI 인식에 실패했습니다.';
    if (error instanceof FunctionsHttpError) {
      try {
        const errBody = await error.context.json();
        msg = errBody.error || msg;
      } catch { /* ignore parse errors */ }
    } else {
      msg = error.message || msg;
    }
    throw new Error(msg);
  }
  return data;
}

// AI 인식 (DB 저장 없이 결과만 반환)
export async function recognizeLiquor(
  imageUrl: string,
  options?: { liquorName?: string },
): Promise<ProvisionalLiquor> {
  return invokeRecognize({
    imageUrl,
    liquorName: options?.liquorName,
    dryRun: true,
  });
}

// 사용자 확인 후 DB에 저장 (AI 재호출 없이 확인된 데이터 직접 저장)
export async function confirmLiquor(
  imageUrl: string,
  confirmedData: ProvisionalLiquor,
): Promise<Liquor> {
  return invokeRecognize({
    imageUrl,
    confirmedData,
  });
}
