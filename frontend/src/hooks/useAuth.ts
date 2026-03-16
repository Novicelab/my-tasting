import { useState, useEffect } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

const ANON_UID_KEY = 'my_tasting_anon_uid';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isAnonymous = user?.is_anonymous === true;

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        setSession(session);
        setUser(session.user);
      } else {
        // OAuth 콜백 중에는 익명 로그인 건너뛰기
        // (PKCE 코드 교환 또는 implicit flow 토큰 처리와 충돌 방지)
        const isOAuthCallback = window.location.pathname.includes('/auth/callback');
        if (!isOAuthCallback) {
          await signInAnonymously();
        }
      }
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInAnonymously = async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('Anonymous sign-in failed:', error);
      return;
    }
    setSession(data.session);
    setUser(data.user);
  };

  // 이메일 회원가입 (익명 → 정식 전환)
  const signUpWithEmail = async (email: string, password: string) => {
    if (isAnonymous) {
      const { error } = await supabase.auth.updateUser({ email, password });
      if (error) throw error;
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    }
  };

  // 이메일 인증 코드 확인
  // 익명→정식 전환 시 updateUser로 보낸 OTP는 type: 'email_change'
  // 신규 가입 시 signUp으로 보낸 OTP는 type: 'email'
  const verifyEmailOtp = async (email: string, token: string) => {
    const otpType = isAnonymous ? 'email_change' : 'email';
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: otpType,
    });
    if (error) throw error;
  };

  // 이메일 로그인
  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  // 익명 user_id 저장 (OAuth 리다이렉트 전에 호출)
  const saveAnonymousId = () => {
    if (isAnonymous && user) {
      localStorage.setItem(ANON_UID_KEY, user.id);
    }
  };

  // 익명 데이터 마이그레이션
  const migrateAnonymousData = async () => {
    const anonUid = localStorage.getItem(ANON_UID_KEY);
    if (!anonUid) return 0;

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) return 0;

      const res = await fetch(`${supabaseUrl}/functions/v1/migrate-notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ anonymousUserId: anonUid }),
      });

      const result = await res.json();
      if (res.ok) {
        localStorage.removeItem(ANON_UID_KEY);
        return result.migrated || 0;
      }
      console.error('Migration failed:', result.error);
      return 0;
    } catch (err) {
      console.error('Migration error:', err);
      return 0;
    }
  };

  // 소셜 로그인 (signInWithOAuth는 익명 세션을 새 OAuth 세션으로 교체)
  const signInWithGoogle = async () => {
    saveAnonymousId();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  };

  const signInWithKakao = async () => {
    saveAnonymousId();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;

    // 모바일에서 Supabase 302 리다이렉트의 Referer가 카카오 보안 체크를
    // 트리거하는 문제 우회: 서버사이드에서 리다이렉트 URL을 추출하여 직접 이동
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/kakao-auth-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: data.url }),
      });
      const result = await res.json();
      if (result.url) {
        window.location.href = result.url;
        return;
      }
    } catch {
      // 프록시 실패 시 기존 방식으로 fallback
    }
    window.location.href = data.url;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    user,
    session,
    loading,
    isAnonymous,
    saveAnonymousId,
    migrateAnonymousData,
    signInWithEmail,
    signUpWithEmail,
    verifyEmailOtp,
    signInWithGoogle,
    signInWithKakao,
    signOut,
  };
}
