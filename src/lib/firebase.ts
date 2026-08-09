import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, WatchlistItem, WatchHistoryItem, AnimeComment } from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID if present
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Simple password hashing using native Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'ani_hub_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Generate default avatar URL based on username
function getDefaultAvatar(username: string): string {
  const avatars = [
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80',
  ];
  let charSum = 0;
  for (let i = 0; i < username.length; i++) {
    charSum += username.charCodeAt(i);
  }
  return avatars[charSum % avatars.length];
}

/**
 * Register a new user in Firestore
 */
export async function registerUserInFirestore(
  rawUsername: string,
  rawPassword: string,
  displayName?: string
): Promise<UserProfile> {
  const cleanUsername = rawUsername.trim();
  if (!cleanUsername || cleanUsername.length < 3) {
    throw new Error('Username must be at least 3 characters long.');
  }
  if (!rawPassword || rawPassword.length < 4) {
    throw new Error('Password must be at least 4 characters long.');
  }

  const userId = `user_${cleanUsername.toLowerCase()}`;
  const userDocRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userDocRef);

  if (userSnap.exists()) {
    throw new Error(`Username "${cleanUsername}" is already taken. Please log in or pick another username.`);
  }

  const passwordHash = await hashPassword(rawPassword);
  const avatarUrl = getDefaultAvatar(cleanUsername);
  const createdAt = new Date().toISOString();

  const newUser = {
    username: cleanUsername,
    passwordHash,
    displayName: displayName?.trim() || cleanUsername,
    avatarUrl,
    createdAt,
  };

  await setDoc(userDocRef, newUser);

  return {
    username: cleanUsername,
    displayName: newUser.displayName,
    avatarUrl,
    createdAt,
  };
}

/**
 * Login user via Firestore
 */
export async function loginUserInFirestore(
  rawUsername: string,
  rawPassword: string
): Promise<UserProfile> {
  const cleanUsername = rawUsername.trim();
  if (!cleanUsername) {
    throw new Error('Please enter your username.');
  }
  if (!rawPassword) {
    throw new Error('Please enter your password.');
  }

  const userId = `user_${cleanUsername.toLowerCase()}`;
  const userDocRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userDocRef);

  if (!userSnap.exists()) {
    throw new Error(`Account "${cleanUsername}" not found. Please check your username or create an account.`);
  }

  const userData = userSnap.data();
  const inputHash = await hashPassword(rawPassword);

  if (userData.passwordHash !== inputHash) {
    throw new Error('Incorrect password. Please try again.');
  }

  return {
    username: userData.username,
    displayName: userData.displayName || userData.username,
    avatarUrl: userData.avatarUrl || getDefaultAvatar(userData.username),
    createdAt: userData.createdAt || new Date().toISOString(),
  };
}

/**
 * Watchlist operations in Firestore
 */
export async function saveUserWatchlist(
  username: string,
  item: {
    animeId: number;
    title: string;
    image: string;
    score: number;
    episodes: number;
    status: 'watching' | 'plan_to_watch' | 'completed' | 'dropped';
    rating?: number;
  }
): Promise<WatchlistItem> {
  const docId = `wl_${username.toLowerCase()}_${item.animeId}`;
  const docRef = doc(db, 'watchlists', docId);

  const watchlistItem: WatchlistItem = {
    username: username.trim(),
    animeId: item.animeId,
    title: item.title,
    image: item.image,
    score: item.score,
    episodes: item.episodes,
    status: item.status,
    rating: item.rating || 0,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(docRef, watchlistItem, { merge: true });
  return watchlistItem;
}

export async function getUserWatchlist(username: string): Promise<WatchlistItem[]> {
  try {
    const q = query(
      collection(db, 'watchlists'),
      where('username', '==', username.trim())
    );
    const querySnapshot = await getDocs(q);
    const items: WatchlistItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...(doc.data() as WatchlistItem) });
    });
    return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err) {
    console.error('Error fetching watchlist:', err);
    return [];
  }
}

export async function removeFromWatchlist(username: string, animeId: number): Promise<void> {
  const docId = `wl_${username.toLowerCase()}_${animeId}`;
  await deleteDoc(doc(db, 'watchlists', docId));
}

/**
 * Watch History operations
 */
export async function saveWatchProgress(
  username: string,
  historyData: {
    animeId: number;
    animeTitle: string;
    animeImage: string;
    episodeNumber: number;
    episodeTitle: string;
    timestamp: number;
    duration: number;
  }
): Promise<WatchHistoryItem> {
  const docId = `hist_${username.toLowerCase()}_${historyData.animeId}_ep${historyData.episodeNumber}`;
  const docRef = doc(db, 'history', docId);

  const item: WatchHistoryItem = {
    username: username.trim(),
    animeId: historyData.animeId,
    animeTitle: historyData.animeTitle,
    animeImage: historyData.animeImage,
    episodeNumber: historyData.episodeNumber,
    episodeTitle: historyData.episodeTitle,
    timestamp: Math.floor(historyData.timestamp),
    duration: Math.floor(historyData.duration),
    lastWatchedAt: new Date().toISOString(),
  };

  await setDoc(docRef, item, { merge: true });
  return item;
}

export async function getUserWatchHistory(username: string): Promise<WatchHistoryItem[]> {
  try {
    const q = query(
      collection(db, 'history'),
      where('username', '==', username.trim())
    );
    const querySnapshot = await getDocs(q);
    const items: WatchHistoryItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...(doc.data() as WatchHistoryItem) });
    });
    return items.sort((a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime());
  } catch (err) {
    console.error('Error fetching watch history:', err);
    return [];
  }
}

/**
 * Comments section for Anime details
 */
export async function addAnimeComment(
  username: string,
  animeId: number,
  commentText: string,
  episodeNumber?: number
): Promise<AnimeComment> {
  const newCommentDoc = doc(collection(db, 'comments'));
  const comment: AnimeComment = {
    id: newCommentDoc.id,
    username: username.trim(),
    animeId,
    episodeNumber,
    comment: commentText.trim(),
    createdAt: new Date().toISOString(),
  };
  await setDoc(newCommentDoc, comment);
  return comment;
}

export async function getAnimeComments(animeId: number): Promise<AnimeComment[]> {
  try {
    const q = query(
      collection(db, 'comments'),
      where('animeId', '==', animeId)
    );
    const querySnapshot = await getDocs(q);
    const comments: AnimeComment[] = [];
    querySnapshot.forEach((doc) => {
      comments.push({ id: doc.id, ...(doc.data() as AnimeComment) });
    });
    return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching comments:', err);
    return [];
  }
}
