import { supabase } from './supabase';
import type { Liquor, ProvisionalLiquor } from '../types';
import { FunctionsHttpError } from '@supabase/supabase-js';

async function ensureValidSession() {
  // getUser()로 서버 측 토큰 검증 (getSession은 로컬 캐시만 확인하므로 불충분)
  const { error: userError } = await supabase.auth.getUser();

  if (userError) {
    // 토큰이 무효 → 완전히 로그아웃 후 새 익명 세션 생성
    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw new Error('로그인이 필요합니다.');
  }
}

async function invokeRecognize(body: Record<string, unknown>) {
  await ensureValidSession();

  let { data, error } = await supabase.functions.invoke('recognize', { body });

  // 401 발생 시 세션 초기화 후 1회 재시도
  if (error instanceof FunctionsHttpError && error.context.status === 401) {
    await supabase.auth.signOut();
    await supabase.auth.signInAnonymously();
    ({ data, error } = await supabase.functions.invoke('recognize', { body }));
  }

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
