import React, { useState, useEffect } from 'react';
import { UserProfile, Anime } from './types';
import {
  getTopAnime,
  getCurrentSeasonAnime,
  getUpcomingAnime,
  searchAnime,
} from './lib/jikan';
import { getUserWatchlist, saveUserWatchlist, removeFromWatchlist } from './lib/firebase';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { AnimeGrid } from './components/AnimeGrid';
import { AnimeDetailModal } from './components/AnimeDetailModal';
import { VideoPlayerView } from './components/VideoPlayerView';
import { AuthModal } from './components/AuthModal';
import { WatchlistPage } from './components/WatchlistPage';
import { HistoryPage } from './components/HistoryPage';
import { GeminiAnimeBot } from './components/GeminiAnimeBot';

export default function App() {
  // User Session State (stored locally & synced with Firestore)
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('ani_hub_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);

  // Content Data States
  const [topPopular, setTopPopular] = useState<Anime[]>([]);
  const [currentSeason, setCurrentSeason] = useState<Anime[]>([]);
  const [upcoming, setUpcoming] = useState<Anime[]>([]);
  const [browseAnime, setBrowseAnime] = useState<Anime[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);

  // Filter States
  const [orderBy, setOrderBy] = useState<string>('popularity');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [browsePage, setBrowsePage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Modals & Views State
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [playingState, setPlayingState] = useState<{ anime: Anime; episodeNumber: number } | null>(
    null
  );
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'register',
  });
  const [aiBotOpen, setAiBotOpen] = useState(false);

  // User Watchlist IDs for instant toggle UI
  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(new Set());

  // Save session when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('ani_hub_user', JSON.stringify(user));
      // Load user's watchlist
      getUserWatchlist(user.username)
        .then((items) => {
          setWatchlistIds(new Set(items.map((i) => i.animeId)));
        })
        .catch(console.error);
    } else {
      localStorage.removeItem('ani_hub_user');
      setWatchlistIds(new Set());
    }
  }, [user]);

  // Load Initial Home Data
  useEffect(() => {
    Promise.all([
      getTopAnime(24, 'bypopularity'),
      getCurrentSeasonAnime(24),
      getUpcomingAnime(12),
    ])
      .then(([top, season, up]) => {
        setTopPopular(top);
        setCurrentSeason(season);
        setUpcoming(up);
      })
      .catch(console.error);
  }, []);

  // Fetch Browse / Filtered Anime when tab or filters change
  useEffect(() => {
    if (activeTab === 'home') return;

    setBrowseLoading(true);
    let isMounted = true;

    if (activeTab === 'trending') {
      getTopAnime(24, 'bypopularity')
        .then((res) => {
          if (isMounted) setBrowseAnime(res);
        })
        .finally(() => {
          if (isMounted) setBrowseLoading(false);
        });
    } else if (activeTab === 'seasonal') {
      getCurrentSeasonAnime(24)
        .then((res) => {
          if (isMounted) setBrowseAnime(res);
        })
        .finally(() => {
          if (isMounted) setBrowseLoading(false);
        });
    } else {
      // Browse or Genre filter mode
      searchAnime('', selectedGenre, typeFilter, statusFilter, orderBy, 'desc', browsePage)
        .then(({ data, hasNextPage }) => {
          if (isMounted) {
            setBrowseAnime(data);
            setHasNextPage(hasNextPage);
          }
        })
        .finally(() => {
          if (isMounted) setBrowseLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedGenre, typeFilter, statusFilter, orderBy, browsePage]);

  // Watchlist Toggle Handler
  const handleToggleWatchlist = async (anime: Anime) => {
    if (!user) {
      setAuthModal({ isOpen: true, mode: 'login' });
      return;
    }

    const exists = watchlistIds.has(anime.mal_id);
    const newSet = new Set(watchlistIds);

    if (exists) {
      newSet.delete(anime.mal_id);
      setWatchlistIds(newSet);
      await removeFromWatchlist(user.username, anime.mal_id);
    } else {
      newSet.add(anime.mal_id);
      setWatchlistIds(newSet);
      await saveUserWatchlist(user.username, {
        animeId: anime.mal_id,
        title: anime.title_english || anime.title,
        image: anime.images.jpg.image_url,
        score: anime.score || 0,
        episodes: anime.episodes || 12,
        status: 'watching',
      });
    }
  };

  // Launch Streaming Player View
  const handleStartWatch = (anime: Anime, episodeNum = 1) => {
    if (!user) {
      setAuthModal({ isOpen: true, mode: 'login' });
      return;
    }
    setPlayingState({ anime, episodeNumber: episodeNum });
  };

  // Trigger search from AI recommendation
  const handleAiSelectAnimeTitle = async (title: string) => {
    setBrowseLoading(true);
    setActiveTab('browse');
    setSelectedGenre(null);
    try {
      const res = await searchAnime(title);
      if (res.data.length > 0) {
        setSelectedAnime(res.data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBrowseLoading(false);
    }
  };

  // If Streaming Video Player View is Active, render full-screen video player experience
  if (playingState) {
    return (
      <VideoPlayerView
        anime={playingState.anime}
        episodeNumber={playingState.episodeNumber}
        onClose={() => setPlayingState(null)}
        onSelectEpisode={(epNum) =>
          setPlayingState({ anime: playingState.anime, episodeNumber: epNum })
        }
        user={user}
        onToggleWatchlist={handleToggleWatchlist}
        isWatchlisted={watchlistIds.has(playingState.anime.mal_id)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Header Navigation */}
      <Navbar
        user={user}
        onOpenAuth={(mode) => setAuthModal({ isOpen: true, mode })}
        onLogout={() => setUser(null)}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedGenre(null);
        }}
        onSelectAnime={(anime) => setSelectedAnime(anime)}
        selectedGenre={selectedGenre}
        onSelectGenre={(gId) => {
          setSelectedGenre(gId);
          setActiveTab('browse');
        }}
        onOpenAiBot={() => setAiBotOpen(true)}
      />

      {/* Main App Content View */}
      <main className="flex-1 pb-16">
        {activeTab === 'home' && !selectedGenre ? (
          <>
            {/* Hero Banner Carousel */}
            <HeroBanner
              animeList={topPopular}
              onStartWatch={handleStartWatch}
              onOpenDetails={(anime) => setSelectedAnime(anime)}
              onAddToWatchlist={handleToggleWatchlist}
              isInWatchlist={(id) => watchlistIds.has(id)}
            />

            {/* Top Trending Popular Section */}
            <AnimeGrid
              title="Top Trending Anime"
              subtitle="Most popular streaming titles currently on Ani Hub"
              animeList={topPopular.slice(0, 12)}
              loading={topPopular.length === 0}
              onSelectAnime={(anime) => setSelectedAnime(anime)}
              onStartWatch={handleStartWatch}
              onToggleWatchlist={handleToggleWatchlist}
              isWatchlisted={(id) => watchlistIds.has(id)}
            />

            {/* Seasonal Airing Anime */}
            <AnimeGrid
              title="Current Season Releases"
              subtitle="Fresh episodes airing this season"
              animeList={currentSeason.slice(0, 12)}
              loading={currentSeason.length === 0}
              onSelectAnime={(anime) => setSelectedAnime(anime)}
              onStartWatch={handleStartWatch}
              onToggleWatchlist={handleToggleWatchlist}
              isWatchlisted={(id) => watchlistIds.has(id)}
            />

            {/* Upcoming Anime */}
            <AnimeGrid
              title="Upcoming Releases"
              subtitle="Anticipated upcoming anime series and movies"
              animeList={upcoming}
              loading={upcoming.length === 0}
              onSelectAnime={(anime) => setSelectedAnime(anime)}
              onStartWatch={handleStartWatch}
              onToggleWatchlist={handleToggleWatchlist}
              isWatchlisted={(id) => watchlistIds.has(id)}
            />
          </>
        ) : activeTab === 'watchlist' ? (
          <WatchlistPage
            user={user}
            onStartWatch={(animeId, ep) => {
              const found =
                topPopular.find((a) => a.mal_id === animeId) ||
                currentSeason.find((a) => a.mal_id === animeId) ||
                browseAnime.find((a) => a.mal_id === animeId);
              if (found) {
                handleStartWatch(found, ep);
              }
            }}
            onOpenAuth={(mode) => setAuthModal({ isOpen: true, mode })}
          />
        ) : activeTab === 'history' ? (
          <HistoryPage
            user={user}
            onStartWatch={(animeId, ep) => {
              const found =
                topPopular.find((a) => a.mal_id === animeId) ||
                currentSeason.find((a) => a.mal_id === animeId) ||
                browseAnime.find((a) => a.mal_id === animeId);
              if (found) {
                handleStartWatch(found, ep);
              }
            }}
            onOpenAuth={(mode) => setAuthModal({ isOpen: true, mode })}
          />
        ) : (
          /* Browse / Filtered View */
          <AnimeGrid
            title={
              selectedGenre
                ? 'Filtered by Genre'
                : activeTab === 'trending'
                ? 'Top Rated Anime'
                : activeTab === 'seasonal'
                ? 'Seasonal Airing Anime'
                : 'Browse Anime Catalog'
            }
            subtitle="Explore and filter Jikan anime metadata"
            animeList={browseAnime}
            loading={browseLoading}
            onSelectAnime={(anime) => setSelectedAnime(anime)}
            onStartWatch={handleStartWatch}
            onToggleWatchlist={handleToggleWatchlist}
            isWatchlisted={(id) => watchlistIds.has(id)}
            orderBy={orderBy}
            onOrderByChange={setOrderBy}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            hasNextPage={hasNextPage}
            onLoadMore={() => setBrowsePage((p) => p + 1)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-8 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <p className="font-bold text-slate-300">Ani Hub — Streaming Anime Platform</p>
            <p className="text-[11px] mt-0.5">Powered by Jikan REST API & Firestore Database.</p>
          </div>
          <p>© 2026 Ani Hub. Custom Firestore user accounts enabled.</p>
        </div>
      </footer>

      {/* Anime Detail Modal */}
      <AnimeDetailModal
        anime={selectedAnime}
        isOpen={Boolean(selectedAnime)}
        onClose={() => setSelectedAnime(null)}
        onStartWatch={handleStartWatch}
        onToggleWatchlist={handleToggleWatchlist}
        isWatchlisted={selectedAnime ? watchlistIds.has(selectedAnime.mal_id) : false}
        user={user}
        onOpenAuth={(mode) => setAuthModal({ isOpen: true, mode })}
      />

      {/* Auth Login / Register Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        onSuccess={(newUser) => setUser(newUser)}
        initialMode={authModal.mode}
      />

      {/* Gemini AI Anime Bot Drawer */}
      <GeminiAnimeBot
        isOpen={aiBotOpen}
        onClose={() => setAiBotOpen(false)}
        onSelectAnimeTitle={handleAiSelectAnimeTitle}
      />
    </div>
  );
}
