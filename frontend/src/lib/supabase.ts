import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env file.');
}

// PWA standalone 모드에서는 implicit flow 사용
// PKCE flow는 code_verifier를 localStorage에 저장하는데,
// standalone PWA에서 OAuth 리다이렉트 시 외부 브라우저가 열리면
// localStorage에 접근할 수 없어 코드 교환이 실패함
const isStandalone = typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
   (window.navigator as any).standalone === true);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: isStandalone ? 'implicit' : 'pkce',
  },
});
