import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const authErrorMessages: Record<string, string> = {
  'over_email_send_rate_limit': '이메일 발송 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
  'email_address_invalid': '올바른 이메일 주소를 입력해주세요.',
  'user_already_exists': '이미 가입된 이메일입니다. 로그인을 시도해주세요.',
  'weak_password': '비밀번호가 너무 약합니다. 6자 이상 입력해주세요.',
  'signup_disabled': '현재 회원가입이 비활성화되어 있습니다.',
  'email_exists': '이미 가입된 이메일입니다.',
  'otp_expired': '인증 코드가 만료되었습니다. 다시 시도해주세요.',
};

function toKoreanError(err: any): string {
  const code = err?.code || '';
  const message = err?.message || '';
  if (authErrorMessages[code]) return authErrorMessages[code];
  if (message.includes('rate limit')) return '요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.';
  if (message.includes('already registered')) return '이미 가입된 이메일입니다.';
  if (message.includes('Password')) return '비밀번호는 6자 이상이어야 합니다.';
  if (message.includes('network')) return '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
  if (message.includes('Token has expired') || message.includes('otp_expired')) return '인증 코드가 만료되었습니다. 다시 시도해주세요.';
  if (message.includes('Invalid') && message.includes('OTP')) return '인증 코드가 올바르지 않습니다.';
  return '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isAnonymous, signUpWithEmail, verifyEmailOtp, signInWithGoogle, signInWithKakao } = useAuth();

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
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signUpWithEmail(trimmedEmail, password);
      setStep('verify');
    } catch (err: any) {
      setError(toKoreanError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpCode.trim();
    if (!code) {
      setError('인증 코드를 입력해주세요.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await verifyEmailOtp(email.trim(), code);
      navigate('/');
    } catch (err: any) {
      setError(toKoreanError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password);
      setError('');
    } catch (err: any) {
      setError(toKoreanError(err));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: 인증 코드 입력
  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-violet-400">이메일 인증</h1>
            <p className="text-gray-400 mt-2">
              <span className="text-white font-medium">{email.trim()}</span>
              <br />으로 인증 코드를 전송했습니다.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">인증 코드 (6자리)</label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[0.5em] placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors font-mono"
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:bg-gray-700 text-white rounded-xl py-3 font-medium transition-colors"
            >
              {loading ? '확인 중...' : '인증 완료'}
            </button>
          </form>

          <div className="text-center mt-6 space-y-3">
            <p className="text-sm text-gray-500">
              이메일을 받지 못하셨나요?{' '}
              <button
                onClick={handleResend}
                disabled={loading}
                className="text-violet-400 hover:text-violet-300 disabled:text-gray-600"
              >
                다시 보내기
              </button>
            </p>
            <button
              onClick={() => { setStep('form'); setError(''); setOtpCode(''); }}
              className="text-sm text-gray-500 hover:text-gray-300"
            >
              이메일 변경
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: 가입 폼
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-violet-400">회원가입</h1>
          <p className="text-gray-500 mt-2">My Tasting에 가입하고 기록을 저장하세요</p>
        </div>

        {/* Social Signup */}
        <div className="space-y-3 mb-6">
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 rounded-xl py-3 px-4 font-medium hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 가입하기
          </button>

          <button
            onClick={signInWithKakao}
            className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#191919] rounded-xl py-3 px-4 font-medium hover:bg-[#FDD800] active:bg-[#FCC800] transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#191919" d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67l-1.19 4.36c-.1.36.3.65.6.44l5.2-3.46c.24.02.48.03.73.03 5.52 0 10-3.58 10-7.99C22 6.58 17.52 3 12 3z"/>
            </svg>
            카카오로 가입하기
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-gray-500 text-sm">또는 이메일로 가입</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Email Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              required
              minLength={6}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">비밀번호 확인</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호를 다시 입력"
              required
              minLength={6}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:bg-gray-700 text-white rounded-xl py-3 font-medium transition-colors"
          >
            {loading ? '처리 중...' : '가입하기'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          이미 계정이 있나요?{' '}
          <button
            onClick={() => navigate('/auth')}
            className="text-violet-400 hover:text-violet-300"
          >
            로그인
          </button>
        </p>
      </div>
    </div>
  );
}
