import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { insertUserSchema, loginSchema, insertArtistProfileSchema, insertTrackSchema, insertPlaylistSchema } from "@shared/schema";

// Seed data function - idempotent, will skip users that already exist
async function seedData() {
  console.log("Checking database seed status...");

  const universities = [
    { name: "Stanford University", country: "United States" },
    { name: "MIT", country: "United States" },
    { name: "Harvard University", country: "United States" },
    { name: "UC Berkeley", country: "United States" },
    { name: "Oxford University", country: "United Kingdom" },
    { name: "DePaul University", country: "United States" },
  ];

  const genres = ["Pop", "Hip-Hop", "Electronic", "Rock", "R&B", "Indie", "Jazz"];
  const artistNames = ["Luna Echo", "The Campus Collective", "Digital Dreams", "Midnight Study", "Thesis Beats", "Blue Demon Beats"];
  const artistColors = ["7c3aed", "ec4899", "06b6d4", "f97316", "8b5cf6", "0ea5e9"];

  let seededCount = 0;

  for (let i = 0; i < 6; i++) {
    const uni = universities[i];
    const email = `demo${i + 1}@${uni.name.toLowerCase().replace(/\s+/g, '')}.edu`;
    
    try {
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        continue;
      }

      const user = await storage.createUser({
        email,
        password: "password123",
        fullName: `Demo Artist ${i + 1}`,
        universityName: uni.name,
        country: uni.country,
        role: "artist",
      });

      const artistProfile = await storage.createArtistProfile({
        userId: user.id,
        stageName: artistNames[i],
        bio: `Student artist from ${uni.name}, making music between classes and exams.`,
        mainGenre: genres[i % genres.length],
        socialLinks: `https://instagram.com/${artistNames[i].toLowerCase().replace(/\s+/g, '')}`,
        profileImageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(artistNames[i])}&background=${artistColors[i]}&color=fff&size=200&bold=true`,
      });

      const trackCount = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < trackCount; j++) {
        const track = await storage.createTrack({
          artistId: artistProfile.id,
          title: `${genres[i % genres.length]} Track ${j + 1}`,
          description: `An original track created during late-night study sessions at ${uni.name}.`,
          audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          coverImageUrl: undefined,
          genre: genres[(i + j) % genres.length],
          universityName: uni.name,
          country: uni.country,
          durationSeconds: 180 + Math.floor(Math.random() * 120),
        });

        const streamCount = Math.floor(Math.random() * 100);
        for (let k = 0; k < streamCount; k++) {
          await storage.recordStream({
            userId: user.id,
            trackId: track.id,
          });
        }
      }
      seededCount++;
      console.log(`Seeded artist: ${artistNames[i]}`);
    } catch (error) {
      console.error(`Error seeding artist ${i + 1}:`, error);
    }
  }

  const listenerEmails = [
    { email: "listener@stanford.edu", fullName: "Demo Student Listener", university: "Stanford University" },
    { email: "regular.listener@gmail.com", fullName: "Demo Regular Listener", university: "Unknown" }
  ];

  for (const listener of listenerEmails) {
    try {
      const existing = await storage.getUserByEmail(listener.email);
      if (!existing) {
        await storage.createUser({
          email: listener.email,
          password: "password123",
          fullName: listener.fullName,
          universityName: listener.university,
          country: "United States",
          role: "listener",
        });
        seededCount++;
        console.log(`Seeded listener: ${listener.fullName}`);
      }
    } catch (error) {
      console.error(`Error seeding listener ${listener.email}:`, error);
    }
  }

  if (seededCount > 0) {
    console.log(`Database seeding completed! Added ${seededCount} new records.`);
  } else {
    console.log("Database already fully seeded.");
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const user = await storage.createUser(data);
      req.session.userId = user.id;
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.userId = user.id;
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.put("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const { fullName, universityName, country } = req.body;
      const updated = await storage.updateUser(req.session.userId!, {
        fullName,
        universityName,
        country,
      });
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Artist profile routes
  app.post("/api/artist", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.email.endsWith('.edu')) {
        return res.status(403).json({ error: "Only users with .edu email addresses can create artist profiles" });
      }

      const data = insertArtistProfileSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      
      const existing = await storage.getArtistProfile(req.session.userId!);
      if (existing) {
        return res.status(400).json({ error: "Artist profile already exists" });
      }

      const profile = await storage.createArtistProfile(data);
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/artist/profile", requireAuth, async (req, res) => {
    const profile = await storage.getArtistProfile(req.session.userId!);
    if (!profile) {
      return res.status(404).json({ error: "Artist profile not found" });
    }
    res.json(profile);
  });

  app.get("/api/artists/by-university", async (req, res) => {
    const { university } = req.query;
    if (!university || typeof university !== 'string') {
      return res.status(400).json({ error: "University parameter required" });
    }
    const artists = await storage.getArtistsByUniversity(university);
    res.json(artists);
  });

  // Track routes
  app.post("/api/tracks", requireAuth, async (req, res) => {
    try {
      const artistProfile = await storage.getArtistProfile(req.session.userId!);
      if (!artistProfile) {
        return res.status(403).json({ error: "Artist profile required" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const data = insertTrackSchema.parse({
        ...req.body,
        artistId: artistProfile.id,
        universityName: user.universityName,
        country: user.country,
      });

      const track = await storage.createTrack(data);
      res.json(track);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/tracks/latest", async (req, res) => {
    const tracks = await storage.getLatestTracks(20);
    res.json(tracks);
  });

  app.get("/api/tracks/trending", async (req, res) => {
    const tracks = await storage.getTrendingTracks(20);
    res.json(tracks);
  });

  app.get("/api/tracks/best-of-campus", async (req, res) => {
    const tracks = await storage.getTrendingTracks(10);
    res.json(tracks);
  });

  app.get("/api/tracks/by-university", async (req, res) => {
    const { university } = req.query;
    if (!university || typeof university !== 'string') {
      return res.status(400).json({ error: "University parameter required" });
    }
    const tracks = await storage.getTracksByUniversity(university);
    res.json(tracks);
  });

  app.get("/api/tracks/liked", requireAuth, async (req, res) => {
    const tracks = await storage.getLikedTracks(req.session.userId!);
    res.json(tracks);
  });

  app.get("/api/artist/tracks", requireAuth, async (req, res) => {
    const artistProfile = await storage.getArtistProfile(req.session.userId!);
    if (!artistProfile) {
      return res.status(404).json({ error: "Artist profile not found" });
    }
    const tracks = await storage.getTracksByArtist(artistProfile.id);
    res.json(tracks);
  });

  app.get("/api/artist/stats", requireAuth, async (req, res) => {
    const artistProfile = await storage.getArtistProfile(req.session.userId!);
    if (!artistProfile) {
      return res.status(404).json({ error: "Artist profile not found" });
    }
    const stats = await storage.getArtistStats(artistProfile.id);
    res.json(stats);
  });

  // Like routes
  app.post("/api/tracks/:id/like", requireAuth, async (req, res) => {
    try {
      const like = await storage.likeTrack({
        userId: req.session.userId!,
        trackId: req.params.id,
      });
      res.json(like);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/tracks/:id/like", requireAuth, async (req, res) => {
    await storage.unlikeTrack(req.session.userId!, req.params.id);
    res.json({ success: true });
  });

  // Stream routes
  app.post("/api/tracks/:id/stream", requireAuth, async (req, res) => {
    try {
      const stream = await storage.recordStream({
        userId: req.session.userId!,
        trackId: req.params.id,
      });
      res.json(stream);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Playlist routes
  app.get("/api/playlists", requireAuth, async (req, res) => {
    const playlists = await storage.getPlaylistsByUser(req.session.userId!);
    res.json(playlists);
  });

  app.post("/api/playlists", requireAuth, async (req, res) => {
    try {
      const data = insertPlaylistSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      const playlist = await storage.createPlaylist(data);
      res.json(playlist);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/playlists/:id/tracks", requireAuth, async (req, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist || playlist.userId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const playlistTrack = await storage.addTrackToPlaylist({
        playlistId: req.params.id,
        trackId: req.body.trackId,
      });
      res.json(playlistTrack);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Email verification endpoint
  app.post("/api/auth/verify-email", requireAuth, async (req, res) => {
    try {
      const { code } = req.body;
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.verificationToken !== code) {
        return res.status(400).json({ error: "Invalid verification code" });
      }

      const updated = await storage.updateUser(req.session.userId!, {
        emailVerified: true,
        verificationToken: undefined,
      });

      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Follower routes
  app.post("/api/artists/:artistId/follow", requireAuth, async (req, res) => {
    try {
      const isFollowing = await storage.isFollowing(req.session.userId!, req.params.artistId);
      if (isFollowing) {
        return res.status(400).json({ error: "Already following" });
      }

      const follower = await storage.followArtist({
        userId: req.params.artistId,
        followerId: req.session.userId!,
      });
      res.json(follower);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/artists/:artistId/follow", requireAuth, async (req, res) => {
    try {
      await storage.unfollowArtist(req.params.artistId, req.session.userId!);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/artists/:artistId/followers", async (req, res) => {
    try {
      const followers = await storage.getFollowers(req.params.artistId);
      const safeFollowers = followers.map(f => {
        const { password, ...safe } = f;
        return safe;
      });
      res.json(safeFollowers);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/user/following", requireAuth, async (req, res) => {
    try {
      const following = await storage.getFollowing(req.session.userId!);
      const safeFollowing = following.map(f => {
        const { password, ...safe } = f;
        return safe;
      });
      res.json(safeFollowing);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Track comments routes
  app.post("/api/tracks/:trackId/comments", requireAuth, async (req, res) => {
    try {
      const { content } = req.body;
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: "Content is required" });
      }

      const comment = await storage.addComment({
        trackId: req.params.trackId,
        userId: req.session.userId!,
        content,
      });
      res.json(comment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/tracks/:trackId/comments", async (req, res) => {
    try {
      const comments = await storage.getTrackComments(req.params.trackId);
      res.json(comments);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/comments/:commentId", requireAuth, async (req, res) => {
    try {
      await storage.deleteComment(req.params.commentId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Share routes
  app.post("/api/tracks/:trackId/share", requireAuth, async (req, res) => {
    try {
      const share = await storage.shareTrack({
        userId: req.session.userId!,
        trackId: req.params.trackId,
      });
      res.json(share);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/tracks/:trackId/share-count", async (req, res) => {
    try {
      const count = await storage.getShareCount(req.params.trackId);
      res.json({ count });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Collaborative playlist routes
  app.post("/api/playlists/:id/members", requireAuth, async (req, res) => {
    try {
      const { userId } = req.body;
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist || playlist.userId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const member = await storage.addPlaylistMember({
        playlistId: req.params.id,
        userId,
        role: 'collaborator',
      });
      res.json(member);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/playlists/:id/members", async (req, res) => {
    try {
      const members = await storage.getPlaylistMembers(req.params.id);
      res.json(members);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/playlists/:id/members/:userId", requireAuth, async (req, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist || playlist.userId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await storage.removePlaylistMember(req.params.id, req.params.userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // University discovery route
  app.get("/api/universities", async (req, res) => {
    try {
      const universities = await storage.getUniversities();
      res.json(universities);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Genre discovery routes
  app.get("/api/genres", async (req, res) => {
    try {
      const genres = await storage.getGenres();
      res.json(genres);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/genres/:genre/tracks", async (req, res) => {
    try {
      const tracks = await storage.getTracksByGenre(req.params.genre);
      res.json(tracks);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/genres/:genre/artists", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const artists = await storage.getTopArtistsByGenre(req.params.genre, limit);
      res.json(artists);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/user/recommendations", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const recommendations = await storage.getPersonalizedRecommendations(req.session.userId!, limit);
      res.json(recommendations);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Advanced artist analytics routes
  app.get("/api/artists/:artistId/analytics", async (req, res) => {
    try {
      const analytics = await storage.getArtistAnalytics(req.params.artistId);
      const safeAnalytics = {
        ...analytics,
        streams: Object.fromEntries(analytics.streams),
        listenerCountries: Object.fromEntries(analytics.listenerCountries),
      };
      res.json(safeAnalytics);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Search routes
  app.get("/api/search/tracks", async (req, res) => {
    const { query } = req.query;
    if (!query || typeof query !== 'string') {
      return res.json([]);
    }
    const tracks = await storage.searchTracks(query);
    res.json(tracks);
  });

  app.get("/api/search/artists", async (req, res) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.json([]);
      }
      const lowerQuery = query.toLowerCase();
      const allArtists = await storage.getAllArtists();
      const filtered = allArtists.filter((a) =>
        a.stageName.toLowerCase().includes(lowerQuery) ||
        a.mainGenre.toLowerCase().includes(lowerQuery)
      );
      res.json(filtered);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get single artist by ID with their tracks
  app.get("/api/artist/:artistId", async (req, res) => {
    try {
      const { artistId } = req.params;
      const artist = await storage.getArtistProfileById(artistId);
      
      if (!artist) {
        return res.status(404).json({ error: "Artist not found" });
      }

      const tracks = await storage.getTracksByArtist(artistId);
      const wallet = await storage.getArtistWallet(artistId);
      
      res.json({
        ...artist,
        tracks,
        totalSupport: wallet?.totalReceived || 0,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all artists with metadata for browse page
  app.get("/api/artists", async (req, res) => {
    try {
      const allArtists = await storage.getAllArtists();
      
      const artists = await Promise.all(allArtists.map(async (artist) => {
        const artistTracks = await storage.getTracksByArtist(artist.id);
        const stats = await storage.getArtistStats(artist.id);
        const user = await storage.getUser(artist.userId);
        
        return {
          id: artist.id,
          stageName: artist.stageName,
          bio: artist.bio,
          mainGenre: artist.mainGenre,
          profileImageUrl: artist.profileImageUrl,
          universityName: user?.universityName || "Unknown",
          trackCount: artistTracks.length,
          streams: stats.totalPlays,
          createdAt: artist.createdAt,
        };
      }));
      
      res.json(artists);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Support system endpoints
  // Send support to an artist
  app.post("/api/support", requireAuth, async (req, res) => {
    try {
      const { artistId, amount, paymentMethod, message } = req.body;
      
      if (!artistId || !amount || !paymentMethod) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (amount <= 0 || amount > 500000) {
        return res.status(400).json({ error: "Amount must be between 0 and $5000" });
      }

      const support = await storage.sendSupport({
        supporterId: req.session.userId!,
        artistId,
        amount,
        paymentMethod,
        message: message || undefined,
      });

      res.json(support);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get support history for an artist
  app.get("/api/artist/:artistId/supports", async (req, res) => {
    try {
      const { artistId } = req.params;
      const supports = await storage.getArtistSupports(artistId);
      
      const withSupporterInfo = supports.map((support: any) => ({
        ...support,
        amountDisplay: `$${(support.amount / 100).toFixed(2)}`,
      }));

      res.json(withSupporterInfo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get artist wallet info
  app.get("/api/artist/:artistId/wallet", async (req, res) => {
    try {
      const { artistId } = req.params;
      const wallet = await storage.getArtistWallet(artistId);
      
      if (!wallet) {
        const artistProfile = await storage.getArtistProfileById(artistId);
        if (!artistProfile) return res.status(404).json({ error: "Artist not found" });
        
        const newWallet = await storage.createOrUpdateArtistWallet({
          artistId,
          payoutEmail: undefined,
          payoutMethod: undefined,
        });
        
        return res.json({
          ...newWallet,
          balanceDisplay: "$0.00",
        });
      }

      res.json({
        ...wallet,
        balanceDisplay: `$${(wallet.balance / 100).toFixed(2)}`,
        totalReceivedDisplay: `$${(wallet.totalReceived / 100).toFixed(2)}`,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update artist wallet payout info (for artists)
  app.put("/api/artist/:artistId/wallet", requireAuth, async (req, res) => {
    try {
      const { artistId } = req.params;
      const { payoutEmail, payoutMethod } = req.body;

      // Verify artist owns this wallet
      const artistProfile = await storage.getArtistProfileById(artistId);
      if (!artistProfile || artistProfile.userId !== req.session.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const wallet = await storage.updateArtistWallet(artistId, {
        payoutEmail,
        payoutMethod,
      });

      res.json(wallet);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Profile picture upload endpoints
  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL. Please check object storage configuration." });
    }
  });

  app.put("/api/artist/profile-image", requireAuth, async (req, res) => {
    try {
      const { imageURL } = req.body;
      if (!imageURL) {
        return res.status(400).json({ error: "imageURL is required" });
      }

      if (typeof imageURL !== 'string') {
        return res.status(400).json({ error: "imageURL must be a string" });
      }

      if (!imageURL.startsWith('https://') && !imageURL.startsWith('/objects/')) {
        return res.status(400).json({ error: "Invalid image URL format" });
      }

      const artistProfile = await storage.getArtistProfile(req.session.userId!);
      if (!artistProfile) {
        return res.status(404).json({ error: "Artist profile not found" });
      }

      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(imageURL);

      if (!objectPath.startsWith('/objects/')) {
        return res.status(400).json({ error: "Invalid upload path" });
      }

      const updatedProfile = await storage.updateArtistProfile(artistProfile.id, {
        profileImageUrl: objectPath,
      });

      res.json(updatedProfile);
    } catch (error: any) {
      console.error("Error updating profile image:", error);
      res.status(500).json({ error: error.message || "Failed to update profile image" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error: any) {
      if (error.name === "ObjectNotFoundError") {
        return res.sendStatus(404);
      }
      console.error("Error serving object:", error);
      return res.sendStatus(500);
    }
  });

  // Track upload endpoints - Audio files
  app.post("/api/tracks/uploads/audio", requireAuth, async (req, res) => {
    try {
      const artistProfile = await storage.getArtistProfile(req.session.userId!);
      if (!artistProfile) {
        return res.status(403).json({ error: "Only artists can upload tracks" });
      }

      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      
      res.json({ 
        uploadURL,
        maxFileSize: 20 * 1024 * 1024,
        allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac']
      });
    } catch (error: any) {
      console.error("Error getting audio upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL. Please check object storage configuration." });
    }
  });

  // Track upload endpoints - Cover art
  app.post("/api/tracks/uploads/cover", requireAuth, async (req, res) => {
    try {
      const artistProfile = await storage.getArtistProfile(req.session.userId!);
      if (!artistProfile) {
        return res.status(403).json({ error: "Only artists can upload tracks" });
      }

      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      
      res.json({ 
        uploadURL,
        maxFileSize: 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      });
    } catch (error: any) {
      console.error("Error getting cover upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL. Please check object storage configuration." });
    }
  });

  // Create track with uploaded files
  app.post("/api/tracks", requireAuth, async (req, res) => {
    try {
      const { title, description, audioUrl, coverImageUrl, genre, durationSeconds } = req.body;

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: "Track title is required" });
      }
      if (!genre || typeof genre !== 'string' || genre.trim().length === 0) {
        return res.status(400).json({ error: "Genre is required" });
      }
      if (!audioUrl || typeof audioUrl !== 'string') {
        return res.status(400).json({ error: "Audio file URL is required" });
      }
      if (!durationSeconds || typeof durationSeconds !== 'number' || durationSeconds <= 0) {
        return res.status(400).json({ error: "Valid duration is required" });
      }

      const artistProfile = await storage.getArtistProfile(req.session.userId!);
      if (!artistProfile) {
        return res.status(403).json({ error: "Only artists can create tracks" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();

      const normalizedAudioUrl = objectStorageService.normalizeObjectEntityPath(audioUrl);
      
      const uuidPattern = /^\/objects\/uploads\/[a-f0-9-]{36}$/i;
      if (!uuidPattern.test(normalizedAudioUrl)) {
        return res.status(400).json({ error: "Invalid audio file path format" });
      }

      try {
        await objectStorageService.getObjectEntityFile(normalizedAudioUrl);
      } catch (error: any) {
        if (error.name === "ObjectNotFoundError") {
          return res.status(400).json({ error: "Audio file not found. Please upload first." });
        }
        throw error;
      }

      let normalizedCoverUrl: string | null = null;
      if (coverImageUrl && typeof coverImageUrl === 'string') {
        normalizedCoverUrl = objectStorageService.normalizeObjectEntityPath(coverImageUrl);
        if (!uuidPattern.test(normalizedCoverUrl)) {
          return res.status(400).json({ error: "Invalid cover image path format" });
        }
        try {
          await objectStorageService.getObjectEntityFile(normalizedCoverUrl);
        } catch (error: any) {
          if (error.name === "ObjectNotFoundError") {
            return res.status(400).json({ error: "Cover image not found. Please upload first." });
          }
          throw error;
        }
      }

      const track = await storage.createTrack({
        artistId: artistProfile.id,
        title: title.trim(),
        description: description?.trim() || null,
        audioUrl: normalizedAudioUrl,
        coverImageUrl: normalizedCoverUrl,
        genre: genre.trim(),
        universityName: user.universityName || "Unknown",
        country: user.country || "Unknown",
        durationSeconds: Math.round(durationSeconds),
      });

      res.status(201).json(track);
    } catch (error: any) {
      console.error("Error creating track:", error);
      res.status(500).json({ error: error.message || "Failed to create track" });
    }
  });

  // Delete track endpoint
  app.delete("/api/tracks/:trackId", requireAuth, async (req, res) => {
    try {
      const { trackId } = req.params;
      
      const track = await storage.getTrack(trackId);
      if (!track) {
        return res.status(404).json({ error: "Track not found" });
      }

      const artistProfile = await storage.getArtistProfile(req.session.userId!);
      if (!artistProfile || artistProfile.id !== track.artistId) {
        return res.status(403).json({ error: "Unauthorized to delete this track" });
      }

      await storage.deleteTrack(trackId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting track:", error);
      res.status(500).json({ error: error.message || "Failed to delete track" });
    }
  });

  // ===== STRIPE PAYMENT ROUTES =====

  // Get Stripe publishable key for frontend
  app.get("/api/stripe/config", async (_req, res) => {
    try {
      const { getStripePublishableKey, isStripeConfigured } = await import("./stripeClient");
      if (!isStripeConfigured()) {
        return res.status(503).json({ error: "Stripe is not configured" });
      }
      const publishableKey = getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error: any) {
      console.error("Error getting Stripe config:", error);
      res.status(500).json({ error: "Failed to get Stripe configuration" });
    }
  });

  // Create checkout session for artist tip
  app.post("/api/stripe/tip/:artistId", requireAuth, async (req, res) => {
    try {
      const { artistId } = req.params;
      const { amount, message } = req.body;

      if (!amount || typeof amount !== 'number' || amount < 100) {
        return res.status(400).json({ error: "Minimum tip amount is $1.00 (100 cents)" });
      }

      if (amount > 50000) {
        return res.status(400).json({ error: "Maximum tip amount is $500.00" });
      }

      const artistProfile = await storage.getArtistProfileById(artistId);
      if (!artistProfile) {
        return res.status(404).json({ error: "Artist not found" });
      }

      const supporter = await storage.getUser(req.session.userId!);
      if (!supporter) {
        return res.status(404).json({ error: "User not found" });
      }

      const { stripe, isStripeConfigured } = await import("./stripeClient");
      if (!isStripeConfigured() || !stripe) {
        return res.status(503).json({ error: "Payment system is not configured" });
      }

      const baseUrl = process.env.APP_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Tip for ${artistProfile.stageName}`,
              description: message ? `Message: "${message.slice(0, 100)}"` : `Support this artist`,
              images: artistProfile.profileImageUrl ? [artistProfile.profileImageUrl] : undefined,
            },
            unit_amount: amount,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${baseUrl}/artist/${artistId}?tip=success`,
        cancel_url: `${baseUrl}/artist/${artistId}?tip=cancelled`,
        metadata: {
          type: 'artist_tip',
          artistId,
          supporterId: supporter.id,
          message: message?.slice(0, 500) || '',
        },
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (error: any) {
      console.error("Error creating tip checkout session:", error);
      res.status(500).json({ error: error.message || "Failed to create payment session" });
    }
  });

  // Get artist's support history (for artist dashboard)
  app.get("/api/artist/supports", requireAuth, async (req, res) => {
    try {
      const artistProfile = await storage.getArtistProfile(req.session.userId!);
      if (!artistProfile) {
        return res.status(403).json({ error: "Only artists can view their support history" });
      }

      const supports = await storage.getArtistSupports(artistProfile.id);
      res.json(supports);
    } catch (error: any) {
      console.error("Error getting artist supports:", error);
      res.status(500).json({ error: error.message || "Failed to get support history" });
    }
  });

  // Get artist wallet info (for artist dashboard)
  app.get("/api/artist/wallet", requireAuth, async (req, res) => {
    try {
      const artistProfile = await storage.getArtistProfile(req.session.userId!);
      if (!artistProfile) {
        return res.status(403).json({ error: "Only artists can view their wallet" });
      }

      let wallet = await storage.getArtistWallet(artistProfile.id);
      if (!wallet) {
        wallet = await storage.createArtistWallet({ artistId: artistProfile.id });
      }

      res.json(wallet);
    } catch (error: any) {
      console.error("Error getting artist wallet:", error);
      res.status(500).json({ error: error.message || "Failed to get wallet info" });
    }
  });

  // Seed data on startup
  await seedData();

  const httpServer = createServer(app);
  return httpServer;
}
