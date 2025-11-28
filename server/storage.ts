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
  type InsertArtistWallet,
  users,
  artistProfiles,
  tracks,
  playlists,
  playlistTracks,
  likes,
  streams,
  followers,
  trackComments,
  shares,
  playlistMembers,
  supports,
  artistWallets,
  userListeningHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, ilike, or, and, inArray, count } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  getArtistProfile(userId: string): Promise<ArtistProfile | undefined>;
  getArtistProfileById(id: string): Promise<ArtistProfile | undefined>;
  createArtistProfile(profile: InsertArtistProfile): Promise<ArtistProfile>;
  updateArtistProfile(id: string, updates: Partial<ArtistProfile>): Promise<ArtistProfile | undefined>;
  getArtistsByUniversity(university: string): Promise<ArtistProfile[]>;
  getAllArtists(): Promise<ArtistProfile[]>;

  getTrack(id: string): Promise<Track | undefined>;
  getTrackWithArtist(id: string): Promise<TrackWithArtist | undefined>;
  getTracksByArtist(artistId: string): Promise<Track[]>;
  getLatestTracks(limit?: number): Promise<TrackWithArtist[]>;
  getTrendingTracks(limit?: number): Promise<TrackWithArtist[]>;
  getTracksByUniversity(university: string): Promise<TrackWithArtist[]>;
  searchTracks(query: string): Promise<TrackWithArtist[]>;
  createTrack(track: InsertTrack): Promise<Track>;
  deleteTrack(trackId: string): Promise<void>;

  getPlaylist(id: string): Promise<Playlist | undefined>;
  getPlaylistsByUser(userId: string): Promise<Playlist[]>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  addTrackToPlaylist(data: InsertPlaylistTrack): Promise<PlaylistTrack>;
  removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void>;
  getPlaylistTracks(playlistId: string): Promise<TrackWithArtist[]>;

  likeTrack(data: InsertLike): Promise<Like>;
  unlikeTrack(userId: string, trackId: string): Promise<void>;
  getLikedTracks(userId: string): Promise<TrackWithArtist[]>;
  isTrackLiked(userId: string, trackId: string): Promise<boolean>;
  getLikeCount(trackId: string): Promise<number>;

  recordStream(data: InsertStream): Promise<Stream>;
  getStreamCount(trackId: string): Promise<number>;
  getArtistStats(artistId: string): Promise<{ totalPlays: number; totalLikes: number; trackCount: number }>;

  followArtist(data: InsertFollower): Promise<Follower>;
  unfollowArtist(userId: string, followerId: string): Promise<void>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  isFollowing(userId: string, followerId: string): Promise<boolean>;

  addComment(data: InsertTrackComment): Promise<TrackComment>;
  getTrackComments(trackId: string): Promise<TrackComment[]>;
  deleteComment(commentId: string): Promise<void>;

  shareTrack(data: InsertShare): Promise<Share>;
  getShareCount(trackId: string): Promise<number>;

  addPlaylistMember(data: InsertPlaylistMember): Promise<PlaylistMember>;
  removePlaylistMember(playlistId: string, userId: string): Promise<void>;
  getPlaylistMembers(playlistId: string): Promise<PlaylistMember[]>;

  getTracksByGenre(genre: string): Promise<TrackWithArtist[]>;
  getTopArtistsByGenre(genre: string, limit?: number): Promise<ArtistProfile[]>;
  getGenres(): Promise<string[]>;
  getUniversities(): Promise<string[]>;
  getPersonalizedRecommendations(userId: string, limit?: number): Promise<TrackWithArtist[]>;

  getArtistAnalytics(artistId: string): Promise<{
    totalPlays: number;
    totalLikes: number;
    trackCount: number;
    streams: Map<string, number>;
    topTracks: { trackId: string; plays: number }[];
    listenerCountries: Map<string, number>;
  }>;

  sendSupport(data: InsertSupport): Promise<Support>;
  getArtistSupports(artistId: string): Promise<Support[]>;
  getArtistWallet(artistId: string): Promise<ArtistWallet | undefined>;
  createArtistWallet(data: InsertArtistWallet): Promise<ArtistWallet>;
  createOrUpdateArtistWallet(data: InsertArtistWallet): Promise<ArtistWallet>;
  updateArtistWallet(artistId: string, updates: Partial<ArtistWallet>): Promise<ArtistWallet | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getArtistProfile(userId: string): Promise<ArtistProfile | undefined> {
    const [profile] = await db.select().from(artistProfiles).where(eq(artistProfiles.userId, userId));
    return profile || undefined;
  }

  async getArtistProfileById(id: string): Promise<ArtistProfile | undefined> {
    const [profile] = await db.select().from(artistProfiles).where(eq(artistProfiles.id, id));
    return profile || undefined;
  }

  async createArtistProfile(insertProfile: InsertArtistProfile): Promise<ArtistProfile> {
    const [profile] = await db
      .insert(artistProfiles)
      .values(insertProfile)
      .returning();
    
    await db
      .update(users)
      .set({ role: 'artist' })
      .where(eq(users.id, insertProfile.userId));
    
    return profile;
  }

  async updateArtistProfile(id: string, updates: Partial<ArtistProfile>): Promise<ArtistProfile | undefined> {
    const [profile] = await db
      .update(artistProfiles)
      .set(updates)
      .where(eq(artistProfiles.id, id))
      .returning();
    return profile || undefined;
  }

  async getArtistsByUniversity(university: string): Promise<ArtistProfile[]> {
    const tracksByUniversity = await db
      .select({ artistId: tracks.artistId })
      .from(tracks)
      .where(ilike(tracks.universityName, `%${university}%`));
    
    const artistIds = Array.from(new Set(tracksByUniversity.map(t => t.artistId)));
    if (artistIds.length === 0) return [];
    
    return await db.select().from(artistProfiles).where(inArray(artistProfiles.id, artistIds));
  }

  async getAllArtists(): Promise<ArtistProfile[]> {
    return await db.select().from(artistProfiles).orderBy(desc(artistProfiles.createdAt));
  }

  async getTrack(id: string): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
    return track || undefined;
  }

  async getTrackWithArtist(id: string): Promise<TrackWithArtist | undefined> {
    const track = await this.getTrack(id);
    if (!track) return undefined;
    
    const artist = await this.getArtistProfileById(track.artistId);
    if (!artist) return undefined;
    
    return { ...track, artist };
  }

  async getTracksByArtist(artistId: string): Promise<Track[]> {
    return await db.select().from(tracks).where(eq(tracks.artistId, artistId)).orderBy(desc(tracks.createdAt));
  }

  async getLatestTracks(limit: number = 20): Promise<TrackWithArtist[]> {
    const allTracks = await db
      .select()
      .from(tracks)
      .orderBy(desc(tracks.createdAt))
      .limit(limit);

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
    const streamCounts = await db
      .select({ trackId: streams.trackId, count: count() })
      .from(streams)
      .groupBy(streams.trackId)
      .orderBy(desc(count()))
      .limit(limit);

    const tracksWithArtists: TrackWithArtist[] = [];
    for (const { trackId } of streamCounts) {
      const trackWithArtist = await this.getTrackWithArtist(trackId);
      if (trackWithArtist) {
        tracksWithArtists.push(trackWithArtist);
      }
    }

    if (tracksWithArtists.length < limit) {
      const existingIds = tracksWithArtists.map(t => t.id);
      const latestTracks = await this.getLatestTracks(limit - tracksWithArtists.length);
      for (const track of latestTracks) {
        if (!existingIds.includes(track.id)) {
          tracksWithArtists.push(track);
        }
      }
    }

    return tracksWithArtists;
  }

  async getTracksByUniversity(university: string): Promise<TrackWithArtist[]> {
    const allTracks = await db
      .select()
      .from(tracks)
      .where(ilike(tracks.universityName, `%${university}%`));

    const tracksWithArtists: TrackWithArtist[] = [];
    for (const track of allTracks) {
      const artist = await this.getArtistProfileById(track.artistId);
      if (artist) {
        tracksWithArtists.push({ ...track, artist });
      }
    }
    return tracksWithArtists;
  }

  async searchTracks(query: string): Promise<TrackWithArtist[]> {
    const allTracks = await db
      .select()
      .from(tracks)
      .where(
        or(
          ilike(tracks.title, `%${query}%`),
          ilike(tracks.genre, `%${query}%`),
          ilike(tracks.universityName, `%${query}%`)
        )
      );

    const tracksWithArtists: TrackWithArtist[] = [];
    for (const track of allTracks) {
      const artist = await this.getArtistProfileById(track.artistId);
      if (artist) {
        tracksWithArtists.push({ ...track, artist });
      }
    }
    return tracksWithArtists;
  }

  async createTrack(insertTrack: InsertTrack): Promise<Track> {
    const [track] = await db
      .insert(tracks)
      .values(insertTrack)
      .returning();
    return track;
  }

  async deleteTrack(trackId: string): Promise<void> {
    await db.delete(tracks).where(eq(tracks.id, trackId));
  }

  async getPlaylist(id: string): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
    return playlist || undefined;
  }

  async getPlaylistsByUser(userId: string): Promise<Playlist[]> {
    return await db.select().from(playlists).where(eq(playlists.userId, userId));
  }

  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const [playlist] = await db
      .insert(playlists)
      .values(insertPlaylist)
      .returning();
    return playlist;
  }

  async addTrackToPlaylist(data: InsertPlaylistTrack): Promise<PlaylistTrack> {
    const [playlistTrack] = await db
      .insert(playlistTracks)
      .values(data)
      .returning();
    return playlistTrack;
  }

  async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    await db
      .delete(playlistTracks)
      .where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId)));
  }

  async getPlaylistTracks(playlistId: string): Promise<TrackWithArtist[]> {
    const pts = await db
      .select()
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, playlistId));

    const tracksWithArtists: TrackWithArtist[] = [];
    for (const pt of pts) {
      const trackWithArtist = await this.getTrackWithArtist(pt.trackId);
      if (trackWithArtist) {
        tracksWithArtists.push(trackWithArtist);
      }
    }
    return tracksWithArtists;
  }

  async likeTrack(data: InsertLike): Promise<Like> {
    const [like] = await db
      .insert(likes)
      .values(data)
      .returning();
    return like;
  }

  async unlikeTrack(userId: string, trackId: string): Promise<void> {
    await db
      .delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.trackId, trackId)));
  }

  async getLikedTracks(userId: string): Promise<TrackWithArtist[]> {
    const userLikes = await db
      .select()
      .from(likes)
      .where(eq(likes.userId, userId));

    const tracksWithArtists: TrackWithArtist[] = [];
    for (const like of userLikes) {
      const trackWithArtist = await this.getTrackWithArtist(like.trackId);
      if (trackWithArtist) {
        tracksWithArtists.push(trackWithArtist);
      }
    }
    return tracksWithArtists;
  }

  async isTrackLiked(userId: string, trackId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.trackId, trackId)));
    return !!like;
  }

  async getLikeCount(trackId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(likes)
      .where(eq(likes.trackId, trackId));
    return result?.count || 0;
  }

  async recordStream(data: InsertStream): Promise<Stream> {
    const [stream] = await db
      .insert(streams)
      .values(data)
      .returning();
    
    const track = await this.getTrack(data.trackId);
    if (track) {
      const existing = await db
        .select()
        .from(userListeningHistory)
        .where(and(
          eq(userListeningHistory.userId, data.userId),
          eq(userListeningHistory.trackId, data.trackId)
        ));

      if (existing.length > 0) {
        await db
          .update(userListeningHistory)
          .set({ 
            listeningCount: sql`${userListeningHistory.listeningCount} + 1`,
            lastPlayedAt: new Date()
          })
          .where(eq(userListeningHistory.id, existing[0].id));
      } else {
        await db
          .insert(userListeningHistory)
          .values({
            userId: data.userId,
            trackId: data.trackId,
            genre: track.genre
          });
      }
    }

    return stream;
  }

  async getStreamCount(trackId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(streams)
      .where(eq(streams.trackId, trackId));
    return result?.count || 0;
  }

  async getArtistStats(artistId: string): Promise<{ totalPlays: number; totalLikes: number; trackCount: number }> {
    const artistTracks = await this.getTracksByArtist(artistId);
    const trackIds = artistTracks.map(t => t.id);
    
    if (trackIds.length === 0) {
      return { totalPlays: 0, totalLikes: 0, trackCount: 0 };
    }

    const [playsResult] = await db
      .select({ count: count() })
      .from(streams)
      .where(inArray(streams.trackId, trackIds));

    const [likesResult] = await db
      .select({ count: count() })
      .from(likes)
      .where(inArray(likes.trackId, trackIds));

    return {
      totalPlays: playsResult?.count || 0,
      totalLikes: likesResult?.count || 0,
      trackCount: artistTracks.length,
    };
  }

  async followArtist(data: InsertFollower): Promise<Follower> {
    const [follower] = await db
      .insert(followers)
      .values(data)
      .returning();
    return follower;
  }

  async unfollowArtist(userId: string, followerId: string): Promise<void> {
    await db
      .delete(followers)
      .where(and(eq(followers.userId, userId), eq(followers.followerId, followerId)));
  }

  async getFollowers(userId: string): Promise<User[]> {
    const followerRecords = await db
      .select()
      .from(followers)
      .where(eq(followers.userId, userId));

    const followerUsers: User[] = [];
    for (const f of followerRecords) {
      const user = await this.getUser(f.followerId);
      if (user) followerUsers.push(user);
    }
    return followerUsers;
  }

  async getFollowing(userId: string): Promise<User[]> {
    const followingRecords = await db
      .select()
      .from(followers)
      .where(eq(followers.followerId, userId));

    const followingUsers: User[] = [];
    for (const f of followingRecords) {
      const user = await this.getUser(f.userId);
      if (user) followingUsers.push(user);
    }
    return followingUsers;
  }

  async isFollowing(userId: string, followerId: string): Promise<boolean> {
    const [record] = await db
      .select()
      .from(followers)
      .where(and(eq(followers.userId, userId), eq(followers.followerId, followerId)));
    return !!record;
  }

  async addComment(data: InsertTrackComment): Promise<TrackComment> {
    const [comment] = await db
      .insert(trackComments)
      .values(data)
      .returning();
    return comment;
  }

  async getTrackComments(trackId: string): Promise<TrackComment[]> {
    return await db
      .select()
      .from(trackComments)
      .where(eq(trackComments.trackId, trackId))
      .orderBy(desc(trackComments.createdAt));
  }

  async deleteComment(commentId: string): Promise<void> {
    await db.delete(trackComments).where(eq(trackComments.id, commentId));
  }

  async shareTrack(data: InsertShare): Promise<Share> {
    const [share] = await db
      .insert(shares)
      .values(data)
      .returning();
    return share;
  }

  async getShareCount(trackId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(shares)
      .where(eq(shares.trackId, trackId));
    return result?.count || 0;
  }

  async addPlaylistMember(data: InsertPlaylistMember): Promise<PlaylistMember> {
    const [member] = await db
      .insert(playlistMembers)
      .values(data)
      .returning();
    return member;
  }

  async removePlaylistMember(playlistId: string, userId: string): Promise<void> {
    await db
      .delete(playlistMembers)
      .where(and(eq(playlistMembers.playlistId, playlistId), eq(playlistMembers.userId, userId)));
  }

  async getPlaylistMembers(playlistId: string): Promise<PlaylistMember[]> {
    return await db
      .select()
      .from(playlistMembers)
      .where(eq(playlistMembers.playlistId, playlistId));
  }

  async getTracksByGenre(genre: string): Promise<TrackWithArtist[]> {
    const genreTracks = await db
      .select()
      .from(tracks)
      .where(ilike(tracks.genre, genre));

    const tracksWithArtists: TrackWithArtist[] = [];
    for (const track of genreTracks) {
      const artist = await this.getArtistProfileById(track.artistId);
      if (artist) {
        tracksWithArtists.push({ ...track, artist });
      }
    }
    return tracksWithArtists;
  }

  async getTopArtistsByGenre(genre: string, limit: number = 10): Promise<ArtistProfile[]> {
    const genreTracks = await db
      .select()
      .from(tracks)
      .where(ilike(tracks.genre, genre));

    const artistCounts = new Map<string, number>();
    genreTracks.forEach(t => {
      artistCounts.set(t.artistId, (artistCounts.get(t.artistId) || 0) + 1);
    });

    const sortedArtistIds = Array.from(artistCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    const artistsList: ArtistProfile[] = [];
    for (const artistId of sortedArtistIds) {
      const artist = await this.getArtistProfileById(artistId);
      if (artist) artistsList.push(artist);
    }
    return artistsList;
  }

  async getGenres(): Promise<string[]> {
    const result = await db
      .selectDistinct({ genre: tracks.genre })
      .from(tracks);
    return result.map(r => r.genre).filter(Boolean).sort();
  }

  async getUniversities(): Promise<string[]> {
    const result = await db
      .selectDistinct({ universityName: tracks.universityName })
      .from(tracks);
    return result.map(r => r.universityName).filter(u => u && u !== 'Unknown').sort();
  }

  async getPersonalizedRecommendations(userId: string, limit: number = 20): Promise<TrackWithArtist[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    const likedTracks = await this.getLikedTracks(userId);
    const likedTrackIds = likedTracks.map(t => t.id);
    const likedGenres = Array.from(new Set(likedTracks.map(t => t.genre)));

    if (likedGenres.length === 0) {
      return this.getLatestTracks(limit);
    }

    const recommendations: TrackWithArtist[] = [];
    for (const genre of likedGenres) {
      const genreTracks = await this.getTracksByGenre(genre);
      for (const track of genreTracks) {
        if (!likedTrackIds.includes(track.id) && recommendations.length < limit) {
          recommendations.push(track);
        }
      }
    }

    return recommendations.slice(0, limit);
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

    if (trackIds.length === 0) {
      return {
        totalPlays: 0,
        totalLikes: 0,
        trackCount: 0,
        streams: new Map(),
        topTracks: [],
        listenerCountries: new Map(),
      };
    }

    const streamsData = await db
      .select({ trackId: streams.trackId, count: count() })
      .from(streams)
      .where(inArray(streams.trackId, trackIds))
      .groupBy(streams.trackId);

    const streamsMap = new Map<string, number>();
    streamsData.forEach(s => streamsMap.set(s.trackId, s.count));

    const topTracks = streamsData
      .map(s => ({ trackId: s.trackId, plays: s.count }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 10);

    const [totalPlaysResult] = await db
      .select({ count: count() })
      .from(streams)
      .where(inArray(streams.trackId, trackIds));

    const [totalLikesResult] = await db
      .select({ count: count() })
      .from(likes)
      .where(inArray(likes.trackId, trackIds));

    const allUsers = await db.select().from(users);
    const listenerCountries = new Map<string, number>();
    allUsers.forEach(user => {
      if (user.country) {
        listenerCountries.set(user.country, (listenerCountries.get(user.country) || 0) + 1);
      }
    });

    return {
      totalPlays: totalPlaysResult?.count || 0,
      totalLikes: totalLikesResult?.count || 0,
      trackCount: artistTracks.length,
      streams: streamsMap,
      topTracks,
      listenerCountries,
    };
  }

  async sendSupport(data: InsertSupport): Promise<Support> {
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [support] = await db
      .insert(supports)
      .values({
        ...data,
        status: "completed",
        transactionId,
      })
      .returning();

    let wallet = await this.getArtistWallet(data.artistId);
    if (!wallet) {
      wallet = await this.createArtistWallet({ artistId: data.artistId });
    }
    
    await db
      .update(artistWallets)
      .set({
        totalReceived: sql`${artistWallets.totalReceived} + ${data.amount}`,
        balance: sql`${artistWallets.balance} + ${data.amount}`,
      })
      .where(eq(artistWallets.artistId, data.artistId));

    return support;
  }

  async getArtistSupports(artistId: string): Promise<Support[]> {
    return await db
      .select()
      .from(supports)
      .where(eq(supports.artistId, artistId))
      .orderBy(desc(supports.createdAt));
  }

  async getArtistWallet(artistId: string): Promise<ArtistWallet | undefined> {
    const [wallet] = await db
      .select()
      .from(artistWallets)
      .where(eq(artistWallets.artistId, artistId));
    return wallet || undefined;
  }

  async createArtistWallet(data: InsertArtistWallet): Promise<ArtistWallet> {
    const [wallet] = await db
      .insert(artistWallets)
      .values(data)
      .returning();
    return wallet;
  }

  async createOrUpdateArtistWallet(data: InsertArtistWallet): Promise<ArtistWallet> {
    const existing = await this.getArtistWallet(data.artistId);
    
    if (existing) {
      const [updated] = await db
        .update(artistWallets)
        .set(data)
        .where(eq(artistWallets.artistId, data.artistId))
        .returning();
      return updated;
    }

    const [wallet] = await db
      .insert(artistWallets)
      .values(data)
      .returning();
    return wallet;
  }

  async updateArtistWallet(artistId: string, updates: Partial<ArtistWallet>): Promise<ArtistWallet | undefined> {
    const [wallet] = await db
      .update(artistWallets)
      .set(updates)
      .where(eq(artistWallets.artistId, artistId))
      .returning();
    return wallet || undefined;
  }
}

export const storage = new DatabaseStorage();
