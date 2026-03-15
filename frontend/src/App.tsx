import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import AuthPage from './pages/AuthPage';
import SignUpPage from './pages/SignUpPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import HomePage from './pages/HomePage';
import CapturePage from './pages/CapturePage';
import RecognitionPage from './pages/RecognitionPage';
import NoteEditPage from './pages/NoteEditPage';
import CollectionPage from './pages/CollectionPage';
import NoteDetailPage from './pages/NoteDetailPage';
import MyPage from './pages/MyPage';

export default function App() {
  return (
    <BrowserRouter>
      <PWAUpdatePrompt />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/capture" element={<CapturePage />} />
          <Route path="/recognition" element={<RecognitionPage />} />
          <Route path="/note/new" element={<NoteEditPage />} />
          <Route path="/note/:id" element={<NoteDetailPage />} />
          <Route path="/note/:id/edit" element={<NoteEditPage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/mypage" element={<MyPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
