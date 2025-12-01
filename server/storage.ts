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
  type ArtistConnection,
  type InsertArtistConnection,
  type ArtistMessage,
  type InsertArtistMessage,
  type ArtistConnectionWithProfiles,
  type ConversationPreview,
  type UserConnection,
  type InsertUserConnection,
  type DirectMessage,
  type InsertDirectMessage,
  type UserConnectionWithUsers,
  type UserConversationPreview,
  type ArtistPost,
  type InsertArtistPost,
  type PostLike,
  type InsertPostComment,
  type PostComment,
  type PostShare,
  type ArtistPostWithDetails,
  type PostCommentWithUser,
  type CommentSticker,
  type InsertCommentSticker,
  type University,
  type ListenerFavoriteArtist,
  type ListenerFavoriteGenre,
  commentStickers,
  universities,
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
  userListeningHistory,
  artistConnections,
  artistMessages,
  userConnections,
  directMessages,
  artistPosts,
  postLikes,
  postComments,
  postShares,
  listenerFavoriteArtists,
  listenerFavoriteGenres
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, ilike, or, and, inArray, count, gte, lt } from "drizzle-orm";
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
  updatePlaylist(id: string, updates: Partial<Playlist>): Promise<Playlist | undefined>;
  deletePlaylist(id: string): Promise<void>;
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
  getAllUniversitiesWithDetails(): Promise<University[]>;
  getUniversityByDomain(domain: string): Promise<University | undefined>;
  getPersonalizedRecommendations(userId: string, limit?: number): Promise<TrackWithArtist[]>;

  getArtistAnalytics(artistId: string): Promise<{
    totalPlays: number;
    totalLikes: number;
    trackCount: number;
    streams: Map<string, number>;
    topTracks: { trackId: string; plays: number }[];
    listenerCountries: Map<string, number>;
  }>;

  getEnhancedArtistAnalytics(artistId: string): Promise<{
    // Core metrics
    totalPlays: number;
    totalLikes: number;
    trackCount: number;
    uniqueListeners: number;
    followerCount: number;
    totalSupport: number;
    
    // Trend data (vs previous period)
    playsTrend: number;
    likesTrend: number;
    listenersTrend: number;
    followersTrend: number;
    
    // Time series (last 30 days)
    playsOverTime: { date: string; plays: number }[];
    
    // Top tracks with details
    topTracks: { 
      id: string;
      title: string;
      coverArt: string | null;
      plays: number;
      likes: number;
      shares: number;
    }[];
    
    // Listener insights
    listenersByUniversity: { university: string; count: number }[];
    peakListeningHours: { hour: number; count: number }[];
    
    // Recent activity
    recentActivity: {
      type: 'play' | 'like' | 'follow' | 'support' | 'share';
      userId: string;
      userName: string;
      trackTitle?: string;
      amount?: number;
      timestamp: Date;
    }[];
    
    // Milestones
    milestones: {
      id: string;
      title: string;
      description: string;
      achieved: boolean;
      progress: number;
      target: number;
      icon: string;
    }[];
  }>;

  sendSupport(data: InsertSupport): Promise<Support>;
  getArtistSupports(artistId: string): Promise<Support[]>;
  getArtistSupporterCount(artistId: string): Promise<number>;
  getArtistWallet(artistId: string): Promise<ArtistWallet | undefined>;
  createArtistWallet(data: InsertArtistWallet): Promise<ArtistWallet>;
  createOrUpdateArtistWallet(data: InsertArtistWallet): Promise<ArtistWallet>;
  updateArtistWallet(artistId: string, updates: Partial<ArtistWallet>): Promise<ArtistWallet | undefined>;

  createConnection(data: InsertArtistConnection): Promise<ArtistConnection>;
  getConnection(id: string): Promise<ArtistConnection | undefined>;
  getConnectionBetweenArtists(artistId1: string, artistId2: string): Promise<ArtistConnection | undefined>;
  updateConnectionStatus(id: string, status: string): Promise<ArtistConnection | undefined>;
  getPendingConnectionRequests(artistId: string): Promise<ArtistConnectionWithProfiles[]>;
  getAcceptedConnections(artistId: string): Promise<ArtistConnectionWithProfiles[]>;
  getSentConnectionRequests(artistId: string): Promise<ArtistConnectionWithProfiles[]>;
  deleteConnection(id: string): Promise<void>;

  sendMessage(data: InsertArtistMessage): Promise<ArtistMessage>;
  getMessages(connectionId: string, limit?: number): Promise<ArtistMessage[]>;
  markMessagesAsRead(connectionId: string, readerId: string): Promise<void>;
  getUnreadMessageCount(artistId: string): Promise<number>;
  getConversations(artistId: string): Promise<ConversationPreview[]>;

  // User connections (social chat for all users)
  createUserConnection(data: InsertUserConnection): Promise<UserConnection>;
  getUserConnection(id: string): Promise<UserConnection | undefined>;
  getUserConnectionBetweenUsers(userId1: string, userId2: string): Promise<UserConnection | undefined>;
  updateUserConnectionStatus(id: string, status: string): Promise<UserConnection | undefined>;
  getPendingUserConnectionRequests(userId: string): Promise<UserConnectionWithUsers[]>;
  getAcceptedUserConnections(userId: string): Promise<UserConnectionWithUsers[]>;
  getSentUserConnectionRequests(userId: string): Promise<UserConnectionWithUsers[]>;
  deleteUserConnection(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;

  // Direct messages
  sendDirectMessage(data: InsertDirectMessage): Promise<DirectMessage>;
  getDirectMessages(connectionId: string, limit?: number): Promise<DirectMessage[]>;
  markDirectMessagesAsRead(connectionId: string, readerId: string): Promise<void>;
  getUnreadDirectMessageCount(userId: string): Promise<number>;
  getUserConversations(userId: string): Promise<UserConversationPreview[]>;

  // Social feed
  createPost(data: InsertArtistPost): Promise<ArtistPost>;
  getPost(id: string): Promise<ArtistPostWithDetails | undefined>;
  getFeedPosts(userId: string, limit?: number, offset?: number): Promise<ArtistPostWithDetails[]>;
  getArtistPosts(artistId: string): Promise<ArtistPostWithDetails[]>;
  deletePost(postId: string): Promise<void>;
  
  likePost(postId: string, userId: string): Promise<PostLike>;
  unlikePost(postId: string, userId: string): Promise<void>;
  isPostLiked(postId: string, userId: string): Promise<boolean>;
  
  createPostComment(data: InsertPostComment): Promise<PostComment>;
  getPostComments(postId: string): Promise<PostCommentWithUser[]>;
  deletePostComment(commentId: string): Promise<void>;
  
  sharePost(postId: string, sharedByUserId: string, sharedToUserId: string): Promise<PostShare>;
  getPostShares(postId: string): Promise<PostShare[]>;

  // Comment stickers
  addCommentSticker(data: InsertCommentSticker): Promise<CommentSticker>;
  getCommentStickers(commentId: string): Promise<CommentSticker[]>;
  deleteCommentSticker(stickerId: string): Promise<void>;

  // Listener music preferences
  addFavoriteArtist(userId: string, artistId: string): Promise<ListenerFavoriteArtist>;
  removeFavoriteArtist(userId: string, artistId: string): Promise<void>;
  getFavoriteArtists(userId: string): Promise<(ListenerFavoriteArtist & { artist: ArtistProfile })[]>;
  
  addFavoriteGenre(userId: string, genre: string): Promise<ListenerFavoriteGenre>;
  removeFavoriteGenre(userId: string, genre: string): Promise<void>;
  getFavoriteGenres(userId: string): Promise<ListenerFavoriteGenre[]>;
  
  // Friend suggestions based on music taste
  getSuggestedFriends(userId: string, limit?: number): Promise<{ user: User; similarityScore: number; commonArtists: string[]; commonGenres: string[] }[]>;
  
  // Get shared music taste between two users
  getSharedMusicTaste(userId1: string, userId2: string): Promise<{ similarityScore: number; commonArtists: { id: string; artistName: string }[]; commonGenres: string[] }>;
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
      const latestTracks = await this.getLatestTracks(limit);
      for (const track of latestTracks) {
        if (!existingIds.includes(track.id)) {
          tracksWithArtists.push(track);
          if (tracksWithArtists.length >= limit) break;
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

  async updatePlaylist(id: string, updates: Partial<Playlist>): Promise<Playlist | undefined> {
    const [playlist] = await db
      .update(playlists)
      .set(updates)
      .where(eq(playlists.id, id))
      .returning();
    return playlist || undefined;
  }

  async deletePlaylist(id: string): Promise<void> {
    await db.delete(playlists).where(eq(playlists.id, id));
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

  async getAllUniversitiesWithDetails(): Promise<University[]> {
    return await db.select().from(universities).orderBy(universities.name);
  }

  async getUniversityByDomain(domain: string): Promise<University | undefined> {
    const [university] = await db
      .select()
      .from(universities)
      .where(eq(universities.domain, domain));
    return university || undefined;
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

  async getEnhancedArtistAnalytics(artistId: string): Promise<{
    totalPlays: number;
    totalLikes: number;
    trackCount: number;
    uniqueListeners: number;
    followerCount: number;
    totalSupport: number;
    playsTrend: number;
    likesTrend: number;
    listenersTrend: number;
    followersTrend: number;
    playsOverTime: { date: string; plays: number }[];
    topTracks: { 
      id: string;
      title: string;
      coverArt: string | null;
      plays: number;
      likes: number;
      shares: number;
    }[];
    listenersByUniversity: { university: string; count: number }[];
    peakListeningHours: { hour: number; count: number }[];
    recentActivity: {
      type: 'play' | 'like' | 'follow' | 'support' | 'share';
      userId: string;
      userName: string;
      trackTitle?: string;
      amount?: number;
      timestamp: Date;
    }[];
    milestones: {
      id: string;
      title: string;
      description: string;
      achieved: boolean;
      progress: number;
      target: number;
      icon: string;
    }[];
  }> {
    const artistTracks = await this.getTracksByArtist(artistId);
    const trackIds = artistTracks.map(t => t.id);
    
    // Get artist profile for user ID (needed for followers)
    const [artistProfile] = await db.select().from(artistProfiles).where(eq(artistProfiles.id, artistId));
    const artistUserId = artistProfile?.userId;

    // Default empty response
    const emptyResponse = {
      totalPlays: 0,
      totalLikes: 0,
      trackCount: 0,
      uniqueListeners: 0,
      followerCount: 0,
      totalSupport: 0,
      playsTrend: 0,
      likesTrend: 0,
      listenersTrend: 0,
      followersTrend: 0,
      playsOverTime: [] as { date: string; plays: number }[],
      topTracks: [] as { id: string; title: string; coverArt: string | null; plays: number; likes: number; shares: number }[],
      listenersByUniversity: [] as { university: string; count: number }[],
      peakListeningHours: [] as { hour: number; count: number }[],
      recentActivity: [] as { type: 'play' | 'like' | 'follow' | 'support' | 'share'; userId: string; userName: string; trackTitle?: string; amount?: number; timestamp: Date }[],
      milestones: [] as { id: string; title: string; description: string; achieved: boolean; progress: number; target: number; icon: string }[],
    };

    // Core metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Total plays
    const [totalPlaysResult] = trackIds.length > 0 
      ? await db.select({ count: count() }).from(streams).where(inArray(streams.trackId, trackIds))
      : [{ count: 0 }];
    const totalPlays = totalPlaysResult?.count || 0;

    // Total likes
    const [totalLikesResult] = trackIds.length > 0
      ? await db.select({ count: count() }).from(likes).where(inArray(likes.trackId, trackIds))
      : [{ count: 0 }];
    const totalLikes = totalLikesResult?.count || 0;

    // Unique listeners
    const uniqueListenersData = trackIds.length > 0
      ? await db.selectDistinct({ userId: streams.userId }).from(streams).where(inArray(streams.trackId, trackIds))
      : [];
    const uniqueListeners = uniqueListenersData.length;

    // Follower count
    const [followerCountResult] = artistUserId
      ? await db.select({ count: count() }).from(followers).where(eq(followers.userId, artistUserId))
      : [{ count: 0 }];
    const followerCount = followerCountResult?.count || 0;

    // Total support received
    const supportsData = await db.select().from(supports).where(eq(supports.artistId, artistId));
    const totalSupport = supportsData.reduce((sum, s) => sum + s.amount, 0);

    // Trend calculations (last 30 days vs previous 30 days)
    const [currentPlays] = trackIds.length > 0
      ? await db.select({ count: count() }).from(streams)
          .where(and(inArray(streams.trackId, trackIds), gte(streams.playedAt, thirtyDaysAgo)))
      : [{ count: 0 }];
    const [previousPlays] = trackIds.length > 0
      ? await db.select({ count: count() }).from(streams)
          .where(and(inArray(streams.trackId, trackIds), gte(streams.playedAt, sixtyDaysAgo), lt(streams.playedAt, thirtyDaysAgo)))
      : [{ count: 0 }];
    const playsTrend = previousPlays?.count ? Math.round(((currentPlays?.count || 0) - previousPlays.count) / previousPlays.count * 100) : 0;

    const [currentLikes] = trackIds.length > 0
      ? await db.select({ count: count() }).from(likes)
          .where(and(inArray(likes.trackId, trackIds), gte(likes.createdAt, thirtyDaysAgo)))
      : [{ count: 0 }];
    const [previousLikes] = trackIds.length > 0
      ? await db.select({ count: count() }).from(likes)
          .where(and(inArray(likes.trackId, trackIds), gte(likes.createdAt, sixtyDaysAgo), lt(likes.createdAt, thirtyDaysAgo)))
      : [{ count: 0 }];
    const likesTrend = previousLikes?.count ? Math.round(((currentLikes?.count || 0) - previousLikes.count) / previousLikes.count * 100) : 0;

    // Plays over time (last 30 days)
    const playsOverTime: { date: string; plays: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      const [dayPlays] = trackIds.length > 0
        ? await db.select({ count: count() }).from(streams)
            .where(and(inArray(streams.trackId, trackIds), gte(streams.playedAt, date), lt(streams.playedAt, nextDate)))
        : [{ count: 0 }];
      
      playsOverTime.push({ date: dateStr, plays: dayPlays?.count || 0 });
    }

    // Top tracks with full details
    const topTracksData: { id: string; title: string; coverArt: string | null; plays: number; likes: number; shares: number }[] = [];
    for (const track of artistTracks.slice(0, 5)) {
      const [playsCount] = await db.select({ count: count() }).from(streams).where(eq(streams.trackId, track.id));
      const [likesCount] = await db.select({ count: count() }).from(likes).where(eq(likes.trackId, track.id));
      const [sharesCount] = await db.select({ count: count() }).from(shares).where(eq(shares.trackId, track.id));
      
      topTracksData.push({
        id: track.id,
        title: track.title,
        coverArt: track.coverImageUrl,
        plays: playsCount?.count || 0,
        likes: likesCount?.count || 0,
        shares: sharesCount?.count || 0,
      });
    }
    topTracksData.sort((a, b) => b.plays - a.plays);

    // Listeners by university
    const listenersByUniversity: { university: string; count: number }[] = [];
    if (trackIds.length > 0) {
      const listenerUserIds = await db.selectDistinct({ userId: streams.userId }).from(streams).where(inArray(streams.trackId, trackIds));
      const userIds = listenerUserIds.map(u => u.userId);
      
      if (userIds.length > 0) {
        const listenerUsers = await db.select().from(users).where(inArray(users.id, userIds));
        const universityMap = new Map<string, number>();
        
        listenerUsers.forEach(user => {
          const uni = user.universityName || 'Unknown';
          universityMap.set(uni, (universityMap.get(uni) || 0) + 1);
        });
        
        universityMap.forEach((count, university) => {
          if (university !== 'Unknown') {
            listenersByUniversity.push({ university, count });
          }
        });
        listenersByUniversity.sort((a, b) => b.count - a.count);
      }
    }

    // Peak listening hours (0-23)
    const peakListeningHours: { hour: number; count: number }[] = [];
    const hourCounts = new Array(24).fill(0);
    if (trackIds.length > 0) {
      const recentStreams = await db.select().from(streams)
        .where(and(inArray(streams.trackId, trackIds), gte(streams.playedAt, thirtyDaysAgo)));
      
      recentStreams.forEach(stream => {
        const hour = new Date(stream.playedAt).getHours();
        hourCounts[hour]++;
      });
    }
    for (let hour = 0; hour < 24; hour++) {
      peakListeningHours.push({ hour, count: hourCounts[hour] });
    }

    // Recent activity (last 20 items)
    const recentActivity: { type: 'play' | 'like' | 'follow' | 'support' | 'share'; userId: string; userName: string; trackTitle?: string; amount?: number; timestamp: Date }[] = [];
    
    // Get recent plays
    if (trackIds.length > 0) {
      const recentPlays = await db.select().from(streams)
        .where(inArray(streams.trackId, trackIds))
        .orderBy(desc(streams.playedAt))
        .limit(10);
      
      for (const play of recentPlays) {
        const user = await this.getUser(play.userId);
        const track = artistTracks.find(t => t.id === play.trackId);
        if (user) {
          recentActivity.push({
            type: 'play',
            userId: user.id,
            userName: user.fullName,
            trackTitle: track?.title,
            timestamp: play.playedAt,
          });
        }
      }
    }
    
    // Get recent likes
    if (trackIds.length > 0) {
      const recentLikes = await db.select().from(likes)
        .where(inArray(likes.trackId, trackIds))
        .orderBy(desc(likes.createdAt))
        .limit(10);
      
      for (const like of recentLikes) {
        const user = await this.getUser(like.userId);
        const track = artistTracks.find(t => t.id === like.trackId);
        if (user) {
          recentActivity.push({
            type: 'like',
            userId: user.id,
            userName: user.fullName,
            trackTitle: track?.title,
            timestamp: like.createdAt,
          });
        }
      }
    }
    
    // Get recent supports
    const recentSupports = await db.select().from(supports)
      .where(eq(supports.artistId, artistId))
      .orderBy(desc(supports.createdAt))
      .limit(5);
    
    for (const support of recentSupports) {
      const user = await this.getUser(support.supporterId);
      if (user) {
        recentActivity.push({
          type: 'support',
          userId: user.id,
          userName: user.fullName,
          amount: support.amount,
          timestamp: support.createdAt,
        });
      }
    }
    
    // Sort by timestamp and limit
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedActivity = recentActivity.slice(0, 20);

    // Milestones
    const milestones = [
      {
        id: 'first_track',
        title: 'First Track',
        description: 'Upload your first track',
        achieved: artistTracks.length >= 1,
        progress: Math.min(artistTracks.length, 1),
        target: 1,
        icon: 'music',
      },
      {
        id: 'five_tracks',
        title: 'Rising Artist',
        description: 'Upload 5 tracks',
        achieved: artistTracks.length >= 5,
        progress: Math.min(artistTracks.length, 5),
        target: 5,
        icon: 'disc',
      },
      {
        id: 'hundred_plays',
        title: 'Getting Noticed',
        description: 'Reach 100 total plays',
        achieved: totalPlays >= 100,
        progress: Math.min(totalPlays, 100),
        target: 100,
        icon: 'play',
      },
      {
        id: 'thousand_plays',
        title: 'Campus Star',
        description: 'Reach 1,000 total plays',
        achieved: totalPlays >= 1000,
        progress: Math.min(totalPlays, 1000),
        target: 1000,
        icon: 'star',
      },
      {
        id: 'fifty_likes',
        title: 'Fan Favorite',
        description: 'Get 50 likes on your tracks',
        achieved: totalLikes >= 50,
        progress: Math.min(totalLikes, 50),
        target: 50,
        icon: 'heart',
      },
      {
        id: 'ten_followers',
        title: 'Building a Fanbase',
        description: 'Get 10 followers',
        achieved: followerCount >= 10,
        progress: Math.min(followerCount, 10),
        target: 10,
        icon: 'users',
      },
      {
        id: 'first_support',
        title: 'First Supporter',
        description: 'Receive your first tip',
        achieved: supportsData.length >= 1,
        progress: Math.min(supportsData.length, 1),
        target: 1,
        icon: 'dollar-sign',
      },
      {
        id: 'five_universities',
        title: 'Multi-Campus',
        description: 'Listeners from 5 different universities',
        achieved: listenersByUniversity.length >= 5,
        progress: Math.min(listenersByUniversity.length, 5),
        target: 5,
        icon: 'graduation-cap',
      },
    ];

    return {
      totalPlays,
      totalLikes,
      trackCount: artistTracks.length,
      uniqueListeners,
      followerCount,
      totalSupport,
      playsTrend,
      likesTrend,
      listenersTrend: 0, // Would need more tracking to calculate
      followersTrend: 0, // Would need more tracking to calculate
      playsOverTime,
      topTracks: topTracksData,
      listenersByUniversity,
      peakListeningHours,
      recentActivity: limitedActivity,
      milestones,
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

  async getArtistSupporterCount(artistId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(distinct ${supports.supporterId})` })
      .from(supports)
      .where(eq(supports.artistId, artistId));
    return result[0]?.count || 0;
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

  async createConnection(data: InsertArtistConnection): Promise<ArtistConnection> {
    const [connection] = await db
      .insert(artistConnections)
      .values(data)
      .returning();
    return connection;
  }

  async getConnection(id: string): Promise<ArtistConnection | undefined> {
    const [connection] = await db
      .select()
      .from(artistConnections)
      .where(eq(artistConnections.id, id));
    return connection || undefined;
  }

  async getConnectionBetweenArtists(artistId1: string, artistId2: string): Promise<ArtistConnection | undefined> {
    const [connection] = await db
      .select()
      .from(artistConnections)
      .where(
        or(
          and(
            eq(artistConnections.requesterId, artistId1),
            eq(artistConnections.receiverId, artistId2)
          ),
          and(
            eq(artistConnections.requesterId, artistId2),
            eq(artistConnections.receiverId, artistId1)
          )
        )
      );
    return connection || undefined;
  }

  async updateConnectionStatus(id: string, status: string): Promise<ArtistConnection | undefined> {
    const [connection] = await db
      .update(artistConnections)
      .set({ status, respondedAt: new Date() })
      .where(eq(artistConnections.id, id))
      .returning();
    return connection || undefined;
  }

  async getPendingConnectionRequests(artistId: string): Promise<ArtistConnectionWithProfiles[]> {
    const connections = await db
      .select()
      .from(artistConnections)
      .where(
        and(
          eq(artistConnections.receiverId, artistId),
          eq(artistConnections.status, "pending")
        )
      )
      .orderBy(desc(artistConnections.createdAt));

    const result: ArtistConnectionWithProfiles[] = [];
    for (const conn of connections) {
      const requester = await this.getArtistProfileById(conn.requesterId);
      const receiver = await this.getArtistProfileById(conn.receiverId);
      if (requester && receiver) {
        result.push({ ...conn, requester, receiver });
      }
    }
    return result;
  }

  async getAcceptedConnections(artistId: string): Promise<ArtistConnectionWithProfiles[]> {
    const connections = await db
      .select()
      .from(artistConnections)
      .where(
        and(
          or(
            eq(artistConnections.requesterId, artistId),
            eq(artistConnections.receiverId, artistId)
          ),
          eq(artistConnections.status, "accepted")
        )
      )
      .orderBy(desc(artistConnections.respondedAt));

    const result: ArtistConnectionWithProfiles[] = [];
    for (const conn of connections) {
      const requester = await this.getArtistProfileById(conn.requesterId);
      const receiver = await this.getArtistProfileById(conn.receiverId);
      if (requester && receiver) {
        result.push({ ...conn, requester, receiver });
      }
    }
    return result;
  }

  async getSentConnectionRequests(artistId: string): Promise<ArtistConnectionWithProfiles[]> {
    const connections = await db
      .select()
      .from(artistConnections)
      .where(
        and(
          eq(artistConnections.requesterId, artistId),
          eq(artistConnections.status, "pending")
        )
      )
      .orderBy(desc(artistConnections.createdAt));

    const result: ArtistConnectionWithProfiles[] = [];
    for (const conn of connections) {
      const requester = await this.getArtistProfileById(conn.requesterId);
      const receiver = await this.getArtistProfileById(conn.receiverId);
      if (requester && receiver) {
        result.push({ ...conn, requester, receiver });
      }
    }
    return result;
  }

  async deleteConnection(id: string): Promise<void> {
    await db.delete(artistConnections).where(eq(artistConnections.id, id));
  }

  async sendMessage(data: InsertArtistMessage): Promise<ArtistMessage> {
    const [message] = await db
      .insert(artistMessages)
      .values(data)
      .returning();
    return message;
  }

  async getMessages(connectionId: string, limit: number = 50): Promise<ArtistMessage[]> {
    return await db
      .select()
      .from(artistMessages)
      .where(eq(artistMessages.connectionId, connectionId))
      .orderBy(desc(artistMessages.createdAt))
      .limit(limit);
  }

  async markMessagesAsRead(connectionId: string, readerId: string): Promise<void> {
    await db
      .update(artistMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(artistMessages.connectionId, connectionId),
          sql`${artistMessages.senderId} != ${readerId}`,
          eq(artistMessages.isRead, false)
        )
      );
  }

  async getUnreadMessageCount(artistId: string): Promise<number> {
    const connections = await this.getAcceptedConnections(artistId);
    let total = 0;
    
    for (const conn of connections) {
      const [result] = await db
        .select({ count: count() })
        .from(artistMessages)
        .where(
          and(
            eq(artistMessages.connectionId, conn.id),
            sql`${artistMessages.senderId} != ${artistId}`,
            eq(artistMessages.isRead, false)
          )
        );
      total += result?.count || 0;
    }
    return total;
  }

  async getConversations(artistId: string): Promise<ConversationPreview[]> {
    const connections = await this.getAcceptedConnections(artistId);
    const conversations: ConversationPreview[] = [];

    for (const conn of connections) {
      const otherArtist = conn.requesterId === artistId ? conn.receiver : conn.requester;
      
      const [lastMessage] = await db
        .select()
        .from(artistMessages)
        .where(eq(artistMessages.connectionId, conn.id))
        .orderBy(desc(artistMessages.createdAt))
        .limit(1);

      const [unreadResult] = await db
        .select({ count: count() })
        .from(artistMessages)
        .where(
          and(
            eq(artistMessages.connectionId, conn.id),
            sql`${artistMessages.senderId} != ${artistId}`,
            eq(artistMessages.isRead, false)
          )
        );

      conversations.push({
        connection: conn,
        otherArtist,
        lastMessage: lastMessage || undefined,
        unreadCount: unreadResult?.count || 0,
      });
    }

    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt?.getTime() || a.connection.createdAt?.getTime() || 0;
      const bTime = b.lastMessage?.createdAt?.getTime() || b.connection.createdAt?.getTime() || 0;
      return bTime - aTime;
    });

    return conversations;
  }

  // User connections (social chat for all users)
  async createUserConnection(data: InsertUserConnection): Promise<UserConnection> {
    const [connection] = await db
      .insert(userConnections)
      .values(data)
      .returning();
    return connection;
  }

  async getUserConnection(id: string): Promise<UserConnection | undefined> {
    const [connection] = await db
      .select()
      .from(userConnections)
      .where(eq(userConnections.id, id));
    return connection || undefined;
  }

  async getUserConnectionBetweenUsers(userId1: string, userId2: string): Promise<UserConnection | undefined> {
    const [connection] = await db
      .select()
      .from(userConnections)
      .where(
        or(
          and(
            eq(userConnections.requesterId, userId1),
            eq(userConnections.receiverId, userId2)
          ),
          and(
            eq(userConnections.requesterId, userId2),
            eq(userConnections.receiverId, userId1)
          )
        )
      );
    return connection || undefined;
  }

  async updateUserConnectionStatus(id: string, status: string): Promise<UserConnection | undefined> {
    const [connection] = await db
      .update(userConnections)
      .set({ status, respondedAt: new Date() })
      .where(eq(userConnections.id, id))
      .returning();
    return connection || undefined;
  }

  async getPendingUserConnectionRequests(userId: string): Promise<UserConnectionWithUsers[]> {
    const connections = await db
      .select()
      .from(userConnections)
      .where(
        and(
          eq(userConnections.receiverId, userId),
          eq(userConnections.status, "pending")
        )
      );

    const result: UserConnectionWithUsers[] = [];
    for (const conn of connections) {
      const requester = await this.getUser(conn.requesterId);
      const receiver = await this.getUser(conn.receiverId);
      if (requester && receiver) {
        result.push({ ...conn, requester, receiver });
      }
    }
    return result;
  }

  async getAcceptedUserConnections(userId: string): Promise<UserConnectionWithUsers[]> {
    const connections = await db
      .select()
      .from(userConnections)
      .where(
        and(
          or(
            eq(userConnections.requesterId, userId),
            eq(userConnections.receiverId, userId)
          ),
          eq(userConnections.status, "accepted")
        )
      );

    const result: UserConnectionWithUsers[] = [];
    for (const conn of connections) {
      const requester = await this.getUser(conn.requesterId);
      const receiver = await this.getUser(conn.receiverId);
      if (requester && receiver) {
        result.push({ ...conn, requester, receiver });
      }
    }
    return result;
  }

  async getSentUserConnectionRequests(userId: string): Promise<UserConnectionWithUsers[]> {
    const connections = await db
      .select()
      .from(userConnections)
      .where(
        and(
          eq(userConnections.requesterId, userId),
          eq(userConnections.status, "pending")
        )
      );

    const result: UserConnectionWithUsers[] = [];
    for (const conn of connections) {
      const requester = await this.getUser(conn.requesterId);
      const receiver = await this.getUser(conn.receiverId);
      if (requester && receiver) {
        result.push({ ...conn, requester, receiver });
      }
    }
    return result;
  }

  async deleteUserConnection(id: string): Promise<void> {
    await db.delete(userConnections).where(eq(userConnections.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Direct messages
  async sendDirectMessage(data: InsertDirectMessage): Promise<DirectMessage> {
    const [message] = await db
      .insert(directMessages)
      .values(data)
      .returning();
    return message;
  }

  async getDirectMessages(connectionId: string, limit: number = 50): Promise<DirectMessage[]> {
    return await db
      .select()
      .from(directMessages)
      .where(eq(directMessages.connectionId, connectionId))
      .orderBy(desc(directMessages.createdAt))
      .limit(limit);
  }

  async markDirectMessagesAsRead(connectionId: string, readerId: string): Promise<void> {
    await db
      .update(directMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(directMessages.connectionId, connectionId),
          sql`${directMessages.senderId} != ${readerId}`,
          eq(directMessages.isRead, false)
        )
      );
  }

  async getUnreadDirectMessageCount(userId: string): Promise<number> {
    const connections = await this.getAcceptedUserConnections(userId);
    let total = 0;
    
    for (const conn of connections) {
      const [result] = await db
        .select({ count: count() })
        .from(directMessages)
        .where(
          and(
            eq(directMessages.connectionId, conn.id),
            sql`${directMessages.senderId} != ${userId}`,
            eq(directMessages.isRead, false)
          )
        );
      total += result?.count || 0;
    }
    return total;
  }

  async getUserConversations(userId: string): Promise<UserConversationPreview[]> {
    const connections = await this.getAcceptedUserConnections(userId);
    const conversations: UserConversationPreview[] = [];

    for (const conn of connections) {
      const otherUser = conn.requesterId === userId ? conn.receiver : conn.requester;
      
      const [lastMessage] = await db
        .select()
        .from(directMessages)
        .where(eq(directMessages.connectionId, conn.id))
        .orderBy(desc(directMessages.createdAt))
        .limit(1);

      const [unreadResult] = await db
        .select({ count: count() })
        .from(directMessages)
        .where(
          and(
            eq(directMessages.connectionId, conn.id),
            sql`${directMessages.senderId} != ${userId}`,
            eq(directMessages.isRead, false)
          )
        );

      conversations.push({
        connection: conn,
        otherUser,
        lastMessage: lastMessage || undefined,
        unreadCount: unreadResult?.count || 0,
      });
    }

    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt?.getTime() || a.connection.createdAt?.getTime() || 0;
      const bTime = b.lastMessage?.createdAt?.getTime() || b.connection.createdAt?.getTime() || 0;
      return bTime - aTime;
    });

    return conversations;
  }

  // Social Feed
  async createPost(data: InsertArtistPost): Promise<ArtistPost> {
    const [post] = await db
      .insert(artistPosts)
      .values(data)
      .returning();
    return post;
  }

  async getPost(id: string): Promise<ArtistPostWithDetails | undefined> {
    const [post] = await db
      .select()
      .from(artistPosts)
      .where(eq(artistPosts.id, id));
    
    if (!post) return undefined;
    
    const [artist] = await db
      .select()
      .from(artistProfiles)
      .where(eq(artistProfiles.id, post.artistId));
    
    let trackWithArtist = null;
    if (post.trackId) {
      trackWithArtist = await this.getTrackWithArtist(post.trackId);
    }
    
    const [likeCountResult] = await db
      .select({ count: count() })
      .from(postLikes)
      .where(eq(postLikes.postId, id));
    
    const [commentCountResult] = await db
      .select({ count: count() })
      .from(postComments)
      .where(eq(postComments.postId, id));
    
    const [shareCountResult] = await db
      .select({ count: count() })
      .from(postShares)
      .where(eq(postShares.postId, id));
    
    return {
      ...post,
      artist,
      track: trackWithArtist,
      likeCount: likeCountResult?.count || 0,
      commentCount: commentCountResult?.count || 0,
      shareCount: shareCountResult?.count || 0,
      isLiked: false,
    };
  }

  async getFeedPosts(userId: string, limit: number = 20, offset: number = 0): Promise<ArtistPostWithDetails[]> {
    const allPosts = await db
      .select()
      .from(artistPosts)
      .orderBy(desc(artistPosts.createdAt))
      .limit(limit)
      .offset(offset);
    
    const postsWithDetails: ArtistPostWithDetails[] = [];
    
    for (const post of allPosts) {
      const [artist] = await db
        .select()
        .from(artistProfiles)
        .where(eq(artistProfiles.id, post.artistId));
      
      let trackWithArtist = null;
      if (post.trackId) {
        trackWithArtist = await this.getTrackWithArtist(post.trackId);
      }
      
      const [likeCountResult] = await db
        .select({ count: count() })
        .from(postLikes)
        .where(eq(postLikes.postId, post.id));
      
      const [commentCountResult] = await db
        .select({ count: count() })
        .from(postComments)
        .where(eq(postComments.postId, post.id));
      
      const [shareCountResult] = await db
        .select({ count: count() })
        .from(postShares)
        .where(eq(postShares.postId, post.id));
      
      const isLiked = await this.isPostLiked(post.id, userId);
      
      postsWithDetails.push({
        ...post,
        artist,
        track: trackWithArtist,
        likeCount: likeCountResult?.count || 0,
        commentCount: commentCountResult?.count || 0,
        shareCount: shareCountResult?.count || 0,
        isLiked,
      });
    }
    
    return postsWithDetails;
  }

  async getArtistPosts(artistId: string): Promise<ArtistPostWithDetails[]> {
    const [artist] = await db
      .select()
      .from(artistProfiles)
      .where(eq(artistProfiles.id, artistId));
    
    if (!artist) return [];
    
    const posts = await db
      .select()
      .from(artistPosts)
      .where(eq(artistPosts.artistId, artistId))
      .orderBy(desc(artistPosts.createdAt));
    
    const postsWithDetails: ArtistPostWithDetails[] = [];
    
    for (const post of posts) {
      let trackWithArtist = null;
      if (post.trackId) {
        trackWithArtist = await this.getTrackWithArtist(post.trackId);
      }
      
      const [likeCountResult] = await db
        .select({ count: count() })
        .from(postLikes)
        .where(eq(postLikes.postId, post.id));
      
      const [commentCountResult] = await db
        .select({ count: count() })
        .from(postComments)
        .where(eq(postComments.postId, post.id));
      
      const [shareCountResult] = await db
        .select({ count: count() })
        .from(postShares)
        .where(eq(postShares.postId, post.id));
      
      postsWithDetails.push({
        ...post,
        artist,
        track: trackWithArtist,
        likeCount: likeCountResult?.count || 0,
        commentCount: commentCountResult?.count || 0,
        shareCount: shareCountResult?.count || 0,
        isLiked: false,
      });
    }
    
    return postsWithDetails;
  }

  async deletePost(postId: string): Promise<void> {
    await db.delete(artistPosts).where(eq(artistPosts.id, postId));
  }

  async likePost(postId: string, userId: string): Promise<PostLike> {
    const [like] = await db
      .insert(postLikes)
      .values({ postId, userId })
      .returning();
    return like;
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    await db
      .delete(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
  }

  async isPostLiked(postId: string, userId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    return !!like;
  }

  async createPostComment(data: InsertPostComment): Promise<PostComment> {
    const [comment] = await db
      .insert(postComments)
      .values(data)
      .returning();
    return comment;
  }

  async getPostComments(postId: string): Promise<PostCommentWithUser[]> {
    const comments = await db
      .select()
      .from(postComments)
      .where(eq(postComments.postId, postId))
      .orderBy(desc(postComments.createdAt));
    
    const commentsWithUser: PostCommentWithUser[] = [];
    
    for (const comment of comments) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, comment.userId));
      
      if (user) {
        commentsWithUser.push({
          ...comment,
          user,
        });
      }
    }
    
    return commentsWithUser;
  }

  async deletePostComment(commentId: string): Promise<void> {
    await db.delete(postComments).where(eq(postComments.id, commentId));
  }

  async sharePost(postId: string, sharedByUserId: string, sharedToUserId: string): Promise<PostShare> {
    const [share] = await db
      .insert(postShares)
      .values({ postId, sharedByUserId, sharedToUserId })
      .returning();
    return share;
  }

  async getPostShares(postId: string): Promise<PostShare[]> {
    return await db
      .select()
      .from(postShares)
      .where(eq(postShares.postId, postId));
  }

  async addCommentSticker(data: InsertCommentSticker): Promise<CommentSticker> {
    const [sticker] = await db
      .insert(commentStickers)
      .values(data)
      .returning();
    return sticker;
  }

  async getCommentStickers(commentId: string): Promise<CommentSticker[]> {
    return await db
      .select()
      .from(commentStickers)
      .where(eq(commentStickers.commentId, commentId))
      .orderBy(desc(commentStickers.createdAt));
  }

  async deleteCommentSticker(stickerId: string): Promise<void> {
    await db.delete(commentStickers).where(eq(commentStickers.id, stickerId));
  }

  // Listener music preferences
  async addFavoriteArtist(userId: string, artistId: string): Promise<ListenerFavoriteArtist> {
    // Check if already exists
    const [existing] = await db
      .select()
      .from(listenerFavoriteArtists)
      .where(and(
        eq(listenerFavoriteArtists.userId, userId),
        eq(listenerFavoriteArtists.artistId, artistId)
      ));
    
    if (existing) {
      return existing;
    }

    const [favorite] = await db
      .insert(listenerFavoriteArtists)
      .values({ userId, artistId })
      .returning();
    return favorite;
  }

  async removeFavoriteArtist(userId: string, artistId: string): Promise<void> {
    await db
      .delete(listenerFavoriteArtists)
      .where(and(
        eq(listenerFavoriteArtists.userId, userId),
        eq(listenerFavoriteArtists.artistId, artistId)
      ));
  }

  async getFavoriteArtists(userId: string): Promise<(ListenerFavoriteArtist & { artist: ArtistProfile })[]> {
    const favorites = await db
      .select()
      .from(listenerFavoriteArtists)
      .where(eq(listenerFavoriteArtists.userId, userId))
      .orderBy(desc(listenerFavoriteArtists.addedAt));
    
    const result: (ListenerFavoriteArtist & { artist: ArtistProfile })[] = [];
    
    for (const favorite of favorites) {
      const [artist] = await db
        .select()
        .from(artistProfiles)
        .where(eq(artistProfiles.id, favorite.artistId));
      
      if (artist) {
        result.push({ ...favorite, artist });
      }
    }
    
    return result;
  }

  async addFavoriteGenre(userId: string, genre: string): Promise<ListenerFavoriteGenre> {
    // Check if already exists
    const [existing] = await db
      .select()
      .from(listenerFavoriteGenres)
      .where(and(
        eq(listenerFavoriteGenres.userId, userId),
        eq(listenerFavoriteGenres.genre, genre)
      ));
    
    if (existing) {
      return existing;
    }

    const [favorite] = await db
      .insert(listenerFavoriteGenres)
      .values({ userId, genre })
      .returning();
    return favorite;
  }

  async removeFavoriteGenre(userId: string, genre: string): Promise<void> {
    await db
      .delete(listenerFavoriteGenres)
      .where(and(
        eq(listenerFavoriteGenres.userId, userId),
        eq(listenerFavoriteGenres.genre, genre)
      ));
  }

  async getFavoriteGenres(userId: string): Promise<ListenerFavoriteGenre[]> {
    return await db
      .select()
      .from(listenerFavoriteGenres)
      .where(eq(listenerFavoriteGenres.userId, userId))
      .orderBy(desc(listenerFavoriteGenres.addedAt));
  }

  async getSuggestedFriends(userId: string, limit: number = 10): Promise<{ user: User; similarityScore: number; commonArtists: string[]; commonGenres: string[] }[]> {
    // Get current user's favorite artists and genres
    const userArtists = await db
      .select()
      .from(listenerFavoriteArtists)
      .where(eq(listenerFavoriteArtists.userId, userId));
    
    const userGenres = await db
      .select()
      .from(listenerFavoriteGenres)
      .where(eq(listenerFavoriteGenres.userId, userId));
    
    const userArtistIds = new Set(userArtists.map(a => a.artistId));
    const userGenreNames = new Set(userGenres.map(g => g.genre));

    // Get existing connections to exclude
    const existingConnections = await db
      .select()
      .from(userConnections)
      .where(or(
        eq(userConnections.requesterId, userId),
        eq(userConnections.receiverId, userId)
      ));
    
    const connectedUserIds = new Set<string>();
    connectedUserIds.add(userId);
    for (const conn of existingConnections) {
      connectedUserIds.add(conn.requesterId);
      connectedUserIds.add(conn.receiverId);
    }

    // Get all other users who have music preferences set
    const allUsers = await db.select().from(users);
    const eligibleUsers = allUsers.filter(u => 
      !connectedUserIds.has(u.id) && 
      u.showMusicPreferences !== false
    );

    const suggestions: { user: User; similarityScore: number; commonArtists: string[]; commonGenres: string[] }[] = [];

    for (const otherUser of eligibleUsers) {
      // Get other user's preferences
      const otherArtists = await db
        .select()
        .from(listenerFavoriteArtists)
        .where(eq(listenerFavoriteArtists.userId, otherUser.id));
      
      const otherGenres = await db
        .select()
        .from(listenerFavoriteGenres)
        .where(eq(listenerFavoriteGenres.userId, otherUser.id));
      
      // Skip users with no preferences
      if (otherArtists.length === 0 && otherGenres.length === 0) continue;

      // Calculate common artists
      const commonArtistIds = otherArtists
        .filter(a => userArtistIds.has(a.artistId))
        .map(a => a.artistId);
      
      // Get artist names for common artists
      const commonArtistNames: string[] = [];
      for (const artistId of commonArtistIds) {
        const [artist] = await db
          .select()
          .from(artistProfiles)
          .where(eq(artistProfiles.id, artistId));
        if (artist) {
          commonArtistNames.push(artist.stageName);
        }
      }

      // Calculate common genres
      const commonGenres = otherGenres
        .filter(g => userGenreNames.has(g.genre))
        .map(g => g.genre);

      // Calculate similarity score (Jaccard-like with weights)
      const artistWeight = 0.6;
      const genreWeight = 0.4;
      
      const otherArtistIds = new Set(otherArtists.map(a => a.artistId));
      const otherGenreNames = new Set(otherGenres.map(g => g.genre));
      
      const artistUnion = new Set([...userArtistIds, ...otherArtistIds]);
      const genreUnion = new Set([...userGenreNames, ...otherGenreNames]);
      
      const artistSimilarity = artistUnion.size > 0 
        ? commonArtistIds.length / artistUnion.size 
        : 0;
      const genreSimilarity = genreUnion.size > 0 
        ? commonGenres.length / genreUnion.size 
        : 0;
      
      const similarityScore = Math.round((artistWeight * artistSimilarity + genreWeight * genreSimilarity) * 100);

      if (similarityScore > 0) {
        suggestions.push({
          user: otherUser,
          similarityScore,
          commonArtists: commonArtistNames,
          commonGenres,
        });
      }
    }

    // Sort by similarity score and return top results
    return suggestions
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  }

  async getSharedMusicTaste(userId1: string, userId2: string): Promise<{ similarityScore: number; commonArtists: { id: string; artistName: string }[]; commonGenres: string[] }> {
    // Get both users' favorite artists
    const user1Artists = await db
      .select()
      .from(listenerFavoriteArtists)
      .where(eq(listenerFavoriteArtists.userId, userId1));
    
    const user2Artists = await db
      .select()
      .from(listenerFavoriteArtists)
      .where(eq(listenerFavoriteArtists.userId, userId2));
    
    // Get both users' favorite genres
    const user1Genres = await db
      .select()
      .from(listenerFavoriteGenres)
      .where(eq(listenerFavoriteGenres.userId, userId1));
    
    const user2Genres = await db
      .select()
      .from(listenerFavoriteGenres)
      .where(eq(listenerFavoriteGenres.userId, userId2));
    
    const user1ArtistIds = new Set(user1Artists.map(a => a.artistId));
    const user2ArtistIds = new Set(user2Artists.map(a => a.artistId));
    const user1GenreNames = new Set(user1Genres.map(g => g.genre));
    const user2GenreNames = new Set(user2Genres.map(g => g.genre));
    
    // Find common artists
    const commonArtistIds = [...user1ArtistIds].filter(id => user2ArtistIds.has(id));
    const commonArtists: { id: string; artistName: string }[] = [];
    
    for (const artistId of commonArtistIds) {
      const [artist] = await db
        .select()
        .from(artistProfiles)
        .where(eq(artistProfiles.id, artistId));
      if (artist) {
        commonArtists.push({ id: artist.id, artistName: artist.stageName });
      }
    }
    
    // Find common genres
    const commonGenres = [...user1GenreNames].filter(g => user2GenreNames.has(g));
    
    // Calculate similarity score
    const artistWeight = 0.6;
    const genreWeight = 0.4;
    
    const artistUnion = new Set([...user1ArtistIds, ...user2ArtistIds]);
    const genreUnion = new Set([...user1GenreNames, ...user2GenreNames]);
    
    const artistSimilarity = artistUnion.size > 0 
      ? commonArtistIds.length / artistUnion.size 
      : 0;
    const genreSimilarity = genreUnion.size > 0 
      ? commonGenres.length / genreUnion.size 
      : 0;
    
    const similarityScore = Math.round((artistWeight * artistSimilarity + genreWeight * genreSimilarity) * 100);
    
    return {
      similarityScore,
      commonArtists,
      commonGenres,
    };
  }
}

export const storage = new DatabaseStorage();
