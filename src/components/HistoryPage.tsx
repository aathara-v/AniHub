import React, { useState, useEffect } from 'react';
import { UserProfile, WatchHistoryItem } from '../types';
import { getUserWatchHistory } from '../lib/firebase';
import { History, Play, Clock, Layers } from 'lucide-react';

interface HistoryPageProps {
  user: UserProfile | null;
  onStartWatch: (animeId: number, episodeNum: number) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ user, onStartWatch, onOpenAuth }) => {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getUserWatchHistory(user.username)
      .then((items) => setHistory(items))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto my-16 p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <History className="w-12 h-12 text-indigo-500 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Log in to Track Watch History</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Your episode playback timestamps are saved automatically to Firestore so you can resume watching anytime.
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

  const formatTime = (secs: number) => {
    if (!secs) return '0m';
    const m = Math.floor(secs / 60);
    return `${m}m`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-black text-white">Watch History & Resume</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">Recently played episodes for @{user.username}</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400 animate-pulse">
          Loading watch history from Firestore...
        </div>
      ) : history.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {history.map((item, idx) => {
            const pct =
              item.duration > 0 ? Math.min(100, Math.floor((item.timestamp / item.duration) * 100)) : 0;
            return (
              <div
                key={`hist-${item.animeId}-ep${item.episodeNumber}-${idx}`}
                className="group p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition flex flex-col justify-between"
              >
                <div className="flex gap-3">
                  <img
                    src={item.animeImage}
                    alt={item.animeTitle}
                    className="w-16 aspect-[2/3] object-cover rounded-xl shrink-0 shadow"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">
                      EPISODE {item.episodeNumber}
                    </span>
                    <h3 className="font-bold text-xs text-white truncate">{item.animeTitle}</h3>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.episodeTitle}</p>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(item.timestamp)} / {formatTime(item.duration)} ({pct}%)
                    </p>
                  </div>
                </div>

                {/* Progress Bar & Resume Button */}
                <div className="mt-3 space-y-2">
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <button
                    onClick={() => onStartWatch(item.animeId, item.episodeNumber)}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 shadow"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    Resume Ep {item.episodeNumber}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-slate-800/80">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Watch History Yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Start streaming anime episodes and your playback progress will automatically show up here!
          </p>
        </div>
      )}
    </div>
  );
};
