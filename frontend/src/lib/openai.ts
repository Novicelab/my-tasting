import { supabase } from './supabase';
import type { Liquor, ProvisionalLiquor } from '../types';
import { FunctionsHttpError } from '@supabase/supabase-js';

async function ensureValidSession() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.session) throw new Error('로그인이 필요합니다.');
    return;
  }

  // JWT 만료 임박(5분 이내) 시 갱신 — 넉넉한 여유로 401 방지
  const expiresAt = session.expires_at ?? 0;
  if (expiresAt < Math.floor(Date.now() / 1000) + 300) {
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      // 갱신 실패 시 익명 재로그인
      const { error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) throw new Error('로그인이 필요합니다.');
    }
  }
}

async function forceRefreshSession() {
  const { error } = await supabase.auth.refreshSession();
  if (error) {
    const { error: anonError } = await supabase.auth.signInAnonymously();
    if (anonError) throw new Error('로그인이 필요합니다.');
  }
}

async function invokeRecognize(body: Record<string, unknown>) {
  await ensureValidSession();

  let { data, error } = await supabase.functions.invoke('recognize', { body });

  // 401 발생 시 세션 강제 갱신 후 1회 재시도
  if (error instanceof FunctionsHttpError && error.context.status === 401) {
    await forceRefreshSession();
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
