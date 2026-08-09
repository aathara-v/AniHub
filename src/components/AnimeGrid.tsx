import React from 'react';
import { Anime } from '../types';
import { AnimeCard } from './AnimeCard';
import { Flame, SlidersHorizontal, ChevronRight, Layers } from 'lucide-react';

interface AnimeGridProps {
  title: string;
  subtitle?: string;
  animeList: Anime[];
  loading: boolean;
  onSelectAnime: (anime: Anime) => void;
  onStartWatch: (anime: Anime, episodeNum?: number) => void;
  onToggleWatchlist: (anime: Anime) => void;
  isWatchlisted: (animeId: number) => boolean;
  orderBy?: string;
  onOrderByChange?: (val: string) => void;
  typeFilter?: string | null;
  onTypeFilterChange?: (val: string | null) => void;
  statusFilter?: string | null;
  onStatusFilterChange?: (val: string | null) => void;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
}

export const AnimeGrid: React.FC<AnimeGridProps> = ({
  title,
  subtitle,
  animeList,
  loading,
  onSelectAnime,
  onStartWatch,
  onToggleWatchlist,
  isWatchlisted,
  orderBy,
  onOrderByChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  hasNextPage,
  onLoadMore,
}) => {
  return (
    <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 rounded-full bg-red-600" />
            <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-1 pl-4">{subtitle}</p>}
        </div>

        {/* Filter Controls if handler provided */}
        {(onOrderByChange || onTypeFilterChange || onStatusFilterChange) && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {onTypeFilterChange && (
              <select
                value={typeFilter || ''}
                onChange={(e) => onTypeFilterChange(e.target.value || null)}
                className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-500"
              >
                <option value="">All Types</option>
                <option value="tv">TV Series</option>
                <option value="movie">Movies</option>
                <option value="ova">OVA</option>
                <option value="special">Specials</option>
              </select>
            )}

            {onStatusFilterChange && (
              <select
                value={statusFilter || ''}
                onChange={(e) => onStatusFilterChange(e.target.value || null)}
                className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-500"
              >
                <option value="">All Status</option>
                <option value="airing">Currently Airing</option>
                <option value="complete">Completed</option>
                <option value="upcoming">Upcoming</option>
              </select>
            )}

            {onOrderByChange && (
              <select
                value={orderBy || 'popularity'}
                onChange={(e) => onOrderByChange(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-500 font-semibold text-red-400"
              >
                <option value="popularity">Most Popular</option>
                <option value="score">Highest Rated</option>
                <option value="title">Alphabetical</option>
                <option value="favorites">Most Favorited</option>
              </select>
            )}
          </div>
        )}
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] w-full rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800/40"
            />
          ))}
        </div>
      ) : animeList.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {animeList
              .filter((a, i, self) => a && a.mal_id && self.findIndex((x) => x.mal_id === a.mal_id) === i)
              .map((anime, idx) => (
                <AnimeCard
                  key={`grid-anime-${anime.mal_id}-${idx}`}
                  anime={anime}
                  onSelect={onSelectAnime}
                  onStartWatch={onStartWatch}
                  onToggleWatchlist={onToggleWatchlist}
                  isWatchlisted={isWatchlisted(anime.mal_id)}
                />
              ))}
          </div>

          {hasNextPage && onLoadMore && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={onLoadMore}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl border border-slate-800 hover:border-red-500/50 shadow-lg transition flex items-center gap-2 group"
              >
                <span>Load More Anime</span>
                <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition transform" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Anime Found</h3>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or search query.</p>
        </div>
      )}
    </section>
  );
};
