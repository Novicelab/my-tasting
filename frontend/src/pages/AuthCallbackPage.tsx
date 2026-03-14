import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase가 URL hash에 토큰을 포함하여 리다이렉트함
      // supabase-js가 자동으로 hash를 파싱하여 세션을 설정
      const { error } = await supabase.auth.getSession();
      if (error) {
        setError('인증 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        return;
      }
      // 인증 성공 → 홈으로 이동
      navigate('/', { replace: true });
    };

    handleCallback();
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
        <p className="text-gray-400">이메일 인증 처리 중...</p>
      </div>
    </div>
  );
}
