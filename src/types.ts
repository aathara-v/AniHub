export interface UserProfile {
  username: string;
  displayName: string;
  avatarUrl: string;
  createdAt: string;
}

export interface JikanImage {
  image_url: string;
  small_image_url?: string;
  large_image_url?: string;
}

export interface JikanTrailer {
  youtube_id: string | null;
  url: string | null;
  embed_url: string | null;
  images?: {
    image_url: string;
    small_image_url: string;
    medium_image_url: string;
    large_image_url: string;
    maximum_image_url: string;
  };
}

export interface JikanGenre {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface JikanStudio {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface Anime {
  mal_id: number;
  url: string;
  images: {
    jpg: JikanImage;
    webp?: JikanImage;
  };
  trailer: JikanTrailer;
  approved: boolean;
  titles: Array<{ type: string; title: string }>;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  type: string | null; // TV, Movie, OVA, Special, etc.
  source: string | null;
  episodes: number | null;
  status: string | null;
  airing: boolean;
  aired?: {
    string: string;
  };
  duration: string | null;
  rating: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  synopsis: string | null;
  background: string | null;
  season: string | null;
  year: number | null;
  studios: JikanStudio[];
  genres: JikanGenre[];
  explicit_genres?: JikanGenre[];
  themes?: JikanGenre[];
  demographics?: JikanGenre[];
}

export interface AnimeEpisode {
  mal_id: number;
  url?: string;
  title: string;
  title_japanese?: string;
  title_romanji?: string;
  aired?: string;
  score?: number;
  filler?: boolean;
  recap?: boolean;
  forum_url?: string;
}

export interface AnimeCharacter {
  character: {
    mal_id: number;
    url: string;
    images: {
      jpg: JikanImage;
      webp?: JikanImage;
    };
    name: string;
  };
  role: string;
  voice_actors?: Array<{
    person: {
      mal_id: number;
      name: string;
      images: {
        jpg: JikanImage;
      };
    };
    language: string;
  }>;
}

export interface WatchlistItem {
  id?: string;
  username: string;
  animeId: number;
  title: string;
  image: string;
  score: number;
  episodes: number;
  status: 'watching' | 'plan_to_watch' | 'completed' | 'dropped';
  rating?: number; // User personal score 1-10
  updatedAt: string;
}

export interface WatchHistoryItem {
  id?: string;
  username: string;
  animeId: number;
  animeTitle: string;
  animeImage: string;
  episodeNumber: number;
  episodeTitle: string;
  timestamp: number; // in seconds
  duration: number; // in seconds
  lastWatchedAt: string;
}

export interface AnimeComment {
  id?: string;
  username: string;
  animeId: number;
  episodeNumber?: number;
  comment: string;
  createdAt: string;
}

export interface VideoServerOption {
  id: string;
  name: string;
  quality: string;
  language: 'sub' | 'dub';
  url: string;
  type: 'mp4' | 'embed' | 'hls';
  provider?: string;
}

export interface AnimeFilterState {
  searchQuery: string;
  genreId: number | null;
  type: string | null; // TV, Movie, OVA
  status: string | null; // airing, complete
  orderBy: string; // popularity, score, title, favorite
  sort: 'asc' | 'desc';
}
