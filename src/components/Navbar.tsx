import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Anime, JikanGenre } from '../types';
import { searchAnime, getAnimeGenres } from '../lib/jikan';
import {
  Play,
  Search,
  Bookmark,
  History,
  Bot,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  Flame,
  Calendar,
  Layers,
  X,
  Menu,
} from 'lucide-react';

interface NavbarProps {
  user: UserProfile | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSelectAnime: (anime: Anime) => void;
  selectedGenre: number | null;
  onSelectGenre: (genreId: number | null) => void;
  onOpenAiBot: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuth,
  onLogout,
  activeTab,
  setActiveTab,
  onSelectAnime,
  selectedGenre,
  onSelectGenre,
  onOpenAiBot,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [genres, setGenres] = useState<JikanGenre[]>([]);
  const [showGenreMenu, setShowGenreMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAnimeGenres().then((data) => setGenres(data));
  }, []);

  // Debounced search autocomplete
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchAnime(searchQuery);
        setSuggestions(res.data.slice(0, 6));
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-8 shrink-0">
            <button
              onClick={() => {
                setActiveTab('home');
                onSelectGenre(null);
              }}
              className="flex items-center gap-2 group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-red-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-red-900/30 group-hover:scale-105 transition">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-extrabold tracking-wider text-white">
                    ANI<span className="text-red-500">HUB</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    HD
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Anime Streaming Platform</p>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
              <button
                onClick={() => {
                  setActiveTab('home');
                  onSelectGenre(null);
                }}
                className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'home' && !selectedGenre
                    ? 'text-white bg-red-600/20 text-red-400 border border-red-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Flame className="w-4 h-4 text-red-500" />
                Home
              </button>

              <button
                onClick={() => {
                  setActiveTab('trending');
                  onSelectGenre(null);
                }}
                className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'trending'
                    ? 'text-white bg-red-600/20 text-red-400 border border-red-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                Top Rated
              </button>

              <button
                onClick={() => {
                  setActiveTab('seasonal');
                  onSelectGenre(null);
                }}
                className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'seasonal'
                    ? 'text-white bg-red-600/20 text-red-400 border border-red-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Calendar className="w-4 h-4 text-indigo-400" />
                Seasonal
              </button>

              {/* Genres Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowGenreMenu(!showGenreMenu)}
                  className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                    selectedGenre
                      ? 'text-white bg-red-600/20 text-red-400 border border-red-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Layers className="w-4 h-4 text-teal-400" />
                  Genres
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {showGenreMenu && (
                  <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl grid grid-cols-2 gap-1 z-50 animate-fade-in">
                    {genres.map((g, idx) => (
                      <button
                        key={`nav-genre-${g.mal_id}-${idx}`}
                        onClick={() => {
                          onSelectGenre(g.mal_id);
                          setActiveTab('browse');
                          setShowGenreMenu(false);
                        }}
                        className={`text-left px-2.5 py-1.5 text-xs font-medium rounded-lg transition ${
                          selectedGenre === g.mal_id
                            ? 'bg-red-600 text-white'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Search Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowSearchDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                placeholder="Search anime title, genre, studio..."
                className="w-full pl-10 pr-8 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search Suggestions Dropdown */}
            {showSearchDropdown && (searchQuery.trim().length >= 2 || suggestions.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    Searching Jikan Anime Database...
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
                    {suggestions.map((anime, idx) => (
                      <button
                        key={`nav-sug-${anime.mal_id}-${idx}`}
                        onClick={() => {
                          onSelectAnime(anime);
                          setShowSearchDropdown(false);
                          setSearchQuery('');
                        }}
                        className="w-full p-2.5 flex items-center gap-3 text-left hover:bg-slate-800/80 transition group"
                      >
                        <img
                          src={anime.images.jpg.image_url}
                          alt={anime.title}
                          className="w-10 h-14 object-cover rounded-md shrink-0 shadow"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate group-hover:text-red-400 transition">
                            {anime.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                            <span className="text-amber-400 font-bold">
                              ★ {anime.score ? anime.score.toFixed(1) : 'N/A'}
                            </span>
                            <span>•</span>
                            <span>{anime.type || 'TV'}</span>
                            <span>•</span>
                            <span>{anime.episodes ? `${anime.episodes} Eps` : 'Airing'}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No anime found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* AI Assistant Button */}
            <button
              onClick={onOpenAiBot}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-500/40 hover:border-purple-400 text-purple-300 hover:text-white rounded-xl text-xs font-semibold transition shadow"
            >
              <Bot className="w-4 h-4 text-purple-400" />
              <span>AniBot AI</span>
            </button>

            {/* Watchlist Quick Tab */}
            {user && (
              <button
                onClick={() => setActiveTab('watchlist')}
                className={`p-2 rounded-xl transition ${
                  activeTab === 'watchlist'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="My Watchlist"
              >
                <Bookmark className="w-5 h-5" />
              </button>
            )}

            {/* History Quick Tab */}
            {user && (
              <button
                onClick={() => setActiveTab('history')}
                className={`p-2 rounded-xl transition ${
                  activeTab === 'history'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="Watch History"
              >
                <History className="w-5 h-5" />
              </button>
            )}

            {/* User Profile / Auth State */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 p-1.5 pl-3 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
                >
                  <span className="text-xs font-bold text-white max-w-[100px] truncate">
                    {user.displayName || user.username}
                  </span>
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-red-500/50"
                  />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 p-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 animate-fade-in">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-xs text-slate-400">Logged in as</p>
                      <p className="text-sm font-bold text-white truncate">@{user.username}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setActiveTab('watchlist');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition"
                      >
                        <Bookmark className="w-4 h-4 text-red-400" />
                        My Watchlist
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('history');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition"
                      >
                        <History className="w-4 h-4 text-indigo-400" />
                        Watch History
                      </button>
                    </div>

                    <div className="pt-1 border-t border-slate-800">
                      <button
                        onClick={() => {
                          onLogout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-950/50 hover:text-red-300 rounded-lg transition font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  Log In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-900/30 transition transform hover:-translate-y-0.5"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800 space-y-2 animate-fade-in">
            <button
              onClick={() => {
                setActiveTab('home');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg"
            >
              <Flame className="w-4 h-4 text-red-500" />
              Home
            </button>
            <button
              onClick={() => {
                setActiveTab('trending');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Top Rated
            </button>
            <button
              onClick={() => {
                setActiveTab('seasonal');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg"
            >
              <Calendar className="w-4 h-4 text-indigo-400" />
              Seasonal
            </button>
            <button
              onClick={() => {
                onOpenAiBot();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-purple-400 hover:bg-slate-900 rounded-lg"
            >
              <Bot className="w-4 h-4" />
              AniBot AI Recommendations
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
