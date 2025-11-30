import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  universityName: text("university_name").notNull(),
  country: text("country").notNull(),
  role: text("role").notNull().default("listener"),
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const artistProfiles = pgTable("artist_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stageName: text("stage_name").notNull(),
  bio: text("bio"),
  mainGenre: text("main_genre").notNull(),
  socialLinks: text("social_links"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tracks = pgTable("tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  artistId: varchar("artist_id").notNull().references(() => artistProfiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  audioUrl: text("audio_url").notNull(),
  coverImageUrl: text("cover_image_url"),
  genre: text("genre").notNull(),
  universityName: text("university_name").notNull(),
  country: text("country").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const playlists = pgTable("playlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const playlistTracks = pgTable("playlist_tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playlistId: varchar("playlist_id").notNull().references(() => playlists.id, { onDelete: "cascade" }),
  trackId: varchar("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

export const likes = pgTable("likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  trackId: varchar("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const streams = pgTable("streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  trackId: varchar("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
  playedAt: timestamp("played_at").notNull().defaultNow(),
});

export const followers = pgTable("followers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followerId: varchar("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followedAt: timestamp("followed_at").notNull().defaultNow(),
});

export const trackComments = pgTable("track_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackId: varchar("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const shares = pgTable("shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  trackId: varchar("track_id"),
  playlistId: varchar("playlist_id"),
  sharedAt: timestamp("shared_at").notNull().defaultNow(),
});

export const playlistMembers = pgTable("playlist_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playlistId: varchar("playlist_id").notNull().references(() => playlists.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("collaborator"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

// Support system: Listeners can financially support artists
export const supports = pgTable("supports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supporterId: varchar("supporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  artistId: varchar("artist_id").notNull().references(() => artistProfiles.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // Amount in cents (e.g., 500 = $5.00)
  paymentMethod: text("payment_method").notNull(), // "mobile_money", "paypal", "stripe"
  status: text("status").notNull().default("completed"), // "pending", "completed", "failed"
  message: text("message"), // Optional support message
  transactionId: text("transaction_id").unique(), // Stripe session ID for idempotency
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Artist wallet: Track artist account balance and payout info
export const artistWallets = pgTable("artist_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  artistId: varchar("artist_id").notNull().unique().references(() => artistProfiles.id, { onDelete: "cascade" }),
  totalReceived: integer("total_received").notNull().default(0), // Total amount in cents
  balance: integer("balance").notNull().default(0), // Current balance
  payoutEmail: text("payout_email"),
  payoutMethod: text("payout_method"), // "mobile_money", "paypal", "bank_transfer"
  lastPayoutAt: timestamp("last_payout_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userListeningHistory = pgTable("user_listening_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  trackId: varchar("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
  genre: text("genre").notNull(),
  listeningCount: integer("listening_count").notNull().default(1),
  lastPlayedAt: timestamp("last_played_at").notNull().defaultNow(),
});

// Artist connections for collaboration - friend system between artists
export const artistConnections = pgTable("artist_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").notNull().references(() => artistProfiles.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => artistProfiles.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // "pending", "accepted", "rejected"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
});

// Messages between connected artists
export const artistMessages = pgTable("artist_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull().references(() => artistConnections.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => artistProfiles.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User connections for social chat - friend system between all users (listeners and artists)
export const userConnections = pgTable("user_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // "pending", "accepted", "rejected"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
});

// Direct messages between connected users
export const directMessages = pgTable("direct_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull().references(() => userConnections.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  universityName: z.string().min(1, 'University name is required'),
  country: z.string().min(1, 'Country is required'),
}).omit({ id: true, createdAt: true, verificationToken: true });

export const insertArtistProfileSchema = createInsertSchema(artistProfiles, {
  stageName: z.string().min(1, 'Stage name is required'),
  mainGenre: z.string().min(1, 'Main genre is required'),
}).omit({ id: true, createdAt: true });

export const insertTrackSchema = createInsertSchema(tracks, {
  title: z.string().min(1, 'Track title is required'),
  genre: z.string().min(1, 'Genre is required'),
  durationSeconds: z.number().positive('Duration must be positive'),
}).omit({ id: true, createdAt: true });

export const insertPlaylistSchema = createInsertSchema(playlists, {
  name: z.string().min(1, 'Playlist name is required'),
}).omit({ id: true, createdAt: true });

export const insertPlaylistTrackSchema = createInsertSchema(playlistTracks).omit({ 
  id: true, 
  addedAt: true 
});

export const insertLikeSchema = createInsertSchema(likes).omit({ 
  id: true, 
  createdAt: true 
});

export const insertStreamSchema = createInsertSchema(streams).omit({ 
  id: true, 
  playedAt: true 
});

export const insertFollowerSchema = createInsertSchema(followers).omit({ 
  id: true, 
  followedAt: true 
});

export const insertTrackCommentSchema = createInsertSchema(trackComments).omit({ 
  id: true, 
  createdAt: true 
});

export const insertShareSchema = createInsertSchema(shares).omit({ 
  id: true, 
  sharedAt: true 
});

export const insertPlaylistMemberSchema = createInsertSchema(playlistMembers).omit({ 
  id: true, 
  joinedAt: true 
});

export const insertSupportSchema = createInsertSchema(supports, {
  amount: z.number().positive('Amount must be greater than 0'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
}).omit({ 
  id: true, 
  createdAt: true,
  status: true,
  transactionId: true 
});

export const insertArtistWalletSchema = createInsertSchema(artistWallets).omit({ 
  id: true, 
  createdAt: true,
  totalReceived: true,
  balance: true 
});

export const insertArtistConnectionSchema = createInsertSchema(artistConnections).omit({ 
  id: true, 
  createdAt: true,
  respondedAt: true,
  status: true 
});

export const insertArtistMessageSchema = createInsertSchema(artistMessages, {
  content: z.string().min(1, 'Message cannot be empty'),
}).omit({ 
  id: true, 
  createdAt: true,
  isRead: true 
});

export const insertUserConnectionSchema = createInsertSchema(userConnections).omit({ 
  id: true, 
  createdAt: true,
  respondedAt: true,
  status: true 
});

export const insertDirectMessageSchema = createInsertSchema(directMessages, {
  content: z.string().min(1, 'Message cannot be empty'),
}).omit({ 
  id: true, 
  createdAt: true,
  isRead: true 
});

// Login Schema
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertArtistProfile = z.infer<typeof insertArtistProfileSchema>;
export type ArtistProfile = typeof artistProfiles.$inferSelect;

export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type Track = typeof tracks.$inferSelect;

export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;

export type InsertPlaylistTrack = z.infer<typeof insertPlaylistTrackSchema>;
export type PlaylistTrack = typeof playlistTracks.$inferSelect;

export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;

export type InsertStream = z.infer<typeof insertStreamSchema>;
export type Stream = typeof streams.$inferSelect;

export type InsertFollower = z.infer<typeof insertFollowerSchema>;
export type Follower = typeof followers.$inferSelect;

export type InsertTrackComment = z.infer<typeof insertTrackCommentSchema>;
export type TrackComment = typeof trackComments.$inferSelect;

export type InsertShare = z.infer<typeof insertShareSchema>;
export type Share = typeof shares.$inferSelect;

export type InsertPlaylistMember = z.infer<typeof insertPlaylistMemberSchema>;
export type PlaylistMember = typeof playlistMembers.$inferSelect;

export type InsertSupport = z.infer<typeof insertSupportSchema>;
export type Support = typeof supports.$inferSelect;

export type InsertArtistWallet = z.infer<typeof insertArtistWalletSchema>;
export type ArtistWallet = typeof artistWallets.$inferSelect;

export type InsertArtistConnection = z.infer<typeof insertArtistConnectionSchema>;
export type ArtistConnection = typeof artistConnections.$inferSelect;

export type InsertArtistMessage = z.infer<typeof insertArtistMessageSchema>;
export type ArtistMessage = typeof artistMessages.$inferSelect;

export type InsertUserConnection = z.infer<typeof insertUserConnectionSchema>;
export type UserConnection = typeof userConnections.$inferSelect;

export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type DirectMessage = typeof directMessages.$inferSelect;

export type Login = z.infer<typeof loginSchema>;

// Extended types for joined data
export type TrackWithArtist = Track & {
  artist: ArtistProfile;
};

export type PlaylistWithTracks = Playlist & {
  tracks: TrackWithArtist[];
};

export type ArtistConnectionWithProfiles = ArtistConnection & {
  requester: ArtistProfile;
  receiver: ArtistProfile;
};

export type ArtistMessageWithSender = ArtistMessage & {
  sender: ArtistProfile;
};

export type ConversationPreview = {
  connection: ArtistConnection;
  otherArtist: ArtistProfile;
  lastMessage?: ArtistMessage;
  unreadCount: number;
};

// User connection types for social chat
export type UserConnectionWithUsers = UserConnection & {
  requester: User;
  receiver: User;
};

export type DirectMessageWithSender = DirectMessage & {
  sender: User;
};

export type UserConversationPreview = {
  connection: UserConnection;
  otherUser: User;
  lastMessage?: DirectMessage;
  unreadCount: number;
};
