import { Anime, AnimeCharacter, AnimeEpisode, JikanGenre } from '../types';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

/**
 * Deduplicate an array of Anime objects by their mal_id
 */
export function dedupeAnimeList(list: Anime[]): Anime[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<number>();
  return list.filter((item) => {
    if (!item || !item.mal_id) return false;
    if (seen.has(item.mal_id)) return false;
    seen.add(item.mal_id);
    return true;
  });
}

// In-memory & sessionStorage cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

// Sequential Request Queue Promise chain
let requestQueue: Promise<any> = Promise.resolve();

function enqueueRequest<T>(task: () => Promise<T>): Promise<T> {
  const next = requestQueue.then(async () => {
    await new Promise((resolve) => setTimeout(resolve, 450));
    return task();
  });
  // Catch error in chain so queue doesn't lock up
  requestQueue = next.catch(() => {});
  return next;
}

async function fetchJikan<T>(endpoint: string, isFullJson = false): Promise<T> {
  const cacheKey = `jikan_${endpoint}`;

  // Check in-memory cache
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
  }

  // Check sessionStorage
  try {
    const saved = sessionStorage.getItem(cacheKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        cache.set(cacheKey, parsed);
        return parsed.data as T;
      }
    }
  } catch (e) {
    // Ignore storage errors
  }

  return enqueueRequest(async () => {
    let retries = 3;
    let delay = 1200;

    while (retries >= 0) {
      try {
        const response = await fetch(`${JIKAN_BASE_URL}${endpoint}`);
        if (response.status === 429) {
          if (retries === 0) {
            console.warn(`Jikan API 429 rate limit reached for ${endpoint}.`);
            break;
          }
          await new Promise((r) => setTimeout(r, delay));
          delay *= 1.8;
          retries--;
          continue;
        }

        if (!response.ok) {
          throw new Error(`Jikan HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        const payload = isFullJson ? json : json.data;

        cache.set(cacheKey, { data: payload, timestamp: Date.now() });
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ data: payload, timestamp: Date.now() }));
        } catch (e) {
          // ignore storage full
        }

        return payload as T;
      } catch (err) {
        if (retries === 0) {
          console.warn(`Error fetching ${endpoint} from Jikan API:`, err);
          break;
        }
        await new Promise((r) => setTimeout(r, delay));
        delay *= 1.8;
        retries--;
      }
    }

    // Return stale cache if available
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!.data as T;
    }

    throw new Error(`Failed to fetch ${endpoint}`);
  });
}

/**
 * Fetch Top Anime (Popular / Airing)
 */
export async function getTopAnime(limit = 24, filter: 'bypopularity' | 'airing' | 'favorite' = 'bypopularity'): Promise<Anime[]> {
  try {
    const res = await fetchJikan<Anime[]>(`/top/anime?filter=${filter}&limit=${limit}`);
    return dedupeAnimeList(res || []);
  } catch (err) {
    console.warn('Using fallback data for top anime due to rate limits');
    return dedupeAnimeList(FALLBACK_ANIME_LIST);
  }
}

/**
 * Fetch Current Season Anime
 */
export async function getCurrentSeasonAnime(limit = 24): Promise<Anime[]> {
  try {
    const res = await fetchJikan<Anime[]>(`/seasons/now?limit=${limit}`);
    return dedupeAnimeList(res || []);
  } catch (err) {
    return dedupeAnimeList(FALLBACK_ANIME_LIST);
  }
}

/**
 * Fetch Upcoming Season Anime
 */
export async function getUpcomingAnime(limit = 12): Promise<Anime[]> {
  try {
    const res = await fetchJikan<Anime[]>(`/seasons/upcoming?limit=${limit}`);
    return dedupeAnimeList(res || []);
  } catch (err) {
    return dedupeAnimeList(FALLBACK_ANIME_LIST.slice(0, 6));
  }
}

/**
 * Fetch Anime Genres list
 */
export async function getAnimeGenres(): Promise<JikanGenre[]> {
  try {
    const res = await fetchJikan<JikanGenre[]>('/genres/anime');
    return res || FALLBACK_GENRES;
  } catch (err) {
    return FALLBACK_GENRES;
  }
}

/**
 * Search Anime with filter options
 */
export async function searchAnime(
  queryStr = '',
  genreId?: number | null,
  type?: string | null,
  status?: string | null,
  orderBy = 'popularity',
  sort: 'asc' | 'desc' = 'desc',
  page = 1
): Promise<{ data: Anime[]; hasNextPage: boolean }> {
  try {
    let endpoint = `/anime?sfw=true&page=${page}&limit=24`;
    if (queryStr.trim()) endpoint += `&q=${encodeURIComponent(queryStr.trim())}`;
    if (genreId) endpoint += `&genres=${genreId}`;
    if (type) endpoint += `&type=${type}`;
    if (status) endpoint += `&status=${status}`;
    if (orderBy) endpoint += `&order_by=${orderBy}&sort=${sort}`;

    const json = await fetchJikan<any>(endpoint, true);
    return {
      data: dedupeAnimeList(json.data || []),
      hasNextPage: json.pagination?.has_next_page || false,
    };
  } catch (err) {
    console.warn('Search falling back to local data:', err);
    // Filter fallback data locally
    const filtered = FALLBACK_ANIME_LIST.filter((a) => {
      const matchQ = !queryStr || a.title.toLowerCase().includes(queryStr.toLowerCase());
      const matchG = !genreId || a.genres.some((g) => g.mal_id === genreId);
      return matchQ && matchG;
    });
    return { data: dedupeAnimeList(filtered), hasNextPage: false };
  }
}

/**
 * Fetch single Anime details by ID
 */
export async function getAnimeById(id: number): Promise<Anime> {
  try {
    return await fetchJikan<Anime>(`/anime/${id}/full`);
  } catch (err) {
    const found = FALLBACK_ANIME_LIST.find((a) => a.mal_id === id);
    if (found) return found;
    return FALLBACK_ANIME_LIST[0];
  }
}

/**
 * Fetch Episode list for an anime
 */
export async function getAnimeEpisodes(animeId: number): Promise<AnimeEpisode[]> {
  try {
    const res = await fetchJikan<AnimeEpisode[]>(`/anime/${animeId}/episodes`);
    if (res && res.length > 0) return res;
    throw new Error('No episode data');
  } catch (err) {
    // Generate synthesized episode list if Jikan has no detailed ep data or fails
    const anime = FALLBACK_ANIME_LIST.find((a) => a.mal_id === animeId) || FALLBACK_ANIME_LIST[0];
    const totalEps = anime.episodes || 12;
    const synthesized: AnimeEpisode[] = [];
    for (let i = 1; i <= Math.min(totalEps, 24); i++) {
      synthesized.push({
        mal_id: i,
        title: `Episode ${i}: ${getEpisodeTitleSample(i)}`,
        score: +(8.0 + (i % 5) * 0.2).toFixed(1),
        aired: '2025-01-10',
      });
    }
    return synthesized;
  }
}

/**
 * Fetch Character cast
 */
export async function getAnimeCharacters(animeId: number): Promise<AnimeCharacter[]> {
  try {
    return await fetchJikan<AnimeCharacter[]>(`/anime/${animeId}/characters`);
  } catch (err) {
    return [];
  }
}

/**
 * Fetch Recommendations
 */
export async function getAnimeRecommendations(animeId: number): Promise<Anime[]> {
  try {
    const raw = await fetchJikan<any[]>(`/anime/${animeId}/recommendations`);
    return raw.slice(0, 10).map((r) => r.entry as Anime);
  } catch (err) {
    return FALLBACK_ANIME_LIST.slice(1, 7);
  }
}

function getEpisodeTitleSample(i: number): string {
  const titles = [
    'The Beginning of the Journey',
    'Unawakened Power',
    'Shadows in the Dark',
    'The First Encounter',
    'Clash of Ideals',
    'Secrets Unveiled',
    'The Trial of Courage',
    'Boundless Horizons',
    'A Crimson Destiny',
    'Echoes of the Past',
    'The Ultimate Stand',
    'A New Dawn Breaks',
  ];
  return titles[(i - 1) % titles.length];
}

// Fallback genres if offline/throttled
export const FALLBACK_GENRES: JikanGenre[] = [
  { mal_id: 1, name: 'Action', type: 'anime', url: '' },
  { mal_id: 2, name: 'Adventure', type: 'anime', url: '' },
  { mal_id: 4, name: 'Comedy', type: 'anime', url: '' },
  { mal_id: 8, name: 'Drama', type: 'anime', url: '' },
  { mal_id: 10, name: 'Fantasy', type: 'anime', url: '' },
  { mal_id: 14, name: 'Horror', type: 'anime', url: '' },
  { mal_id: 22, name: 'Romance', type: 'anime', url: '' },
  { mal_id: 24, name: 'Sci-Fi', type: 'anime', url: '' },
  { mal_id: 36, name: 'Slice of Life', type: 'anime', url: '' },
  { mal_id: 37, name: 'Supernatural', type: 'anime', url: '' },
  { mal_id: 41, name: 'Thriller', type: 'anime', url: '' },
];

// Rich Fallback Anime Database with real imagery and videos
export const FALLBACK_ANIME_LIST: Anime[] = [
  {
    mal_id: 5114,
    url: 'https://myanimelist.net/anime/5114/Fullmetal_Alchemist__Brotherhood',
    images: {
      jpg: {
        image_url: 'https://cdn.myanimelist.net/images/anime/1208/94745.jpg',
        large_image_url: 'https://cdn.myanimelist.net/images/anime/1208/94745l.jpg',
      },
    },
    trailer: {
      youtube_id: '--IcmZkvL0Q',
      url: 'https://www.youtube.com/watch?v=--IcmZkvL0Q',
      embed_url: 'https://www.youtube.com/embed/--IcmZkvL0Q?enablejsapi=1&wmode=opaque&autoplay=1',
    },
    approved: true,
    titles: [{ type: 'Default', title: 'Fullmetal Alchemist: Brotherhood' }],
    title: 'Fullmetal Alchemist: Brotherhood',
    title_english: 'Fullmetal Alchemist: Brotherhood',
    title_japanese: '鋼の錬金術師 FULLMETAL ALCHEMIST',
    type: 'TV',
    source: 'Manga',
    episodes: 64,
    status: 'Finished Airing',
    airing: false,
    duration: '24 min per ep',
    rating: 'R - 17+ (violence & profanity)',
    score: 9.1,
    scored_by: 2120000,
    rank: 1,
    popularity: 3,
    members: 3300000,
    favorites: 228000,
    synopsis:
      'After a horrific alchemy experiment goes wrong in the Elric household, brothers Edward and Alphonse are left in a catastrophic new reality. Disregarding the alchemical taboo against human transmutation, the young boys lost parts of their bodies. Ed and Al set out to find the Philosopher Stone.',
    background: 'Fullmetal Alchemist: Brotherhood is an adapted anime series from the manga.',
    season: 'spring',
    year: 2009,
    studios: [{ mal_id: 4, name: 'Bones', type: 'anime', url: '' }],
    genres: [
      { mal_id: 1, name: 'Action', type: 'anime', url: '' },
      { mal_id: 2, name: 'Adventure', type: 'anime', url: '' },
      { mal_id: 10, name: 'Fantasy', type: 'anime', url: '' },
    ],
  },
  {
    mal_id: 38000,
    url: 'https://myanimelist.net/anime/38000/Demon_Slayer__Kimetsu_no_Yaiba',
    images: {
      jpg: {
        image_url: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg',
        large_image_url: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg',
      },
    },
    trailer: {
      youtube_id: 'VQGCItX2IYU',
      url: 'https://www.youtube.com/watch?v=VQGCItX2IYU',
      embed_url: 'https://www.youtube.com/embed/VQGCItX2IYU?enablejsapi=1&wmode=opaque&autoplay=1',
    },
    approved: true,
    titles: [{ type: 'Default', title: 'Demon Slayer: Kimetsu no Yaiba' }],
    title: 'Demon Slayer: Kimetsu no Yaiba',
    title_english: 'Demon Slayer: Kimetsu no Yaiba',
    title_japanese: '鬼滅の刃',
    type: 'TV',
    source: 'Manga',
    episodes: 26,
    status: 'Finished Airing',
    airing: false,
    duration: '23 min per ep',
    rating: 'R - 17+',
    score: 8.52,
    scored_by: 1980000,
    rank: 110,
    popularity: 2,
    members: 2900000,
    favorites: 89000,
    synopsis:
      'Ever since the death of his father, the burden of supporting the family has fallen upon Tanjiro Kamado. Though living impoverished on a remote mountain, the Kamado family is able to enjoy a relatively peaceful life. One day, Tanjiro decides to go down to the local village to make a little money selling charcoal. On his way back, night falls, forcing Tanjiro to take shelter in the house of a strange man.',
    background: '',
    season: 'spring',
    year: 2019,
    studios: [{ mal_id: 43, name: 'ufotable', type: 'anime', url: '' }],
    genres: [
      { mal_id: 1, name: 'Action', type: 'anime', url: '' },
      { mal_id: 37, name: 'Supernatural', type: 'anime', url: '' },
    ],
  },
  {
    mal_id: 40748,
    url: 'https://myanimelist.net/anime/40748/Jujutsu_Kaisen',
    images: {
      jpg: {
        image_url: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg',
        large_image_url: 'https://cdn.myanimelist.net/images/anime/1171/109222l.jpg',
      },
    },
    trailer: {
      youtube_id: 'pkKu8R8XM-M',
      url: 'https://www.youtube.com/watch?v=pkKu8R8XM-M',
      embed_url: 'https://www.youtube.com/embed/pkKu8R8XM-M?enablejsapi=1&wmode=opaque&autoplay=1',
    },
    approved: true,
    titles: [{ type: 'Default', title: 'Jujutsu Kaisen' }],
    title: 'Jujutsu Kaisen',
    title_english: 'Jujutsu Kaisen',
    title_japanese: '呪術廻戦',
    type: 'TV',
    source: 'Manga',
    episodes: 24,
    status: 'Finished Airing',
    airing: false,
    duration: '23 min per ep',
    rating: 'R - 17+',
    score: 8.6,
    scored_by: 1650000,
    rank: 75,
    popularity: 1,
    members: 2400000,
    favorites: 102000,
    synopsis:
      'Idly indulging in baseless paranormal activities with the Occult Club, high schooler Yuuji Itadori spends his days at either the clubroom or the hospital, where he visits his bedridden grandfather. However, this leisurely lifestyle soon takes a turn for the bizarre when he unknowingly encounters a cursed item.',
    background: '',
    season: 'fall',
    year: 2020,
    studios: [{ mal_id: 569, name: 'MAPPA', type: 'anime', url: '' }],
    genres: [
      { mal_id: 1, name: 'Action', type: 'anime', url: '' },
      { mal_id: 37, name: 'Supernatural', type: 'anime', url: '' },
    ],
  },
  {
    mal_id: 52991,
    url: 'https://myanimelist.net/anime/52991/Sousou_no_Frieren',
    images: {
      jpg: {
        image_url: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg',
        large_image_url: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg',
      },
    },
    trailer: {
      youtube_id: 'qgQunD1Ait0',
      url: 'https://www.youtube.com/watch?v=qgQunD1Ait0',
      embed_url: 'https://www.youtube.com/embed/qgQunD1Ait0?enablejsapi=1&wmode=opaque&autoplay=1',
    },
    approved: true,
    titles: [{ type: 'Default', title: 'Frieren: Beyond Journey\'s End' }],
    title: 'Sousou no Frieren',
    title_english: 'Frieren: Beyond Journey\'s End',
    title_japanese: '葬送のフリーレン',
    type: 'TV',
    source: 'Manga',
    episodes: 28,
    status: 'Finished Airing',
    airing: false,
    duration: '24 min per ep',
    rating: 'PG-13',
    score: 9.32,
    scored_by: 620000,
    rank: 1,
    popularity: 15,
    members: 1100000,
    favorites: 54000,
    synopsis:
      'During their 10-year quest to defeat the Demon King, the members of the hero party—the hero Himmel, the priest Heiter, the dwarf warrior Eisen, and the elven mage Frieren—forged bonds through adventures. Now, decades later, Frieren reflects on human mortality.',
    background: '',
    season: 'fall',
    year: 2023,
    studios: [{ mal_id: 11, name: 'Madhouse', type: 'anime', url: '' }],
    genres: [
      { mal_id: 2, name: 'Adventure', type: 'anime', url: '' },
      { mal_id: 10, name: 'Fantasy', type: 'anime', url: '' },
    ],
  },
  {
    mal_id: 16498,
    url: 'https://myanimelist.net/anime/16498/Shingeki_no_Kyojin',
    images: {
      jpg: {
        image_url: 'https://cdn.myanimelist.net/images/anime/10/47339.jpg',
        large_image_url: 'https://cdn.myanimelist.net/images/anime/10/47339l.jpg',
      },
    },
    trailer: {
      youtube_id: 'MGRm4IzK1SQ',
      url: 'https://www.youtube.com/watch?v=MGRm4IzK1SQ',
      embed_url: 'https://www.youtube.com/embed/MGRm4IzK1SQ?enablejsapi=1&wmode=opaque&autoplay=1',
    },
    approved: true,
    titles: [{ type: 'Default', title: 'Attack on Titan' }],
    title: 'Attack on Titan',
    title_english: 'Attack on Titan',
    title_japanese: '進撃の巨人',
    type: 'TV',
    source: 'Manga',
    episodes: 25,
    status: 'Finished Airing',
    airing: false,
    duration: '24 min per ep',
    rating: 'R - 17+',
    score: 8.55,
    scored_by: 2700000,
    rank: 105,
    popularity: 1,
    members: 3900000,
    favorites: 180000,
    synopsis:
      'Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called Titans, forcing humans to hide in fear behind enormous concentric walls. What makes these giants truly terrifying is that their taste for human flesh is not fueled by hunger.',
    background: '',
    season: 'spring',
    year: 2013,
    studios: [{ mal_id: 858, name: 'Wit Studio', type: 'anime', url: '' }],
    genres: [
      { mal_id: 1, name: 'Action', type: 'anime', url: '' },
      { mal_id: 10, name: 'Fantasy', type: 'anime', url: '' },
    ],
  },
];
