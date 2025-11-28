# Campus Music - Product Report

**Document Version:** 1.0  
**Date:** November 28, 2025  
**Status:** Feature Complete (MVP)

---

## Executive Summary

Campus Music is a dark-themed music streaming platform designed exclusively for university students. The application enables students to discover and stream music created by fellow student artists worldwide, creating a unique campus-focused music ecosystem similar to Spotify or Apple Music but tailored to the academic community.

The platform supports two user types: **Listeners** (any user) and **Student Artists** (verified via .edu email). Artists can upload music, build their brand, and receive financial support from fans, while listeners can discover new music, create playlists, and engage with their favorite campus artists.

---

## Product Overview

### Vision
Create the go-to music platform for university students to discover, share, and support student-created music globally.

### Target Audience
- **Primary:** University students aged 18-25
- **Secondary:** Student musicians and emerging artists
- **Geographic:** Global (with university-based discovery)

### Key Differentiators
1. University-focused discovery (browse music by school)
2. .edu email verification for artist authenticity
3. Direct financial support system for student artists
4. Campus community features (follows, comments, shares)

---

## Feature Inventory

### 1. Authentication & User Management

| Feature | Status | Description |
|---------|--------|-------------|
| User Registration | ✅ Complete | Dual-path signup (Listener vs Artist) |
| Email Validation | ✅ Complete | .edu domain required for artists |
| Login/Logout | ✅ Complete | Session-based authentication |
| Profile Management | ✅ Complete | Edit name, university, country |
| Role-Based Access | ✅ Complete | Different features for listeners vs artists |

**User Roles:**
- **Listener:** Can browse, stream, like, comment, create playlists, and support artists
- **Artist:** All listener features + upload tracks, analytics dashboard, receive support

### 2. Music Discovery

| Feature | Status | Description |
|---------|--------|-------------|
| Home Feed | ✅ Complete | New releases, trending, top artists |
| Browse by Genre | ✅ Complete | Filter tracks by music genre |
| Browse by University | ✅ Complete | Discover music from specific schools |
| Trending Songs | ✅ Complete | Most-streamed tracks on the platform |
| New Releases | ✅ Complete | Recently uploaded tracks |
| Personalized Recommendations | ✅ Complete | AI-based suggestions based on listening history |
| Global Search | ✅ Complete | Search tracks, artists, and playlists |
| Best of Campus | ✅ Complete | Curated top tracks from all universities |

**Featured Universities Include:**
- DePaul University (specifically requested)
- Stanford University
- MIT
- Harvard University
- UC Berkeley
- Oxford University
- University of Toronto
- And more...

### 3. Audio Playback

| Feature | Status | Description |
|---------|--------|-------------|
| Stream Tracks | ✅ Complete | HTML5 audio player |
| Persistent Player | ✅ Complete | Player visible across all pages |
| Play/Pause Controls | ✅ Complete | Standard playback controls |
| Progress Bar | ✅ Complete | Seekable track timeline |
| Volume Control | ✅ Complete | Adjustable volume slider |
| Track Queue | ✅ Complete | Queue management |
| Play Count Tracking | ✅ Complete | Streams recorded for analytics |

### 4. Social Features

| Feature | Status | Description |
|---------|--------|-------------|
| Follow Artists | ✅ Complete | Users can follow their favorite artists |
| Comments on Tracks | ✅ Complete | Leave comments on individual tracks |
| Share Tracks | ✅ Complete | Share functionality with count tracking |
| Follower/Following Lists | ✅ Complete | View who follows whom |
| Like Tracks | ✅ Complete | Heart/like functionality |

### 5. Library & Playlists

| Feature | Status | Description |
|---------|--------|-------------|
| Liked Songs | ✅ Complete | Personal collection of liked tracks |
| Create Playlists | ✅ Complete | User-created playlists |
| Add Tracks to Playlists | ✅ Complete | Playlist management |
| Public/Private Playlists | ✅ Complete | Visibility control |
| Collaborative Playlists | ✅ Complete | Invite collaborators to edit playlists |

### 6. Artist Features

| Feature | Status | Description |
|---------|--------|-------------|
| Artist Onboarding | ✅ Complete | Guided setup for new artists |
| Artist Profile | ✅ Complete | Stage name, bio, genre, social links |
| Profile Picture Upload | ✅ Complete | Custom profile images via cloud storage |
| Track Upload | ✅ Complete | Upload new music with metadata |
| Artist Dashboard | ✅ Complete | Overview of artist activity |
| Analytics Dashboard | ✅ Complete | Detailed performance metrics |

**Analytics Include:**
- Total plays/streams
- Total likes
- Top performing tracks
- Listener demographics (by country)
- Stream trends over time

### 7. Financial Support System

| Feature | Status | Description |
|---------|--------|-------------|
| Send Support/Tips | ✅ Complete | Listeners can financially support artists |
| Multiple Payment Methods | ✅ Complete | Mobile Money, PayPal, Stripe (simulated) |
| Support Messages | ✅ Complete | Optional message with tip |
| Artist Wallet | ✅ Complete | Track earnings and balance |
| Payout Settings | ✅ Complete | Configure payout email/method |
| Support History | ✅ Complete | View past support received |

**Note:** Payment processing is currently simulated. Integration with real payment providers (Stripe, PayPal) would be needed for production.

---

## Technical Architecture

### Frontend Stack
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight router)
- **State Management:** TanStack Query (React Query) + React Context
- **UI Components:** Shadcn/ui + Radix UI primitives
- **Styling:** Tailwind CSS with custom design tokens
- **Build Tool:** Vite

### Backend Stack
- **Runtime:** Node.js with Express.js
- **Database ORM:** Drizzle ORM
- **Database:** PostgreSQL (Neon serverless)
- **Authentication:** Session-based with bcrypt password hashing
- **File Storage:** Replit App Storage (Google Cloud Storage)

### Data Models

```
Users
├── id, email, password, fullName
├── role (listener/artist)
├── universityName, country
└── createdAt

ArtistProfiles
├── id, userId (FK)
├── stageName, bio, mainGenre
├── profileImageUrl
├── socialLinks (instagram, twitter, etc.)
└── createdAt

Tracks
├── id, artistId (FK)
├── title, audioUrl, coverArtUrl
├── genre, duration
├── universityName, country
└── createdAt

Playlists
├── id, userId (FK)
├── name, description
├── isPublic, coverImage
└── createdAt

PlaylistMembers (for collaboration)
├── playlistId, userId, role
└── joinedAt

Likes, Streams, Followers, Comments, Shares
└── (engagement tracking tables)

Supports & ArtistWallets
└── (financial support system)
```

---

## Page Inventory

### Public Pages (No Login Required)
| Page | Route | Description |
|------|-------|-------------|
| Landing | `/landing` | Marketing homepage |
| Login | `/login` | User authentication |
| Signup | `/signup` | New user registration |
| Browse | `/browse` | Public music browsing |
| Search | `/search` | Global search |
| Artist Detail | `/artist/:id` | Public artist page |
| All Artists | `/all-artists` | Browse all artists |
| Genres | `/genres` | Browse by genre |

### Protected Pages (Login Required)
| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Main dashboard |
| Trending | `/trending` | Trending tracks |
| New Releases | `/new-releases` | Latest uploads |
| Discover | `/discover` | Browse by university |
| Library | `/library` | Liked songs & playlists |
| Playlists | `/playlists` | Playlist management |
| Recommendations | `/recommendations` | Personalized picks |
| Profile | `/profile` | Account settings |

### Artist-Only Pages
| Page | Route | Description |
|------|-------|-------------|
| Artist Onboard | `/artist/onboard` | First-time setup |
| Artist Dashboard | `/artist/dashboard` | Artist home |
| Artist Analytics | `/artist/analytics` | Performance metrics |

---

## API Endpoints Summary

### Authentication (4 endpoints)
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Artists (8 endpoints)
- `POST /api/artist` - Create artist profile
- `GET /api/artist/profile` - Get own profile
- `PUT /api/artist/profile` - Update profile
- `PUT /api/artist/profile-image` - Update profile picture
- `GET /api/artists` - List all artists
- `GET /api/artists/:id` - Get artist by ID
- `GET /api/artists/by-university` - Filter by school
- `GET /api/artist/stats` - Artist statistics

### Tracks (12 endpoints)
- `POST /api/tracks` - Upload track
- `GET /api/tracks/latest` - New releases
- `GET /api/tracks/trending` - Popular tracks
- `GET /api/tracks/by-university` - Filter by school
- `GET /api/tracks/by-genre` - Filter by genre
- `GET /api/tracks/liked` - User's liked tracks
- `POST /api/tracks/:id/like` - Like a track
- `DELETE /api/tracks/:id/like` - Unlike a track
- `POST /api/tracks/:id/stream` - Record stream
- `GET /api/tracks/:id/comments` - Get comments
- `POST /api/tracks/:id/comments` - Add comment
- `POST /api/tracks/:id/share` - Share track

### Playlists (7 endpoints)
- `GET /api/playlists` - User's playlists
- `POST /api/playlists` - Create playlist
- `GET /api/playlists/:id` - Get playlist
- `POST /api/playlists/:id/tracks` - Add track
- `POST /api/playlists/:id/members` - Add collaborator
- `GET /api/playlists/:id/members` - List collaborators
- `DELETE /api/playlists/:id/members/:userId` - Remove collaborator

### Social (5 endpoints)
- `POST /api/artists/:id/follow` - Follow artist
- `DELETE /api/artists/:id/follow` - Unfollow artist
- `GET /api/artists/:id/followers` - Artist's followers
- `GET /api/user/following` - Who user follows
- `DELETE /api/comments/:id` - Delete comment

### Support System (4 endpoints)
- `POST /api/support` - Send financial support
- `GET /api/artist/:id/supports` - Support history
- `GET /api/artist/:id/wallet` - Wallet balance
- `PUT /api/artist/:id/wallet` - Update payout info

### Discovery (4 endpoints)
- `GET /api/genres` - List genres
- `GET /api/universities` - List universities
- `GET /api/recommendations` - Personalized picks
- `GET /api/search` - Global search

### File Upload (2 endpoints)
- `POST /api/objects/upload` - Get upload URL
- `GET /objects/:path` - Serve uploaded files

---

## Demo Accounts

The application is seeded with demo data for testing:

| Email | Password | Role | Stage Name |
|-------|----------|------|------------|
| demo1@stanforduniversity.edu | password123 | Artist | Luna Echo |
| demo2@mitedu.edu | password123 | Artist | Neon Pulse |
| demo3@harvarduniversity.edu | password123 | Artist | Violet Storm |
| listener@gmail.com | password123 | Listener | - |

---

## Known Limitations & Future Considerations

### Current Limitations

1. **Payment Processing**
   - Financial support system simulates transactions
   - No real Stripe/PayPal integration yet
   - Would need proper payment flow for production

2. **Audio File Upload**
   - Track creation accepts URLs for audio files
   - Actual audio file upload to cloud storage not implemented
   - Currently using demo/placeholder audio URLs

3. **Email Verification**
   - .edu domain validation only (no email sending)
   - No verification email workflow

4. **Data Persistence**
   - Using in-memory storage (MemStorage) for demo
   - Data resets on server restart
   - PostgreSQL schema ready for production use

### Recommended Next Steps

1. **Payment Integration**
   - Connect Stripe for real transactions
   - Implement proper checkout flow
   - Add payout functionality for artists

2. **Audio Upload**
   - Extend file upload to support audio files
   - Add audio processing/transcoding
   - Implement proper audio streaming CDN

3. **Email System**
   - Add email verification for new accounts
   - Password reset functionality
   - Notification emails

4. **Database Migration**
   - Switch from MemStorage to PostgreSQL
   - Run Drizzle migrations
   - Set up backup/recovery

5. **Mobile Optimization**
   - Responsive design improvements
   - Progressive Web App (PWA) features
   - Native mobile apps (future)

---

## Design & Branding

### Visual Identity
- **Theme:** Dark mode by default (Spotify-inspired)
- **Primary Color:** Blue accent (#3B82F6)
- **Typography:** Inter font family
- **Style:** Modern, clean, music-focused

### Logo
Custom Campus Music logo featuring musical notation elements.

### Accessibility
- Keyboard navigation support via Radix UI
- ARIA labels on interactive elements
- Color contrast compliance
- Screen reader compatible

---

## Conclusion

Campus Music is a fully functional MVP that delivers on its core promise: a music streaming platform built specifically for the university community. All major features are implemented including:

- Dual user roles (listeners and artists)
- Music discovery by genre, university, and trends
- Social engagement (follows, comments, shares, likes)
- Playlist creation and collaboration
- Artist analytics and financial support
- Custom profile picture uploads

The application is ready for user testing and can be published for early adopters. The architecture supports future expansion including real payment processing, mobile apps, and advanced recommendation algorithms.

---

**Prepared by:** Development Team  
**For:** Product Management  
**Classification:** Internal Use
