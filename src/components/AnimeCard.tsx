import React from 'react';
import { Anime } from '../types';
import { Play, Star, Bookmark, Plus } from 'lucide-react';

interface AnimeCardProps {
  anime: Anime;
  onSelect: (anime: Anime) => void;
  onStartWatch: (anime: Anime, episodeNum?: number) => void;
  onToggleWatchlist: (anime: Anime) => void;
  isWatchlisted: boolean;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({
  anime,
  onSelect,
  onStartWatch,
  onToggleWatchlist,
  isWatchlisted,
}) => {
  const imageUrl =
    anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80';

  return (
    <div className="group relative flex flex-col rounded-2xl bg-slate-900 border border-slate-800/80 overflow-hidden hover:border-red-500/50 hover:shadow-xl hover:shadow-red-950/20 transition-all duration-300">
      {/* Poster Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950 cursor-pointer" onClick={() => onSelect(anime)}>
        <img
          src={imageUrl}
          alt={anime.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
          <div className="flex justify-between items-start">
            <span className="px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-300 border border-slate-700 text-[10px] font-bold">
              {anime.type || 'TV'}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchlist(anime);
              }}
              className={`p-1.5 rounded-full border backdrop-blur-md transition ${
                isWatchlisted
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border-slate-700'
              }`}
              title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>

          <div className="flex justify-center my-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartWatch(anime, 1);
              }}
              className="p-3 bg-red-600 text-white rounded-full shadow-lg shadow-red-900/50 hover:scale-110 transition transform"
              title="Stream Ep 1"
            >
              <Play className="w-6 h-6 fill-white ml-0.5" />
            </button>
          </div>

          <div className="text-xs text-slate-300 space-y-1">
            <p className="line-clamp-2 text-[11px] text-slate-300">
              {anime.genres?.map((g) => g.name).slice(0, 3).join(' • ')}
            </p>
            <p className="text-[10px] text-red-400 font-semibold">Click for Details & Episodes</p>
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
          {anime.score && (
            <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1 shadow">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {anime.score.toFixed(1)}
            </span>
          )}
        </div>

        {/* Bottom Episode count badge */}
        <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
          <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-300 text-[10px] font-semibold">
            {anime.episodes ? `${anime.episodes} Eps` : 'Airing'}
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 flex-1 flex flex-col justify-between" onClick={() => onSelect(anime)}>
        <h3 className="font-bold text-sm text-slate-100 group-hover:text-red-400 line-clamp-1 transition cursor-pointer">
          {anime.title_english || anime.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
          <span>{anime.year || anime.status || 'Anime'}</span>
          <span className="text-slate-500">•</span>
          <span className="truncate max-w-[100px]">
            {anime.studios?.[0]?.name || 'Studio'}
          </span>
        </div>
      </div>
    </div>
  );
};
