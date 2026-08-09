import React, { useState, useEffect } from 'react';
import { UserProfile, WatchlistItem } from '../types';
import { getUserWatchlist, removeFromWatchlist, saveUserWatchlist } from '../lib/firebase';
import { Bookmark, Play, Trash2, Star, CheckCircle, Clock, Eye, Layers } from 'lucide-react';

interface WatchlistPageProps {
  user: UserProfile | null;
  onStartWatch: (animeId: number, episodeNum: number) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const WatchlistPage: React.FC<WatchlistPageProps> = ({ user, onStartWatch, onOpenAuth }) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'watching' | 'plan_to_watch' | 'completed' | 'dropped'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getUserWatchlist(user.username)
      .then((items) => setWatchlist(items))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto my-16 p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <Bookmark className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Log in to View Your Watchlist</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Create an account or log in with your username & password to save your favorite anime, track watching status, and sync across sessions.
        </p>
        <button
          onClick={() => onOpenAuth('login')}
          className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl shadow-lg transition"
        >
          Log In or Register
        </button>
      </div>
    );
  }

  const handleRemove = async (animeId: number) => {
    try {
      await removeFromWatchlist(user.username, animeId);
      setWatchlist((prev) => prev.filter((item) => item.animeId !== animeId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (item: WatchlistItem, newStatus: any) => {
    try {
      const updated = await saveUserWatchlist(user.username, {
        animeId: item.animeId,
        title: item.title,
        image: item.image,
        score: item.score,
        episodes: item.episodes,
        status: newStatus,
      });
      setWatchlist((prev) =>
        prev.map((i) => (i.animeId === item.animeId ? { ...i, status: newStatus } : i))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = watchlist.filter((item) => (filter === 'all' ? true : item.status === filter));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-red-500 fill-red-500/20" />
            <h1 className="text-2xl font-black text-white">My Watchlist & Library</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Saved anime titles for @{user.username}</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold">
          {[
            { id: 'all', label: `All (${watchlist.length})` },
            { id: 'watching', label: 'Watching' },
            { id: 'plan_to_watch', label: 'Plan to Watch' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === tab.id ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400 animate-pulse">
          Loading your saved watchlist from Firestore...
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item, idx) => (
            <div
              key={`wl-${item.animeId}-${idx}`}
              className="group p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-red-500/50 transition flex gap-3"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-20 aspect-[2/3] object-cover rounded-xl shrink-0 shadow"
              />
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white truncate">{item.title}</h3>
                  <p className="text-[10px] text-amber-400 font-bold mt-0.5">
                    ★ {item.score ? item.score.toFixed(1) : 'N/A'} • {item.episodes ? `${item.episodes} Eps` : 'Airing'}
                  </p>
                </div>

                <div className="space-y-2 mt-2">
                  <select
                    value={item.status}
                    onChange={(e) => handleUpdateStatus(item, e.target.value)}
                    className="w-full text-[11px] font-semibold bg-slate-950 border border-slate-800 rounded-lg p-1 text-slate-300 focus:outline-none focus:border-red-500"
                  >
                    <option value="watching">Currently Watching</option>
                    <option value="plan_to_watch">Plan to Watch</option>
                    <option value="completed">Completed</option>
                    <option value="dropped">Dropped</option>
                  </select>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onStartWatch(item.animeId, 1)}
                      className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 shadow"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      Stream
                    </button>
                    <button
                      onClick={() => handleRemove(item.animeId)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                      title="Remove from list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-slate-800/80">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">Your Watchlist is Empty</h3>
          <p className="text-xs text-slate-400 mt-1">
            Browse anime from the homepage or search bar and click the bookmark button to save them here!
          </p>
        </div>
      )}
    </div>
  );
};
