// Shared TypeScript types for Campus Music
// Used by both web and mobile apps

export interface User {
  id: string;
  email: string;
  fullName: string;
  universityName: string;
  country: string;
  role: "listener" | "artist";
  emailVerified: boolean;
  profileImageUrl: string | null;
  showUniversity: boolean;
  showMusicPreferences: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface ArtistProfile {
  id: string;
  userId: string;
  stageName: string;
  bio: string | null;
  mainGenre: string;
  socialLinks: string | null;
  profileImageUrl: string | null;
  createdAt: string;
}

export interface Track {
  id: string;
  artistId: string;
  title: string;
  description: string | null;
  audioUrl: string;
  coverImageUrl: string | null;
  genre: string;
  universityName: string;
  country: string;
  durationSeconds: number;
  createdAt: string;
}

export interface TrackWithArtist extends Track {
  artist: ArtistProfile;
  likeCount: number;
  streamCount: number;
  isLiked?: boolean;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  isPublic: boolean;
  createdAt: string;
}

export interface LiveStream {
  id: string;
  artistId: string;
  title: string;
  description: string | null;
  status: "live" | "ended" | "scheduled";
  startedAt: string | null;
  endedAt: string | null;
  viewerCount: number;
  createdAt: string;
}

export interface ArtistPost {
  id: string;
  artistId: string;
  content: string;
  imageUrl: string | null;
  trackId: string | null;
  createdAt: string;
}

export interface PostWithDetails extends ArtistPost {
  artist: ArtistProfile;
  track?: Track;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
}

export interface UserConnection {
  id: string;
  requesterId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// API Response types
export interface AuthResponse {
  id: string;
  email: string;
  fullName: string;
  universityName: string;
  country: string;
  role: string;
  profileImageUrl: string | null;
  onboardingCompleted: boolean;
}

export interface ApiError {
  error: string;
  message?: string;
}

// Request types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
  universityName: string;
  country: string;
  role: "listener" | "artist";
}

export interface CreateTrackRequest {
  title: string;
  description?: string;
  audioUrl: string;
  coverImageUrl?: string;
  genre: string;
  durationSeconds: number;
}

export interface CreatePostRequest {
  content: string;
  imageUrl?: string;
  trackId?: string;
}
