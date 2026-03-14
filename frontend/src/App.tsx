import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import CapturePage from './pages/CapturePage';
import RecognitionPage from './pages/RecognitionPage';
import NoteEditPage from './pages/NoteEditPage';
import CollectionPage from './pages/CollectionPage';
import NoteDetailPage from './pages/NoteDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/capture" element={<CapturePage />} />
          <Route path="/recognition" element={<RecognitionPage />} />
          <Route path="/note/new" element={<NoteEditPage />} />
          <Route path="/note/:id" element={<NoteDetailPage />} />
          <Route path="/note/:id/edit" element={<NoteEditPage />} />
          <Route path="/collection" element={<CollectionPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
