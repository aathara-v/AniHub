import React, { useState, useEffect, useRef } from 'react';
import { Anime, UserProfile, VideoServerOption } from '../types';
import { fetchAnimeStreamingServers, getEpisodeServers, SAMPLE_SUBTITLES } from '../lib/streaming';
import { getAnimeEpisodes } from '../lib/jikan';
import { saveWatchProgress } from '../lib/firebase';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  RotateCcw,
  SkipForward,
  SkipBack,
  Bookmark,
  Moon,
  Sun,
  Tv,
  List,
  Sparkles,
  Check,
} from 'lucide-react';

interface VideoPlayerViewProps {
  anime: Anime;
  episodeNumber: number;
  onClose: () => void;
  onSelectEpisode: (epNum: number) => void;
  user: UserProfile | null;
  onToggleWatchlist: (anime: Anime) => void;
  isWatchlisted: boolean;
}

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({
  anime,
  episodeNumber,
  onClose,
  onSelectEpisode,
  user,
  onToggleWatchlist,
  isWatchlisted,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedProvider, setSelectedProvider] = useState<'all' | 'consumet' | 'vidlink' | 'vidsrc' | 'anihub'>('all');
  const [servers, setServers] = useState<VideoServerOption[]>([]);
  const [currentServer, setCurrentServer] = useState<VideoServerOption | null>(null);

  const filteredServers = servers.filter((s) => {
    if (selectedProvider === 'all') return true;
    if (selectedProvider === 'consumet') return s.provider?.toLowerCase().includes('consumet') || s.id.startsWith('consumet');
    if (selectedProvider === 'vidlink') return s.provider?.toLowerCase().includes('vidlink') || s.id.startsWith('vidlink');
    if (selectedProvider === 'vidsrc') return s.provider?.toLowerCase().includes('vidsrc') || s.provider?.toLowerCase().includes('2embed') || s.provider?.toLowerCase().includes('autoembed');
    if (selectedProvider === 'anihub') return s.provider?.toLowerCase().includes('anihub') || s.type === 'mp4';
    return true;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLightsOff, setIsLightsOff] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [episodesList, setEpisodesList] = useState<{ number: number; title: string }[]>([]);

  // Load Servers & Episodes
  useEffect(() => {
    let isMounted = true;

    // Immediately load fallback servers so UI has instant response
    const initialFallback = getEpisodeServers(
      anime.mal_id,
      episodeNumber,
      anime.trailer?.embed_url
    );
    setServers(initialFallback);
    setCurrentServer(initialFallback[0]);

    // Fetch real API streaming servers
    fetchAnimeStreamingServers(
      anime.mal_id,
      episodeNumber,
      anime.title_english || anime.title,
      anime.trailer?.embed_url
    )
      .then((realServers) => {
        if (isMounted && realServers && realServers.length > 0) {
          setServers(realServers);
          setCurrentServer(realServers[0]);
        }
      })
      .catch((err) => console.error('Error loading streaming servers:', err));

    getAnimeEpisodes(anime.mal_id)
      .then((eps) => {
        if (!isMounted) return;
        if (eps && eps.length > 0) {
          setEpisodesList(
            eps.map((e, idx) => ({
              number: e.mal_id || idx + 1,
              title: e.title || `Episode ${idx + 1}`,
            }))
          );
        } else {
          setEpisodesList(
            Array.from({ length: anime.episodes || 12 }).map((_, i) => ({
              number: i + 1,
              title: `Episode ${i + 1}`,
            }))
          );
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setEpisodesList(
          Array.from({ length: anime.episodes || 12 }).map((_, i) => ({
            number: i + 1,
            title: `Episode ${i + 1}`,
          }))
        );
      });

    return () => {
      isMounted = false;
    };
  }, [anime, episodeNumber]);

  // Video Events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);

      // Periodically sync progress to Firestore
      if (user && Math.floor(video.currentTime) % 5 === 0 && video.duration > 0) {
        saveWatchProgress(user.username, {
          animeId: anime.mal_id,
          animeTitle: anime.title_english || anime.title,
          animeImage: anime.images.jpg.image_url,
          episodeNumber,
          episodeTitle: `Episode ${episodeNumber}`,
          timestamp: video.currentTime,
          duration: video.duration,
        }).catch(console.error);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (autoPlayNext) {
        const nextEp = episodeNumber + 1;
        const totalEps = anime.episodes || episodesList.length || 12;
        if (nextEp <= totalEps) {
          onSelectEpisode(nextEp);
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [user, anime, episodeNumber, autoPlayNext, episodesList]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuteState = !isMuted;
    videoRef.current.muted = newMuteState;
    setIsMuted(newMuteState);
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentEpData = episodesList.find((e) => e.number === episodeNumber);

  return (
    <div
      className={`min-h-screen bg-slate-950 text-white transition-colors duration-500 ${
        isLightsOff ? 'bg-black opacity-95' : ''
      }`}
    >
      {/* Top Header Controls */}
      <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800/80 px-4 py-3 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-bold border border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Browse</span>
          </button>

          <div className="hidden sm:block border-l border-slate-800 pl-3">
            <h2 className="text-sm font-bold text-white line-clamp-1">
              {anime.title_english || anime.title}
            </h2>
            <p className="text-xs text-red-400 font-semibold">
              Episode {episodeNumber} : {currentEpData?.title || `Episode ${episodeNumber}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setIsLightsOff(!isLightsOff)}
            className={`p-2 rounded-xl border transition flex items-center gap-1.5 font-semibold ${
              isLightsOff
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
            title="Lights Off Mode"
          >
            {isLightsOff ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden md:inline">{isLightsOff ? 'Lights On' : 'Lights Off'}</span>
          </button>

          <button
            onClick={() => onToggleWatchlist(anime)}
            className={`p-2 rounded-xl border transition ${
              isWatchlisted
                ? 'bg-red-600 text-white border-red-500'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
            title="Bookmark Anime"
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        </div>
      </header>

      {/* Main Streaming Layout */}
      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Video Area (3 cols) */}
        <div className={`space-y-4 ${isTheaterMode ? 'lg:col-span-4' : 'lg:col-span-3'}`}>
          {/* Server & Provider Selector Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-3 text-xs shadow-lg">
            {/* Top Row: Provider Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Tv className="w-4 h-4 text-red-500" />
                STREAM PROVIDER:
              </span>

              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setSelectedProvider('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    selectedProvider === 'all'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  All Servers ({servers.length})
                </button>

                <button
                  onClick={() => setSelectedProvider('consumet')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                    selectedProvider === 'consumet'
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                      : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Consumet API</span>
                </button>

                <button
                  onClick={() => setSelectedProvider('vidlink')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    selectedProvider === 'vidlink'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  VidLink HD
                </button>

                <button
                  onClick={() => setSelectedProvider('vidsrc')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    selectedProvider === 'vidsrc'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  VidSrc / 2Embed
                </button>

                <button
                  onClick={() => setSelectedProvider('anihub')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    selectedProvider === 'anihub'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Direct MP4 Backup
                </button>
              </div>
            </div>

            {/* Bottom Row: Individual Server Buttons */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Available Servers:</span>
              {filteredServers.length > 0 ? (
                filteredServers.map((srv) => (
                  <button
                    key={srv.id}
                    onClick={() => setCurrentServer(srv)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      currentServer?.id === srv.id
                        ? 'bg-red-600 text-white shadow-md ring-2 ring-red-500/50'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800/80'
                    }`}
                  >
                    {srv.provider?.toLowerCase().includes('consumet') && (
                      <span className="text-[9px] px-1 py-0.2 rounded font-extrabold bg-amber-500 text-slate-950 uppercase">
                        Consumet
                      </span>
                    )}
                    <span>{srv.name}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-black/40 text-slate-300">
                      {srv.quality}
                    </span>
                    {srv.language === 'dub' && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        DUB
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <p className="text-slate-400 italic text-xs">No servers found for this provider category.</p>
              )}
            </div>

            {/* Consumet Banner Info if Consumet Server active */}
            {currentServer?.provider?.toLowerCase().includes('consumet') && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2 px-3 text-[11px] text-amber-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Currently playing via <strong>Consumet API</strong> ({currentServer.name}). High-speed multi-mirror stream.
                  </span>
                </div>
                <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded font-mono font-bold text-amber-200 uppercase shrink-0">
                  {currentServer.language === 'dub' ? 'English Dubbed' : 'Japanese Subbed'}
                </span>
              </div>
            )}
          </div>

          {/* Video Player Box */}
          <div
            ref={containerRef}
            className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group"
          >
            {currentServer?.type === 'embed' ? (
              <iframe
                src={currentServer.url}
                title="Anime Video Stream"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={currentServer?.url}
                  poster={anime.images.jpg.large_image_url}
                  onClick={togglePlay}
                  className="w-full h-full object-contain cursor-pointer"
                  autoPlay
                >
                  {SAMPLE_SUBTITLES.map((sub, i) => (
                    <track
                      key={i}
                      kind="subtitles"
                      srcLang={sub.srclang}
                      label={sub.label}
                      default={sub.default}
                    />
                  ))}
                </video>

                {/* Custom Overlay Controls */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
                  {/* Progress Bar */}
                  <div className="relative flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-none"
                    />
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                    <div className="flex items-center gap-3">
                      <button onClick={togglePlay} className="p-1.5 hover:text-red-500 transition">
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                      </button>

                      <button
                        onClick={() => {
                          if (episodeNumber > 1) onSelectEpisode(episodeNumber - 1);
                        }}
                        disabled={episodeNumber <= 1}
                        className="p-1.5 hover:text-red-400 disabled:opacity-30"
                        title="Previous Episode"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          const total = anime.episodes || episodesList.length || 12;
                          if (episodeNumber < total) onSelectEpisode(episodeNumber + 1);
                        }}
                        className="p-1.5 hover:text-red-400"
                        title="Next Episode"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>

                      {/* Volume */}
                      <div className="flex items-center gap-1.5 group/vol">
                        <button onClick={toggleMute} className="hover:text-red-400">
                          {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                      </div>

                      <span className="text-slate-400 text-[11px]">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Playback Speed Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-700 hover:text-white text-[11px]"
                        >
                          {playbackSpeed}x
                        </button>
                        {showSpeedMenu && (
                          <div className="absolute bottom-full right-0 mb-2 p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-xl flex flex-col gap-1 z-50">
                            {[0.5, 1, 1.25, 1.5, 2].map((s) => (
                              <button
                                key={s}
                                onClick={() => changeSpeed(s)}
                                className={`px-3 py-1 rounded text-[11px] text-left hover:bg-slate-800 ${
                                  playbackSpeed === s ? 'text-red-400 font-bold' : 'text-slate-300'
                                }`}
                              >
                                {s}x
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Theater Mode */}
                      <button
                        onClick={() => setIsTheaterMode(!isTheaterMode)}
                        className="hover:text-red-400 text-xs"
                        title="Toggle Theater Mode"
                      >
                        Theater
                      </button>

                      {/* Fullscreen */}
                      <button onClick={toggleFullscreen} className="p-1.5 hover:text-red-400">
                        <Maximize className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Episode Navigation Bar below player */}
          <div className="flex flex-wrap items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <span className="text-xs font-bold text-red-500 uppercase">Now Playing</span>
              <h3 className="text-base font-bold text-white">
                Episode {episodeNumber} : {currentEpData?.title || `Episode ${episodeNumber}`}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPlayNext}
                  onChange={(e) => setAutoPlayNext(e.target.checked)}
                  className="rounded border-slate-700 text-red-600 focus:ring-0"
                />
                <span>Autoplay Next Episode</span>
              </label>

              <button
                onClick={() => {
                  const total = anime.episodes || episodesList.length || 12;
                  if (episodeNumber < total) onSelectEpisode(episodeNumber + 1);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
              >
                <span>Next Episode</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Episode List Sidebar (1 col) */}
        {!isTheaterMode && (
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <List className="w-4 h-4 text-red-500" />
                EPISODES LIST
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400">
                {episodesList.length} Episodes
              </span>
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {episodesList.map((ep) => {
                const isCurrent = ep.number === episodeNumber;
                return (
                  <button
                    key={ep.number}
                    onClick={() => onSelectEpisode(ep.number)}
                    className={`w-full p-2.5 rounded-xl text-left border transition flex items-center justify-between group ${
                      isCurrent
                        ? 'bg-red-600/20 border-red-500/60 text-white font-bold'
                        : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <span
                        className={`text-[10px] font-bold block ${
                          isCurrent ? 'text-red-400' : 'text-slate-500'
                        }`}
                      >
                        EPISODE {ep.number}
                      </span>
                      <p className="text-xs truncate">{ep.title}</p>
                    </div>
                    {isCurrent ? (
                      <span className="p-1 rounded-full bg-red-600 text-white shrink-0">
                        <Play className="w-3 h-3 fill-white" />
                      </span>
                    ) : (
                      <Play className="w-3.5 h-3.5 text-slate-600 group-hover:text-red-400 transition shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
