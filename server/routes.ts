import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { insertUserSchema, loginSchema, insertArtistProfileSchema, insertTrackSchema, insertPlaylistSchema } from "@shared/schema";

// Seed data function
async function seedData() {
  // Check if already seeded
  const existingUser = await storage.getUserByEmail("demo@stanford.edu");
  if (existingUser) return;

  console.log("Seeding database with demo data...");

  // Create demo users and artists
  const universities = [
    { name: "Stanford University", country: "United States" },
    { name: "MIT", country: "United States" },
    { name: "Harvard University", country: "United States" },
    { name: "UC Berkeley", country: "United States" },
    { name: "Oxford University", country: "United Kingdom" },
  ];

  const genres = ["Pop", "Hip-Hop", "Electronic", "Rock", "R&B", "Indie", "Jazz"];
  const artistNames = ["Luna Echo", "The Campus Collective", "Digital Dreams", "Midnight Study", "Thesis Beats"];

  for (let i = 0; i < 5; i++) {
    const uni = universities[i];
    const user = await storage.createUser({
      email: `demo${i + 1}@${uni.name.toLowerCase().replace(/\s+/g, '')}.edu`,
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
      profileImageUrl: undefined,
    });

    // Create 3-5 tracks per artist
    const trackCount = 3 + Math.floor(Math.random() * 3);
    for (let j = 0; j < trackCount; j++) {
      const track = await storage.createTrack({
        artistId: artistProfile.id,
        title: `${genres[i % genres.length]} Track ${j + 1}`,
        description: `An original track created during late-night study sessions at ${uni.name}.`,
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Demo audio
        coverImageUrl: undefined,
        genre: genres[(i + j) % genres.length],
        universityName: uni.name,
        country: uni.country,
        durationSeconds: 180 + Math.floor(Math.random() * 120),
      });

      // Add some streams and likes
      const streamCount = Math.floor(Math.random() * 100);
      for (let k = 0; k < streamCount; k++) {
        await storage.recordStream({
          userId: user.id,
          trackId: track.id,
        });
      }
    }
  }

  // Create a listener user
  await storage.createUser({
    email: "listener@stanford.edu",
    password: "password123",
    fullName: "Demo Listener",
    universityName: "Stanford University",
    country: "United States",
    role: "listener",
  });

  console.log("Database seeded successfully!");
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
    const { query } = req.query;
    if (!query || typeof query !== 'string') {
      return res.json([]);
    }
    const lowerQuery = query.toLowerCase();
    const allArtists = Array.from((storage as any).artistProfiles.values());
    const filtered = allArtists.filter((a: any) =>
      a.stageName.toLowerCase().includes(lowerQuery) ||
      a.mainGenre.toLowerCase().includes(lowerQuery)
    );
    res.json(filtered);
  });

  // Seed data on startup
  await seedData();

  const httpServer = createServer(app);
  return httpServer;
}
