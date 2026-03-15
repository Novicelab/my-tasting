import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function MyPage() {
  const { user, isAnonymous, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<'email' | 'password' | 'delete' | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const provider = user?.app_metadata?.provider;
  const isKakao = provider === 'kakao';
  const isEmail = provider === 'email';
  const email = user?.email;

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    if (type === 'success') {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      showMessage('success', '새 이메일로 확인 메일이 발송되었습니다. 메일을 확인해주세요.');
      setNewEmail('');
      setActiveSection(null);
    } catch (err: any) {
      showMessage('error', err.message || '이메일 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      showMessage('error', '새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 6) {
      showMessage('error', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showMessage('success', '비밀번호가 변경되었습니다.');
      setNewPassword('');
      setConfirmPassword('');
      setActiveSection(null);
    } catch (err: any) {
      showMessage('error', err.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== '탈퇴합니다') return;
    setLoading(true);
    setMessage(null);
    try {
      // Supabase client-side에서는 직접 삭제 불가 → Edge Function 호출
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('세션이 없습니다.');

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || '탈퇴 처리에 실패했습니다.');
      }

      await signOut();
      navigate('/auth');
    } catch (err: any) {
      showMessage('error', err.message || '탈퇴 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (isAnonymous) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <div className="bg-gray-900 rounded-2xl p-6 text-center space-y-4">
          <p className="text-gray-400">로그인 후 이용할 수 있습니다.</p>
          <button
            onClick={() => navigate('/auth')}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl transition-colors"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">마이페이지</h1>

      {/* 메시지 */}
      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${
          message.type === 'success' ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-800' : 'bg-red-900/50 text-red-300 border border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* 계정 정보 */}
      <section className="bg-gray-900 rounded-2xl p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-200">계정 정보</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">로그인 방식</span>
            <span className="text-gray-200 flex items-center gap-1.5">
              {isKakao && (
                <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">카카오</span>
              )}
              {isEmail && (
                <span className="bg-violet-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">이메일</span>
              )}
              {!isKakao && !isEmail && (
                <span className="bg-gray-700 text-gray-300 text-xs font-bold px-2 py-0.5 rounded-full">{provider}</span>
              )}
            </span>
          </div>
          {email && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">이메일</span>
              <span className="text-gray-200">{email}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">가입일</span>
            <span className="text-gray-200">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
            </span>
          </div>
        </div>
      </section>

      {/* 이메일 변경 (이메일 로그인만) */}
      {isEmail && (
        <section className="bg-gray-900 rounded-2xl overflow-hidden">
          <button
            onClick={() => setActiveSection(activeSection === 'email' ? null : 'email')}
            className="w-full flex justify-between items-center p-5 text-left hover:bg-gray-800/50 transition-colors"
          >
            <span className="font-medium text-gray-200">이메일 변경</span>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${activeSection === 'email' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {activeSection === 'email' && (
            <div className="px-5 pb-5 space-y-3">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="새 이메일 주소"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
              <button
                onClick={handleUpdateEmail}
                disabled={loading || !newEmail.trim()}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {loading ? '처리 중...' : '이메일 변경'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* 비밀번호 변경 (이메일 로그인만) */}
      {isEmail && (
        <section className="bg-gray-900 rounded-2xl overflow-hidden">
          <button
            onClick={() => setActiveSection(activeSection === 'password' ? null : 'password')}
            className="w-full flex justify-between items-center p-5 text-left hover:bg-gray-800/50 transition-colors"
          >
            <span className="font-medium text-gray-200">비밀번호 변경</span>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${activeSection === 'password' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {activeSection === 'password' && (
            <div className="px-5 pb-5 space-y-3">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 (6자 이상)"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호 확인"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
              <button
                onClick={handleUpdatePassword}
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {loading ? '처리 중...' : '비밀번호 변경'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* 회원 탈퇴 */}
      <section className="bg-gray-900 rounded-2xl overflow-hidden">
        <button
          onClick={() => setActiveSection(activeSection === 'delete' ? null : 'delete')}
          className="w-full flex justify-between items-center p-5 text-left hover:bg-gray-800/50 transition-colors"
        >
          <span className="font-medium text-red-400">회원 탈퇴</span>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${activeSection === 'delete' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {activeSection === 'delete' && (
          <div className="px-5 pb-5 space-y-3">
            <p className="text-sm text-gray-400">
              탈퇴하면 모든 테이스팅 노트와 계정 정보가 삭제됩니다.
              이 작업은 되돌릴 수 없습니다.
            </p>
            <p className="text-sm text-red-400">
              탈퇴를 원하시면 아래에 <strong>"탈퇴합니다"</strong>를 입력해주세요.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="탈퇴합니다"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
            <button
              onClick={handleDeleteAccount}
              disabled={loading || deleteConfirm !== '탈퇴합니다'}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {loading ? '처리 중...' : '회원 탈퇴'}
            </button>
          </div>
        )}
      </section>

      {/* 로그아웃 */}
      <button
        onClick={async () => {
          await signOut();
          navigate('/auth');
        }}
        className="w-full bg-gray-900 hover:bg-gray-800 text-gray-400 py-3.5 rounded-2xl text-sm font-medium transition-colors"
      >
        로그아웃
      </button>
    </div>
  );
}
