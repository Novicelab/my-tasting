import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto">
      <div className="bg-gray-900 border border-violet-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg shadow-black/40">
        <p className="text-sm text-gray-300">새 버전이 있습니다.</p>
        <button
          onClick={() => updateServiceWorker(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shrink-0"
        >
          업데이트
        </button>
      </div>
    </div>
  );
}
