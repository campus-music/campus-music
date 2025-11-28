import { 
  type User, 
  type InsertUser, 
  type ArtistProfile, 
  type InsertArtistProfile,
  type Track,
  type InsertTrack,
  type Playlist,
  type InsertPlaylist,
  type PlaylistTrack,
  type InsertPlaylistTrack,
  type Like,
  type InsertLike,
  type Stream,
  type InsertStream,
  type TrackWithArtist,
  type Follower,
  type InsertFollower,
  type TrackComment,
  type InsertTrackComment,
  type Share,
  type InsertShare,
  type PlaylistMember,
  type InsertPlaylistMember,
  type Support,
  type InsertSupport,
  type ArtistWallet,
  type InsertArtistWallet
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Artist Profile methods
  getArtistProfile(userId: string): Promise<ArtistProfile | undefined>;
  getArtistProfileById(id: string): Promise<ArtistProfile | undefined>;
  createArtistProfile(profile: InsertArtistProfile): Promise<ArtistProfile>;
  updateArtistProfile(id: string, updates: Partial<ArtistProfile>): Promise<ArtistProfile | undefined>;
  getArtistsByUniversity(university: string): Promise<ArtistProfile[]>;

  // Track methods
  getTrack(id: string): Promise<Track | undefined>;
  getTrackWithArtist(id: string): Promise<TrackWithArtist | undefined>;
  getTracksByArtist(artistId: string): Promise<Track[]>;
  getLatestTracks(limit?: number): Promise<TrackWithArtist[]>;
  getTrendingTracks(limit?: number): Promise<TrackWithArtist[]>;
  getTracksByUniversity(university: string): Promise<TrackWithArtist[]>;
  searchTracks(query: string): Promise<TrackWithArtist[]>;
  createTrack(track: InsertTrack): Promise<Track>;

  // Playlist methods
  getPlaylist(id: string): Promise<Playlist | undefined>;
  getPlaylistsByUser(userId: string): Promise<Playlist[]>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  addTrackToPlaylist(data: InsertPlaylistTrack): Promise<PlaylistTrack>;
  removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void>;

  // Like methods
  likeTrack(data: InsertLike): Promise<Like>;
  unlikeTrack(userId: string, trackId: string): Promise<void>;
  getLikedTracks(userId: string): Promise<TrackWithArtist[]>;
  isTrackLiked(userId: string, trackId: string): Promise<boolean>;
  getLikeCount(trackId: string): Promise<number>;

  // Stream methods
  recordStream(data: InsertStream): Promise<Stream>;
  getStreamCount(trackId: string): Promise<number>;
  getArtistStats(artistId: string): Promise<{ totalPlays: number; totalLikes: number; trackCount: number }>;

  // Follower methods
  followArtist(data: InsertFollower): Promise<Follower>;
  unfollowArtist(userId: string, followerId: string): Promise<void>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  isFollowing(userId: string, followerId: string): Promise<boolean>;

  // Comment methods
  addComment(data: InsertTrackComment): Promise<TrackComment>;
  getTrackComments(trackId: string): Promise<TrackComment[]>;
  deleteComment(commentId: string): Promise<void>;

  // Share methods
  shareTrack(data: InsertShare): Promise<Share>;
  getShareCount(trackId: string): Promise<number>;

  // Playlist Member methods
  addPlaylistMember(data: InsertPlaylistMember): Promise<PlaylistMember>;
  removePlaylistMember(playlistId: string, userId: string): Promise<void>;
  getPlaylistMembers(playlistId: string): Promise<PlaylistMember[]>;

  // Genre discovery methods
  getTracksByGenre(genre: string): Promise<TrackWithArtist[]>;
  getTopArtistsByGenre(genre: string, limit?: number): Promise<ArtistProfile[]>;
  getGenres(): Promise<string[]>;
  getUniversities(): Promise<string[]>;
  getPersonalizedRecommendations(userId: string, limit?: number): Promise<TrackWithArtist[]>;

  // Advanced artist analytics
  getArtistAnalytics(artistId: string): Promise<{
    totalPlays: number;
    totalLikes: number;
    trackCount: number;
    streams: Map<string, number>;
    topTracks: { trackId: string; plays: number }[];
    listenerCountries: Map<string, number>;
  }>;

  // Support system methods
  sendSupport(data: InsertSupport): Promise<Support>;
  getArtistSupports(artistId: string): Promise<Support[]>;
  getArtistWallet(artistId: string): Promise<ArtistWallet | undefined>;
  createOrUpdateArtistWallet(data: InsertArtistWallet): Promise<ArtistWallet>;
  updateArtistWallet(artistId: string, updates: Partial<ArtistWallet>): Promise<ArtistWallet | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private artistProfiles: Map<string, ArtistProfile>;
  private tracks: Map<string, Track>;
  private playlists: Map<string, Playlist>;
  private playlistTracks: Map<string, PlaylistTrack>;
  private likes: Map<string, Like>;
  private streams: Map<string, Stream>;
  private followers: Map<string, Follower>;
  private comments: Map<string, TrackComment>;
  private shares: Map<string, Share>;
  private playlistMembers: Map<string, PlaylistMember>;
  private supports: Map<string, Support>;
  private artistWallets: Map<string, ArtistWallet>;

  constructor() {
    this.users = new Map();
    this.artistProfiles = new Map();
    this.tracks = new Map();
    this.playlists = new Map();
    this.playlistTracks = new Map();
    this.likes = new Map();
    this.streams = new Map();
    this.followers = new Map();
    this.comments = new Map();
    this.shares = new Map();
    this.playlistMembers = new Map();
    this.supports = new Map();
    this.artistWallets = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  // Artist Profile methods
  async getArtistProfile(userId: string): Promise<ArtistProfile | undefined> {
    return Array.from(this.artistProfiles.values()).find((profile) => profile.userId === userId);
  }

  async getArtistProfileById(id: string): Promise<ArtistProfile | undefined> {
    return this.artistProfiles.get(id);
  }

  async createArtistProfile(insertProfile: InsertArtistProfile): Promise<ArtistProfile> {
    const id = randomUUID();
    const profile: ArtistProfile = {
      ...insertProfile,
      id,
      createdAt: new Date(),
    };
    this.artistProfiles.set(id, profile);
    
    // Update user role to artist
    const user = await this.getUser(insertProfile.userId);
    if (user) {
      await this.updateUser(user.id, { role: 'artist' });
    }
    
    return profile;
  }

  async updateArtistProfile(id: string, updates: Partial<ArtistProfile>): Promise<ArtistProfile | undefined> {
    const profile = this.artistProfiles.get(id);
    if (!profile) return undefined;
    const updated = { ...profile, ...updates };
    this.artistProfiles.set(id, updated);
    return updated;
  }

  async getArtistsByUniversity(university: string): Promise<ArtistProfile[]> {
    const tracks = Array.from(this.tracks.values())
      .filter(t => t.universityName.toLowerCase().includes(university.toLowerCase()));
    
    const artistIds = new Set(tracks.map(t => t.artistId));
    return Array.from(this.artistProfiles.values())
      .filter(a => artistIds.has(a.id));
  }

  // Track methods
  async getTrack(id: string): Promise<Track | undefined> {
    return this.tracks.get(id);
  }

  async getTrackWithArtist(id: string): Promise<TrackWithArtist | undefined> {
    const track = this.tracks.get(id);
    if (!track) return undefined;
    
    const artist = await this.getArtistProfileById(track.artistId);
    if (!artist) return undefined;
    
    return { ...track, artist };
  }

  async getTracksByArtist(artistId: string): Promise<Track[]> {
    return Array.from(this.tracks.values()).filter((track) => track.artistId === artistId);
  }

  async getLatestTracks(limit: number = 20): Promise<TrackWithArtist[]> {
    const allTracks = Array.from(this.tracks.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    const tracksWithArtists: TrackWithArtist[] = [];
    for (const track of allTracks) {
      const artist = await this.getArtistProfileById(track.artistId);
      if (artist) {
        tracksWithArtists.push({ ...track, artist });
      }
    }
    return tracksWithArtists;
  }

  async getTrendingTracks(limit: number = 20): Promise<TrackWithArtist[]> {
    const streamCounts = new Map<string, number>();
    Array.from(this.streams.values()).forEach((stream) => {
      const count = streamCounts.get(stream.trackId) || 0;
      streamCounts.set(stream.trackId, count + 1);
    });

    const allTracks = Array.from(this.tracks.values())
      .sort((a, b) => (streamCounts.get(b.id) || 0) - (streamCounts.get(a.id) || 0))
      .slice(0, limit);

    const tracksWithArtists: TrackWithArtist[] = [];
    for (const track of allTracks) {
      const artist = await this.getArtistProfileById(track.artistId);
      if (artist) {
        tracksWithArtists.push({ ...track, artist });
      }
    }
    return tracksWithArtists;
  }

  async getTracksByUniversity(university: string): Promise<TrackWithArtist[]> {
    const tracks = Array.from(this.tracks.values())
      .filter(t => t.universityName.toLowerCase().includes(university.toLowerCase()));
    
    const tracksWithArtists: TrackWithArtist[] = [];
    for (const track of tracks) {
      const artist = await this.getArtistProfileById(track.artistId);
      if (artist) {
        tracksWithArtists.push({ ...track, artist });
      }
    }
    return tracksWithArtists;
  }

  async searchTracks(query: string): Promise<TrackWithArtist[]> {
    const lowerQuery = query.toLowerCase();
    const tracks = Array.from(this.tracks.values()).filter(
      (track) =>
        track.title.toLowerCase().includes(lowerQuery) ||
        track.genre.toLowerCase().includes(lowerQuery) ||
        track.universityName.toLowerCase().includes(lowerQuery)
    );

    const tracksWithArtists: TrackWithArtist[] = [];
    for (const track of tracks) {
      const artist = await this.getArtistProfileById(track.artistId);
      if (artist) {
        tracksWithArtists.push({ ...track, artist });
      }
    }
    return tracksWithArtists;
  }

  async createTrack(insertTrack: InsertTrack): Promise<Track> {
    const id = randomUUID();
    const track: Track = {
      ...insertTrack,
      id,
      createdAt: new Date(),
    };
    this.tracks.set(id, track);
    return track;
  }

  // Playlist methods
  async getPlaylist(id: string): Promise<Playlist | undefined> {
    return this.playlists.get(id);
  }

  async getPlaylistsByUser(userId: string): Promise<Playlist[]> {
    return Array.from(this.playlists.values()).filter((playlist) => playlist.userId === userId);
  }

  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const id = randomUUID();
    const playlist: Playlist = {
      ...insertPlaylist,
      id,
      createdAt: new Date(),
    };
    this.playlists.set(id, playlist);
    return playlist;
  }

  async addTrackToPlaylist(data: InsertPlaylistTrack): Promise<PlaylistTrack> {
    const id = randomUUID();
    const playlistTrack: PlaylistTrack = {
      ...data,
      id,
      addedAt: new Date(),
    };
    this.playlistTracks.set(id, playlistTrack);
    return playlistTrack;
  }

  async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    const toRemove = Array.from(this.playlistTracks.entries()).find(
      ([_, pt]) => pt.playlistId === playlistId && pt.trackId === trackId
    );
    if (toRemove) {
      this.playlistTracks.delete(toRemove[0]);
    }
  }

  // Like methods
  async likeTrack(data: InsertLike): Promise<Like> {
    const id = randomUUID();
    const like: Like = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.likes.set(id, like);
    return like;
  }

  async unlikeTrack(userId: string, trackId: string): Promise<void> {
    const toRemove = Array.from(this.likes.entries()).find(
      ([_, like]) => like.userId === userId && like.trackId === trackId
    );
    if (toRemove) {
      this.likes.delete(toRemove[0]);
    }
  }

  async getLikedTracks(userId: string): Promise<TrackWithArtist[]> {
    const likedTrackIds = Array.from(this.likes.values())
      .filter((like) => like.userId === userId)
      .map((like) => like.trackId);

    const tracksWithArtists: TrackWithArtist[] = [];
    for (const trackId of likedTrackIds) {
      const track = await this.getTrackWithArtist(trackId);
      if (track) {
        tracksWithArtists.push(track);
      }
    }
    return tracksWithArtists;
  }

  async isTrackLiked(userId: string, trackId: string): Promise<boolean> {
    return Array.from(this.likes.values()).some(
      (like) => like.userId === userId && like.trackId === trackId
    );
  }

  async getLikeCount(trackId: string): Promise<number> {
    return Array.from(this.likes.values()).filter((like) => like.trackId === trackId).length;
  }

  // Stream methods
  async recordStream(data: InsertStream): Promise<Stream> {
    const id = randomUUID();
    const stream: Stream = {
      ...data,
      id,
      playedAt: new Date(),
    };
    this.streams.set(id, stream);
    return stream;
  }

  async getStreamCount(trackId: string): Promise<number> {
    return Array.from(this.streams.values()).filter((stream) => stream.trackId === trackId).length;
  }

  async getArtistStats(artistId: string): Promise<{ totalPlays: number; totalLikes: number; trackCount: number }> {
    const artistTracks = await this.getTracksByArtist(artistId);
    const trackIds = artistTracks.map(t => t.id);
    
    const totalPlays = Array.from(this.streams.values())
      .filter(s => trackIds.includes(s.trackId))
      .length;
    
    const totalLikes = Array.from(this.likes.values())
      .filter(l => trackIds.includes(l.trackId))
      .length;
    
    return {
      totalPlays,
      totalLikes,
      trackCount: artistTracks.length,
    };
  }

  // Follower methods
  async followArtist(data: InsertFollower): Promise<Follower> {
    const id = randomUUID();
    const follower: Follower = {
      ...data,
      id,
      followedAt: new Date(),
    };
    this.followers.set(id, follower);
    return follower;
  }

  async unfollowArtist(userId: string, followerId: string): Promise<void> {
    const toRemove = Array.from(this.followers.entries()).find(
      ([_, f]) => f.userId === userId && f.followerId === followerId
    );
    if (toRemove) {
      this.followers.delete(toRemove[0]);
    }
  }

  async getFollowers(userId: string): Promise<User[]> {
    const followerIds = Array.from(this.followers.values())
      .filter(f => f.userId === userId)
      .map(f => f.followerId);
    
    const followers: User[] = [];
    for (const id of followerIds) {
      const user = await this.getUser(id);
      if (user) followers.push(user);
    }
    return followers;
  }

  async getFollowing(userId: string): Promise<User[]> {
    const followingIds = Array.from(this.followers.values())
      .filter(f => f.followerId === userId)
      .map(f => f.userId);
    
    const following: User[] = [];
    for (const id of followingIds) {
      const user = await this.getUser(id);
      if (user) following.push(user);
    }
    return following;
  }

  async isFollowing(userId: string, followerId: string): Promise<boolean> {
    return Array.from(this.followers.values()).some(
      f => f.userId === userId && f.followerId === followerId
    );
  }

  // Comment methods
  async addComment(data: InsertTrackComment): Promise<TrackComment> {
    const id = randomUUID();
    const comment: TrackComment = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    return comment;
  }

  async getTrackComments(trackId: string): Promise<TrackComment[]> {
    return Array.from(this.comments.values())
      .filter(c => c.trackId === trackId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteComment(commentId: string): Promise<void> {
    this.comments.delete(commentId);
  }

  // Share methods
  async shareTrack(data: InsertShare): Promise<Share> {
    const id = randomUUID();
    const share: Share = {
      ...data,
      id,
      sharedAt: new Date(),
    };
    this.shares.set(id, share);
    return share;
  }

  async getShareCount(trackId: string): Promise<number> {
    return Array.from(this.shares.values())
      .filter(s => s.trackId === trackId)
      .length;
  }

  // Playlist Member methods
  async addPlaylistMember(data: InsertPlaylistMember): Promise<PlaylistMember> {
    const id = randomUUID();
    const member: PlaylistMember = {
      ...data,
      id,
      joinedAt: new Date(),
    };
    this.playlistMembers.set(id, member);
    return member;
  }

  async removePlaylistMember(playlistId: string, userId: string): Promise<void> {
    const toRemove = Array.from(this.playlistMembers.entries()).find(
      ([_, m]) => m.playlistId === playlistId && m.userId === userId
    );
    if (toRemove) {
      this.playlistMembers.delete(toRemove[0]);
    }
  }

  async getPlaylistMembers(playlistId: string): Promise<PlaylistMember[]> {
    return Array.from(this.playlistMembers.values())
      .filter(m => m.playlistId === playlistId);
  }

  // Genre discovery methods
  async getTracksByGenre(genre: string): Promise<TrackWithArtist[]> {
    const tracks = Array.from(this.tracks.values())
      .filter(t => t.genre.toLowerCase() === genre.toLowerCase());
    
    const tracksWithArtists: TrackWithArtist[] = [];
    for (const track of tracks) {
      const artist = await this.getArtistProfileById(track.artistId);
      if (artist) {
        tracksWithArtists.push({ ...track, artist });
      }
    }
    return tracksWithArtists;
  }

  async getTopArtistsByGenre(genre: string, limit: number = 10): Promise<ArtistProfile[]> {
    const genreArtists = new Map<string, number>();
    Array.from(this.tracks.values())
      .filter(t => t.genre.toLowerCase() === genre.toLowerCase())
      .forEach(t => {
        const count = genreArtists.get(t.artistId) || 0;
        genreArtists.set(t.artistId, count + 1);
      });

    const sorted = Array.from(genreArtists.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const artists: ArtistProfile[] = [];
    for (const [artistId] of sorted) {
      const artist = await this.getArtistProfileById(artistId);
      if (artist) artists.push(artist);
    }
    return artists;
  }

  async getGenres(): Promise<string[]> {
    const genres = new Set(Array.from(this.tracks.values()).map(t => t.genre));
    return Array.from(genres).sort();
  }

  async getUniversities(): Promise<string[]> {
    const universities = new Set(Array.from(this.tracks.values()).map(t => t.universityName));
    return Array.from(universities).filter(u => u && u !== 'Unknown').sort();
  }

  async getPersonalizedRecommendations(userId: string, limit: number = 20): Promise<TrackWithArtist[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    const likedTracks = await this.getLikedTracks(userId);
    const likedGenres = new Set(likedTracks.map(t => t.genre));

    const allTracks = Array.from(this.tracks.values())
      .filter(t => likedGenres.has(t.genre) && !likedTracks.find(lt => lt.id === t.id))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    const tracksWithArtists: TrackWithArtist[] = [];
    for (const track of allTracks) {
      const artist = await this.getArtistProfileById(track.artistId);
      if (artist) {
        tracksWithArtists.push({ ...track, artist });
      }
    }
    return tracksWithArtists;
  }

  async getArtistAnalytics(artistId: string): Promise<{
    totalPlays: number;
    totalLikes: number;
    trackCount: number;
    streams: Map<string, number>;
    topTracks: { trackId: string; plays: number }[];
    listenerCountries: Map<string, number>;
  }> {
    const artistTracks = await this.getTracksByArtist(artistId);
    const trackIds = artistTracks.map(t => t.id);

    const streams = new Map<string, number>();
    const listenerCountries = new Map<string, number>();

    Array.from(this.streams.values())
      .filter(s => trackIds.includes(s.trackId))
      .forEach(s => {
        const count = streams.get(s.trackId) || 0;
        streams.set(s.trackId, count + 1);
      });

    const topTracks = Array.from(streams.entries())
      .map(([trackId, plays]) => ({ trackId, plays }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 10);

    Array.from(this.users.values()).forEach(user => {
      if (user.country) {
        const count = listenerCountries.get(user.country) || 0;
        listenerCountries.set(user.country, count + 1);
      }
    });

    const totalPlays = Array.from(this.streams.values())
      .filter(s => trackIds.includes(s.trackId))
      .length;

    const totalLikes = Array.from(this.likes.values())
      .filter(l => trackIds.includes(l.trackId))
      .length;

    return {
      totalPlays,
      totalLikes,
      trackCount: artistTracks.length,
      streams,
      topTracks,
      listenerCountries,
    };
  }

  // Support system methods
  async sendSupport(data: InsertSupport): Promise<Support> {
    const id = randomUUID();
    // Mocked payment processing - in production would connect to Stripe/PayPal/Mobile Money
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const support: Support = {
      ...data,
      id,
      status: "completed",
      transactionId,
      createdAt: new Date(),
    };
    this.supports.set(id, support);

    // Update artist wallet
    const wallet = await this.getArtistWallet(data.artistId);
    if (wallet) {
      const updated = {
        ...wallet,
        totalReceived: wallet.totalReceived + data.amount,
        balance: wallet.balance + data.amount,
      };
      this.artistWallets.set(wallet.id, updated);
    }

    return support;
  }

  async getArtistSupports(artistId: string): Promise<Support[]> {
    return Array.from(this.supports.values())
      .filter(s => s.artistId === artistId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getArtistWallet(artistId: string): Promise<ArtistWallet | undefined> {
    return Array.from(this.artistWallets.values()).find(w => w.artistId === artistId);
  }

  async createOrUpdateArtistWallet(data: InsertArtistWallet): Promise<ArtistWallet> {
    const existing = await this.getArtistWallet(data.artistId);
    
    if (existing) {
      const updated = { ...existing, ...data };
      this.artistWallets.set(existing.id, updated);
      return updated;
    }

    const id = randomUUID();
    const wallet: ArtistWallet = {
      ...data,
      id,
      totalReceived: 0,
      balance: 0,
      lastPayoutAt: null,
      createdAt: new Date(),
    };
    this.artistWallets.set(id, wallet);
    return wallet;
  }

  async updateArtistWallet(artistId: string, updates: Partial<ArtistWallet>): Promise<ArtistWallet | undefined> {
    const wallet = await this.getArtistWallet(artistId);
    if (!wallet) return undefined;
    
    const updated = { ...wallet, ...updates };
    this.artistWallets.set(wallet.id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
