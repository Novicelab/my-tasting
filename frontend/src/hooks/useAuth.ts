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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
      } else {
        // 세션 없으면 익명 로그인
        await signInAnonymously();
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
  const verifyEmailOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
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
