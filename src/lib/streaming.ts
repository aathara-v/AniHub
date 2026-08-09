import { VideoServerOption } from '../types';

// High-quality anime & open-source HD animation video clips for real video player streaming
const SAMPLE_STREAM_SOURCES = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
];

/**
 * Direct Consumet API search helper
 */
export async function searchConsumetAnime(query: string, provider = 'gogoanime') {
  try {
    const res = await fetch(`/api/stream/consumet/search?q=${encodeURIComponent(query)}&provider=${provider}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Consumet search error:', err);
  }
  return { results: [] };
}

/**
 * Direct Consumet episode watch source helper
 */
export async function getConsumetEpisodeWatch(episodeId: string, provider = 'gogoanime') {
  try {
    const res = await fetch(`/api/stream/consumet/watch?episodeId=${encodeURIComponent(episodeId)}&provider=${provider}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Consumet watch error:', err);
  }
  return null;
}

/**
 * Fetch real anime video streaming servers from server-side API
 */
export async function fetchAnimeStreamingServers(
  animeId: number,
  episodeNumber: number,
  title?: string,
  youtubeEmbedUrl?: string | null
): Promise<VideoServerOption[]> {
  try {
    const params = new URLSearchParams({
      mal_id: String(animeId),
      episode: String(episodeNumber),
    });
    if (title) params.append('title', title);

    const res = await fetch(`/api/stream/servers?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.servers && Array.isArray(data.servers) && data.servers.length > 0) {
        // Append official trailer PV if available
        const serverList: VideoServerOption[] = [...data.servers];
        if (youtubeEmbedUrl) {
          let embedSrc = youtubeEmbedUrl;
          if (!embedSrc.includes('autoplay=')) {
            embedSrc += (embedSrc.includes('?') ? '&' : '?') + 'autoplay=1&enablejsapi=1';
          }
          serverList.push({
            id: 'server-pv',
            name: 'Official Trailer / PV Server',
            quality: '1080p',
            language: 'sub',
            url: embedSrc,
            type: 'embed',
            provider: 'YouTube',
          });
        }
        return serverList;
      }
    }
  } catch (err) {
    console.error('Error fetching streaming servers:', err);
  }

  // Fallback to offline/sample servers
  return getEpisodeServers(animeId, episodeNumber, youtubeEmbedUrl);
}

/**
 * Get video streaming server options for a given anime and episode (fallback)
 */
export function getEpisodeServers(
  animeId: number,
  episodeNumber: number,
  youtubeEmbedUrl?: string | null
): VideoServerOption[] {
  // Hash to pick video stream deterministically
  const streamIdx = Math.abs(animeId * 13 + episodeNumber * 7) % SAMPLE_STREAM_SOURCES.length;
  const secondaryIdx = (streamIdx + 1) % SAMPLE_STREAM_SOURCES.length;
  const mp4Url = SAMPLE_STREAM_SOURCES[streamIdx];
  const secondaryMp4Url = SAMPLE_STREAM_SOURCES[secondaryIdx];

  const servers: VideoServerOption[] = [
    {
      id: 'server-1-hd',
      name: 'AniHub Server 1 (Subbed 1080p)',
      quality: '1080p',
      language: 'sub',
      url: mp4Url,
      type: 'mp4',
    },
    {
      id: 'server-2-fast',
      name: 'AniHub Server 2 (Subbed 720p)',
      quality: '720p',
      language: 'sub',
      url: secondaryMp4Url,
      type: 'mp4',
    },
    {
      id: 'server-3-dub',
      name: 'AniHub Server 3 (English Dub)',
      quality: '1080p',
      language: 'dub',
      url: mp4Url,
      type: 'mp4',
    },
  ];

  if (youtubeEmbedUrl) {
    let embedSrc = youtubeEmbedUrl;
    if (!embedSrc.includes('autoplay=')) {
      embedSrc += (embedSrc.includes('?') ? '&' : '?') + 'autoplay=1&enablejsapi=1';
    }
    servers.push({
      id: 'server-pv',
      name: 'Official Trailer / PV Server',
      quality: '1080p',
      language: 'sub',
      url: embedSrc,
      type: 'embed',
    });
  }

  return servers;
}

/**
 * Sample subtitle tracks for video player
 */
export interface SubtitleTrack {
  label: string;
  srclang: string;
  kind: string;
  default?: boolean;
}

export const SAMPLE_SUBTITLES: SubtitleTrack[] = [
  { label: 'English [US]', srclang: 'en', kind: 'subtitles', default: true },
  { label: 'Spanish [ES]', srclang: 'es', kind: 'subtitles' },
  { label: 'Japanese [Romaji]', srclang: 'ja', kind: 'subtitles' },
];
