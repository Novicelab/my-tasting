import { supabase } from './supabase';
import type { Liquor, ProvisionalLiquor } from '../types';
import { FunctionsHttpError } from '@supabase/supabase-js';

/**
 * 유효한 access_token을 직접 반환.
 * SDK 내부의 getSession() 로컬 캐시에 의존하지 않고,
 * 반환된 토큰을 functions.invoke()에 명시적으로 전달하기 위함.
 */
async function getValidAccessToken(): Promise<string> {
  // 1) 현재 세션 확인
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    const expiresAt = session.expires_at ?? 0;
    const now = Math.floor(Date.now() / 1000);

    // 아직 60초 이상 유효 → 그대로 사용
    if (expiresAt > now + 60) {
      return session.access_token;
    }

    // 만료 임박 → refreshSession으로 갱신
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed.session) {
      return refreshed.session.access_token;
    }
  }

  // 2) 세션 없거나 갱신 실패 → 완전 초기화 후 새 익명 세션
  await supabase.auth.signOut();
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session) throw new Error('로그인이 필요합니다.');
  return data.session.access_token;
}

async function invokeRecognize(body: Record<string, unknown>) {
  const token = await getValidAccessToken();

  let { data, error } = await supabase.functions.invoke('recognize', {
    body,
    headers: { Authorization: `Bearer ${token}` },
  });

  // 401 발생 시 세션 완전 초기화 후 1회 재시도
  if (error instanceof FunctionsHttpError && error.context.status === 401) {
    await supabase.auth.signOut();
    const { data: freshSession, error: anonError } = await supabase.auth.signInAnonymously();
    if (anonError || !freshSession.session) throw new Error('로그인이 필요합니다.');

    ({ data, error } = await supabase.functions.invoke('recognize', {
      body,
      headers: { Authorization: `Bearer ${freshSession.session.access_token}` },
    }));
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
