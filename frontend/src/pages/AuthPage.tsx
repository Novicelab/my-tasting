import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const authErrorMessages: Record<string, string> = {
  'invalid_credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'email_not_confirmed': '이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.',
  'over_email_send_rate_limit': '요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
  'user_not_found': '등록되지 않은 이메일입니다.',
};

function toKoreanError(err: any): string {
  const code = err?.code || '';
  const message = err?.message || '';
  if (authErrorMessages[code]) return authErrorMessages[code];
  if (message.includes('Invalid login')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  if (message.includes('rate limit')) return '요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.';
  if (message.includes('network')) return '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
  return '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isAnonymous, signInWithEmail, signInWithKakao } = useAuth();

  if (user && !isAnonymous) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signInWithEmail(trimmedEmail, password);
      navigate('/');
    } catch (err: any) {
      setError(toKoreanError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-violet-400">My Tasting</h1>
          <p className="text-gray-500 mt-2">나만의 주류 테이스팅 노트</p>
        </div>

        {/* 비로그인으로 시작 */}
        <button
          onClick={() => navigate('/')}
          className="w-full mb-6 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-300 rounded-xl py-3 px-4 font-medium transition-colors border border-gray-700"
        >
          로그인 없이 시작하기
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-gray-500 text-sm">로그인</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Social Login */}
        <div className="space-y-3 mb-6">
          {/* TODO: Google 로그인 — OAuth Client ID/Secret 발급 후 활성화 */}

          <button
            onClick={signInWithKakao}
            className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#191919] rounded-xl py-3 px-4 font-medium hover:bg-[#FDD800] active:bg-[#FCC800] transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#191919" d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67l-1.19 4.36c-.1.36.3.65.6.44l5.2-3.46c.24.02.48.03.73.03 5.52 0 10-3.58 10-7.99C22 6.58 17.52 3 12 3z"/>
            </svg>
            카카오로 로그인
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-gray-500 text-sm">또는 이메일</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Email Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            required
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            required
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:bg-gray-700 text-white rounded-xl py-3 font-medium transition-colors"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          계정이 없나요?{' '}
          <button
            onClick={() => navigate('/signup')}
            className="text-violet-400 hover:text-violet-300"
          >
            회원가입
          </button>
        </p>
      </div>
    </div>
  );
}
