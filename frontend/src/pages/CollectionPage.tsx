import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { TastingNote } from '../types';
import NoteCard from '../components/NoteCard';

type SortOption = 'latest' | 'rating' | 'date';

export default function CollectionPage() {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<TastingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>('latest');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) loadNotes();
  }, [sort, user, authLoading]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tasting_notes')
        .select('*, liquor:liquors(*)');

      if (sort === 'latest') {
        query = query.order('created_at', { ascending: false });
      } else if (sort === 'rating') {
        query = query.order('rating', { ascending: false, nullsFirst: false });
      } else if (sort === 'date') {
        query = query.order('tasting_date', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = search
    ? notes.filter((n) =>
        n.liquor?.name?.toLowerCase().includes(search.toLowerCase()) ||
        n.location?.toLowerCase().includes(search.toLowerCase()) ||
        n.overall_notes?.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">내 컬렉션</h1>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="검색..."
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
        />
      </div>

      {/* Sort */}
      <div className="flex gap-2">
        {([
          ['latest', '최신순'],
          ['rating', '평점순'],
          ['date', '날짜순'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setSort(value)}
            className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
              sort === value
                ? 'bg-violet-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Notes List */}
      {(loading || authLoading) ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>{search ? '검색 결과가 없습니다' : '아직 테이스팅 노트가 없습니다'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => navigate(`/note/${note.id}`)}
            />
          ))}
        </div>
      )}

      {/* Count */}
      {!loading && !authLoading && (
        <p className="text-center text-sm text-gray-600">
          총 {filteredNotes.length}개의 노트
        </p>
      )}
    </div>
  );
}
