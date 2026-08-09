import React, { useState, useEffect } from 'react';
import { Anime } from '../types';
import { Play, Plus, Star, Tv, Info, Volume2, VolumeX, Sparkles, Film } from 'lucide-react';

interface HeroBannerProps {
  animeList: Anime[];
  onStartWatch: (anime: Anime, episodeNum?: number) => void;
  onOpenDetails: (anime: Anime) => void;
  onAddToWatchlist: (anime: Anime) => void;
  isInWatchlist: (animeId: number) => boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  animeList,
  onStartWatch,
  onOpenDetails,
  onAddToWatchlist,
  isInWatchlist,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  // Auto slide every 8 seconds
  useEffect(() => {
    if (!animeList.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(animeList.length, 5));
    }, 8000);
    return () => clearInterval(interval);
  }, [animeList]);

  if (!animeList || animeList.length === 0) return null;

  const currentAnime = animeList[currentIndex] || animeList[0];
  const bgImage = currentAnime.images.jpg.large_image_url || currentAnime.images.jpg.image_url;

  return (
    <div className="relative w-full h-[520px] sm:h-[600px] overflow-hidden bg-slate-950">
      {/* Background Image with Gradients */}
      <div className="absolute inset-0">
        <img
          src={bgImage}
          alt={currentAnime.title}
          className="w-full h-full object-cover object-center filter brightness-60 scale-105 transition-all duration-1000 ease-out"
        />
        {/* Dark Vignette and Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent w-full md:w-3/4" />
      </div>

      {/* Content Container */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-end pb-12 sm:pb-16 z-10">
        <div className="max-w-2xl space-y-4 animate-fade-in">
          {/* Tag Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 rounded-md bg-red-600 text-white shadow-md flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              #1 TRENDING
            </span>
            {currentAnime.score && (
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {currentAnime.score.toFixed(1)} MAL Score
              </span>
            )}
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/80">
              {currentAnime.type || 'TV'} • {currentAnime.episodes ? `${currentAnime.episodes} Episodes` : 'Ongoing'}
            </span>
            {currentAnime.rating && (
              <span className="px-2 py-0.5 rounded bg-slate-900/90 text-slate-400 border border-slate-800 text-[10px]">
                {currentAnime.rating.split(' ')[0]}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
            {currentAnime.title_english || currentAnime.title}
          </h1>

          {/* Genres pill list */}
          <div className="flex flex-wrap gap-2 pt-1">
            {currentAnime.genres?.map((genre, idx) => (
              <span
                key={`hero-genre-${genre.mal_id}-${idx}`}
                className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700/60"
              >
                {genre.name}
              </span>
            ))}
          </div>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed max-w-xl font-normal drop-shadow">
            {currentAnime.synopsis}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => onStartWatch(currentAnime, 1)}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-xl shadow-red-900/40 flex items-center gap-2 transition transform hover:scale-105"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Watch Episode 1</span>
            </button>

            {currentAnime.trailer?.embed_url && (
              <button
                onClick={() => setShowTrailerModal(true)}
                className="px-5 py-3 bg-slate-900/90 hover:bg-slate-800 text-white font-semibold border border-slate-700 rounded-xl backdrop-blur-sm flex items-center gap-2 transition"
              >
                <Film className="w-4 h-4 text-amber-400" />
                <span>Trailer</span>
              </button>
            )}

            <button
              onClick={() => onOpenDetails(currentAnime)}
              className="px-5 py-3 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold border border-slate-800 rounded-xl backdrop-blur-sm flex items-center gap-2 transition"
            >
              <Info className="w-4 h-4" />
              <span>Details</span>
            </button>

            <button
              onClick={() => onAddToWatchlist(currentAnime)}
              className={`p-3 rounded-xl border backdrop-blur-sm transition ${
                isInWatchlist(currentAnime.mal_id)
                  ? 'bg-red-600/30 border-red-500 text-red-400'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
              title={isInWatchlist(currentAnime.mal_id) ? 'Saved in Watchlist' : 'Add to Watchlist'}
            >
              <Plus className={`w-5 h-5 ${isInWatchlist(currentAnime.mal_id) ? 'rotate-45' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel Dots */}
      <div className="absolute bottom-4 right-6 sm:right-12 z-20 flex items-center gap-2 bg-slate-950/60 p-2 rounded-full border border-slate-800/80 backdrop-blur-md">
        {animeList.slice(0, 5).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-6 bg-red-500' : 'w-2 bg-slate-600 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>

      {/* Trailer Embed Modal */}
      {showTrailerModal && currentAnime.trailer?.embed_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
            <button
              onClick={() => setShowTrailerModal(false)}
              className="absolute top-3 right-3 z-20 p-2 text-white bg-slate-900/80 hover:bg-red-600 rounded-full transition"
            >
              ✕
            </button>
            <iframe
              src={currentAnime.trailer.embed_url}
              title={`${currentAnime.title} Trailer`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};
