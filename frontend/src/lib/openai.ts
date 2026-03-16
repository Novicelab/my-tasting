import { supabase, supabaseUrl, supabaseAnonKey } from './supabase';
import type { Liquor, ProvisionalLiquor } from '../types';

const FUNCTIONS_URL = `${supabaseUrl}/functions/v1/recognize`;

async function getAccessToken(): Promise<string> {
  // 1) 현재 세션 확인
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    const expiresAt = session.expires_at ?? 0;
    const now = Math.floor(Date.now() / 1000);

    if (expiresAt > now + 60) {
      return session.access_token;
    }

    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed.session) {
      return refreshed.session.access_token;
    }

    // 로그인 유저의 세션 갱신 실패 → 익명 전환하지 않고 에러
    if (!session.user.is_anonymous) {
      throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.');
    }
  }

  // 2) 세션 없거나 익명 세션 갱신 실패 → 새 익명 세션
  await supabase.auth.signOut();
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session) throw new Error('로그인이 필요합니다.');
  return data.session.access_token;
}

async function callEdgeFunction(body: Record<string, unknown>): Promise<Response> {
  const token = await getAccessToken();

  return fetch(FUNCTIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify(body),
  });
}

async function invokeRecognize(body: Record<string, unknown>) {
  let res = await callEdgeFunction(body);

  // 401 → 로그인 유저는 에러, 익명 유저만 세션 초기화 후 1회 재시도
  if (res.status === 401) {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession && !currentSession.user.is_anonymous) {
      throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.');
    }

    await supabase.auth.signOut();
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.session) throw new Error('로그인이 필요합니다.');

    res = await fetch(FUNCTIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.session.access_token}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify(body),
    });
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(errBody?.error || 'AI 인식에 실패했습니다.');
  }

  return res.json();
}

// AI 인식 (DB 저장 없이 결과만 반환)
export async function recognizeLiquor(
  imageUrl: string,
  options?: { liquorName?: string; imageBase64?: string },
): Promise<ProvisionalLiquor> {
  return invokeRecognize({
    imageUrl,
    imageBase64: options?.imageBase64,
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
