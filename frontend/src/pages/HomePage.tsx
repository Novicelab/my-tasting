import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { TastingNote } from '../types';
import NoteCard from '../components/NoteCard';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const [recentNotes, setRecentNotes] = useState<TastingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) loadRecentNotes();
  }, [user, authLoading]);

  const loadRecentNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('tasting_notes')
        .select('*, liquor:liquors(*)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentNotes(data || []);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Capture Button */}
      <button
        onClick={() => navigate('/capture')}
        className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 active:from-violet-800 active:to-purple-800 text-white rounded-2xl p-6 flex items-center gap-4 transition-all shadow-lg shadow-violet-500/20"
      >
        <div className="bg-white/20 rounded-xl p-3">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div className="text-left">
          <h2 className="text-lg font-bold">주류 촬영하기</h2>
          <p className="text-sm text-white/70">사진으로 AI가 주류를 인식합니다</p>
        </div>
      </button>

      {/* Recent Notes */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">최근 테이스팅</h2>
        {(loading || authLoading) ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentNotes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>아직 테이스팅 노트가 없습니다</p>
            <p className="text-sm mt-1">주류를 촬영하여 첫 노트를 작성해보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => navigate(`/note/${note.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
