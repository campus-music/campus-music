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
  postShares
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

  sendSupport(data: InsertSupport): Promise<Support>;
  getArtistSupports(artistId: string): Promise<Support[]>;
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
}

export const storage = new DatabaseStorage();
