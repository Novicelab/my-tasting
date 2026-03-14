import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PWAUpdatePrompt() {
  // autoUpdate 모드: 새 SW가 감지되면 자동으로 활성화 + 페이지 리로드
  useRegisterSW({
    onRegisteredSW(_url, registration) {
      // 주기적으로 SW 업데이트 확인 (1시간마다)
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
  });

  return null;
}
