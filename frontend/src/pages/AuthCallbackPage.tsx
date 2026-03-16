import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { migrateAnonymousData } = useAuth();
  const [error, setError] = useState('');
  const migrateRef = useRef(migrateAnonymousData);
  migrateRef.current = migrateAnonymousData;

  useEffect(() => {
    let handled = false;

    // OAuth 리다이렉트 후 Supabase가 URL hash를 파싱하여 세션 설정
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (handled) return;
      if (event === 'SIGNED_IN' && session) {
        handled = true;
        await migrateRef.current();
        navigate('/', { replace: true });
      }
    });

    // 15초 타임아웃 — OAuth 실패 시 무한 스피너 방지
    const timeout = setTimeout(() => {
      if (!handled) {
        handled = true;
        setError('인증 처리 시간이 초과되었습니다. 다시 시도해주세요.');
      }
    }, 15000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => navigate('/auth')}
          className="text-violet-400 hover:text-violet-300"
        >
          로그인 페이지로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">인증 처리 중...</p>
      </div>
    </div>
  );
}
