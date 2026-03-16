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

    const finish = async () => {
      if (handled) return;
      handled = true;
      await migrateRef.current();
      navigate('/', { replace: true });
    };

    // 1) URL에서 OAuth 에러 감지 (provider 비활성화, 인증 거부 등)
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
    const errorParam = searchParams.get('error') || hashParams.get('error');
    if (errorParam) {
      const errorDesc = searchParams.get('error_description') || hashParams.get('error_description') || '';
      handled = true;
      if (errorDesc.includes('provider') || errorDesc.includes('Provider')) {
        setError('현재 이 로그인 방식은 사용할 수 없습니다. 다른 방법으로 로그인해주세요.');
      } else {
        setError('로그인에 실패했습니다. 다시 시도해주세요.');
      }
      return;
    }

    // 2) onAuthStateChange 리스너 등록 (PKCE 코드 교환 완료 이벤트 수신)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (handled) return;
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        await finish();
      }
    });

    // 3) 이미 세션이 설정된 경우 처리 (race condition 방지)
    //    PKCE 코드 교환이 리스너 등록 전에 완료되었을 수 있음 (모바일에서 빈발)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (handled) return;
      if (session && !session.user.is_anonymous) {
        await finish();
      }
    });

    // 4) 15초 타임아웃 — OAuth 실패 시 무한 스피너 방지
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
