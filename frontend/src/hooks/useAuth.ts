import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

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

  // 소셜 로그인 (익명 → 정식 전환 포함)
  const signInWithGoogle = async () => {
    if (isAnonymous) {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } else {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    }
  };

  const signInWithKakao = async () => {
    if (isAnonymous) {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'kakao',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } else {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    }
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
    signInWithEmail,
    signUpWithEmail,
    verifyEmailOtp,
    signInWithGoogle,
    signInWithKakao,
    signOut,
  };
}
