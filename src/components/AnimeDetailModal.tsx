import React, { useState, useEffect } from 'react';
import { Anime, AnimeCharacter, AnimeEpisode, AnimeComment, UserProfile } from '../types';
import { getAnimeEpisodes, getAnimeCharacters, getAnimeRecommendations } from '../lib/jikan';
import { addAnimeComment, getAnimeComments } from '../lib/firebase';
import {
  X,
  Play,
  Star,
  Bookmark,
  MessageSquare,
  Users,
  Film,
  Sparkles,
  Send,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';

interface AnimeDetailModalProps {
  anime: Anime | null;
  isOpen: boolean;
  onClose: () => void;
  onStartWatch: (anime: Anime, episodeNum: number) => void;
  onToggleWatchlist: (anime: Anime) => void;
  isWatchlisted: boolean;
  user: UserProfile | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const AnimeDetailModal: React.FC<AnimeDetailModalProps> = ({
  anime,
  isOpen,
  onClose,
  onStartWatch,
  onToggleWatchlist,
  isWatchlisted,
  user,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'episodes' | 'characters' | 'comments'>('episodes');
  const [episodes, setEpisodes] = useState<AnimeEpisode[]>([]);
  const [characters, setCharacters] = useState<AnimeCharacter[]>([]);
  const [comments, setComments] = useState<AnimeComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!anime || !isOpen) return;

    setLoadingData(true);
    Promise.all([
      getAnimeEpisodes(anime.mal_id),
      getAnimeCharacters(anime.mal_id),
      getAnimeComments(anime.mal_id),
    ])
      .then(([eps, chars, cmts]) => {
        setEpisodes(eps);
        setCharacters(chars.slice(0, 12));
        setComments(cmts);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoadingData(false));
  }, [anime, isOpen]);

  if (!isOpen || !anime) return null;

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth('login');
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const posted = await addAnimeComment(user.username, anime.mal_id, newComment);
      setComments([posted, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const posterImg = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl my-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 text-slate-300 bg-slate-950/80 hover:bg-red-600 hover:text-white rounded-full transition border border-slate-800 shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header & Backdrop */}
        <div className="relative h-64 sm:h-80 w-full bg-slate-950 overflow-hidden">
          <img
            src={posterImg}
            alt={anime.title}
            className="w-full h-full object-cover filter blur-sm opacity-40 scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent" />

          {/* Banner Details */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-end sm:items-center gap-6 z-10">
            <img
              src={posterImg}
              alt={anime.title}
              className="w-28 sm:w-36 aspect-[2/3] object-cover rounded-2xl shadow-2xl border-2 border-slate-700/80 shrink-0 hidden sm:block"
            />
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                {anime.score && (
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {anime.score.toFixed(1)} MAL
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">
                  {anime.type || 'TV'}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">
                  {anime.episodes ? `${anime.episodes} Episodes` : 'Airing'}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-red-950 text-red-300 border border-red-800">
                  {anime.status}
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white line-clamp-2">
                {anime.title_english || anime.title}
              </h2>

              <p className="text-xs text-slate-400">
                {anime.title_japanese} • {anime.studios?.[0]?.name || 'Studio'} • {anime.year || anime.season || 'Anime'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Metadata Row */}
        <div className="p-6 sm:p-8 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onStartWatch(anime, 1)}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-900/40 flex items-center gap-2 transition transform hover:scale-105"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>Start Watching Ep 1</span>
              </button>

              <button
                onClick={() => onToggleWatchlist(anime)}
                className={`px-4 py-3 rounded-xl border transition flex items-center gap-2 font-semibold text-sm ${
                  isWatchlisted
                    ? 'bg-red-600/30 border-red-500 text-red-400'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                <Bookmark className="w-4 h-4 fill-current" />
                <span>{isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-6 text-xs text-slate-400">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Popularity</p>
                <p className="font-bold text-slate-200">#{anime.popularity || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Rank</p>
                <p className="font-bold text-slate-200">#{anime.rank || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Members</p>
                <p className="font-bold text-slate-200">
                  {anime.members ? (anime.members / 1000).toFixed(0) + 'k' : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Synopsis & Genres */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-red-500" />
              Synopsis & Overview
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              {anime.synopsis || 'No synopsis provided for this anime.'}
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {anime.genres?.map((genre, idx) => (
                <span
                  key={`modal-g-${genre.mal_id}-${idx}`}
                  className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          </div>

          {/* Tabs: Episodes, Characters, Reviews */}
          <div className="border-t border-slate-800 pt-6">
            <div className="flex border-b border-slate-800 pb-2 gap-4 text-sm font-bold">
              <button
                onClick={() => setActiveTab('episodes')}
                className={`pb-2 transition flex items-center gap-2 border-b-2 ${
                  activeTab === 'episodes'
                    ? 'border-red-500 text-red-500'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Play className="w-4 h-4" />
                Episodes ({episodes.length || anime.episodes || 12})
              </button>

              <button
                onClick={() => setActiveTab('characters')}
                className={`pb-2 transition flex items-center gap-2 border-b-2 ${
                  activeTab === 'characters'
                    ? 'border-red-500 text-red-500'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                Cast & Characters
              </button>

              <button
                onClick={() => setActiveTab('comments')}
                className={`pb-2 transition flex items-center gap-2 border-b-2 ${
                  activeTab === 'comments'
                    ? 'border-red-500 text-red-500'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Community Comments ({comments.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="pt-6">
              {activeTab === 'episodes' && (
                <div className="space-y-4">
                  {loadingData ? (
                    <div className="p-8 text-center text-sm text-slate-400 animate-pulse">
                      Loading anime episode list...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-2">
                      {(episodes.length > 0
                        ? episodes
                        : Array.from({ length: anime.episodes || 12 }).map((_, i) => ({
                            mal_id: i + 1,
                            title: `Episode ${i + 1}`,
                          }))
                      ).map((ep, idx) => {
                        const epNum = ep.mal_id || idx + 1;
                        return (
                          <button
                            key={`modal-ep-${epNum}-${idx}`}
                            onClick={() => {
                              onStartWatch(anime, epNum);
                              onClose();
                            }}
                            className="p-3 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-red-500/50 rounded-xl text-left transition group flex items-center justify-between"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="text-[10px] font-bold text-red-400 uppercase">
                                EPISODE {epNum}
                              </span>
                              <h4 className="text-xs font-semibold text-white truncate group-hover:text-red-300">
                                {ep.title || `Episode ${epNum}`}
                              </h4>
                            </div>
                            <div className="p-2 rounded-full bg-slate-900 group-hover:bg-red-600 group-hover:text-white text-slate-400 transition shrink-0">
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'characters' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {characters.map((c, idx) => (
                    <div
                      key={`modal-char-${c.character.mal_id}-${idx}`}
                      className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3"
                    >
                      <img
                        src={c.character.images.jpg.image_url}
                        alt={c.character.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{c.character.name}</h4>
                        <p className="text-[10px] text-slate-400 capitalize">{c.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="space-y-6">
                  {/* Post Comment Form */}
                  <form onSubmit={handlePostComment} className="space-y-3">
                    <textarea
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={
                        user
                          ? `Leave a review or comment on ${anime.title}...`
                          : 'Please log in to join the conversation.'
                      }
                      disabled={!user}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 disabled:opacity-50"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">
                        {user ? `Posting as @${user.username}` : 'Log in required'}
                      </span>
                      <button
                        type="submit"
                        disabled={!user || !newComment.trim() || submittingComment}
                        className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Post Comment</span>
                      </button>
                    </div>
                  </form>

                  {/* List of Comments */}
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {comments.length > 0 ? (
                      comments.map((cmt) => (
                        <div
                          key={cmt.id}
                          className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1"
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-red-400">@{cmt.username}</span>
                            <span className="text-slate-500 text-[10px]">
                              {new Date(cmt.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed">{cmt.comment}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-xs text-slate-500 py-6">
                        No comments yet. Be the first to share your thoughts on this anime!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
