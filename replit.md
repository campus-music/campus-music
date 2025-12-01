# Campus Music

## Overview

Campus Music is a dark-themed music streaming platform for university students with .edu email addresses. It allows students to discover and stream music from student artists globally. Key capabilities include browsing by university, genre, and popularity, creating playlists, liking songs, and enabling artists to upload their music. The platform aims to be a dedicated hub for the campus music scene, similar to mainstream services like Apple Music or Spotify but with a niche focus.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Frameworks**: React with TypeScript, Vite for build/dev server, Wouter for routing, TanStack Query for server state.
- **UI/UX**: Shadcn/ui (Radix UI, Tailwind CSS) with a dark-first theme inspired by Apple Music/Spotify. Custom design tokens and Inter font family.
- **State Management**: React Context for authentication and audio playback, React Query for server state, local UI state with React hooks.

### Backend Architecture
- **Server**: Express.js with Node.js, ESM modules, separate dev/prod entry points. Development integrates Vite middleware for HMR/SSR.
- **API**: RESTful endpoints, JSON format, session-based authentication using `express-session`.
- **Authentication**: Email/password authentication (bcrypt), .edu email validation, session-based with secure cookies. User roles: "listener" and "artist".
- **Database**: Drizzle ORM, PostgreSQL (via Neon serverless driver), schema-first approach with shared TypeScript types (`shared/schema.ts`).

### Data Architecture
- **Core Models**: Users (.edu email required), Artist Profiles (linked to users), Tracks (audio content with metadata), Playlists, Likes & Streams.
- **Artist Collaboration**: Artist discovery, friend requests, and direct messaging between connected artists (artist_connections, artist_messages tables - uses artist profile IDs).
- **Universal Social**: User connections and direct messaging for all users including listeners (user_connections, direct_messages tables - uses user IDs).
- **Type Safety**: Shared TypeScript types, Drizzle Zod integration for runtime validation.

### Social Features
- **Artist Feed** (Twitter-like social feed):
  - Artists can post album art + captions to promote new tracks
  - Posts can optionally link to tracks in their catalog
  - Listeners can like, comment, and share posts with connected friends
  - Optimistic updates for instant like/unlike feedback
  - Route: /feed
  - Tables: artist_posts, post_likes, post_comments, post_shares
- **Two Messaging Systems**:
  1. Artist Collaboration Network - For verified artists only, uses artist profile IDs
  2. Universal Social Chat - For all logged-in users (listeners and artists), uses user IDs
- **User Connections**: Friend requests, accept/reject, unfriend functionality
- **Direct Messages**: Real-time chat between connected friends with read receipts
- **Music Taste Matching**: 
  - Users can set favorite artists and genres in their profile (Music Taste tab)
  - Privacy control: `showMusicPreferences` toggle to show/hide preferences from friends
  - Friend suggestions based on weighted Jaccard similarity (60% artist overlap + 40% genre overlap)
  - Suggested Friends carousel on Social page showing similarity scores and common interests
  - Expandable shared music taste display on friend cards (requires friendship and visibility)
  - Tables: listenerFavoriteArtists, listenerFavoriteGenres
- **Routes**: /social (discovery and friend management), /chat (direct messaging), /feed (artist social feed)

### File Storage
- **Abstraction**: S3-compatible storage (AWS S3, DigitalOcean Spaces, MinIO, Backblaze B2) with local filesystem fallback for development.
- **Uploads**: `ObjectUploader` component handles drag-and-drop, validation (5MB max for images, 20MB for audio), progress tracking, and signed URL generation.
- **Track Uploads**: Dedicated endpoints for audio files and cover art via signed URLs.

## External Dependencies

### Frontend Libraries
- `@tanstack/react-query`: Server state management
- `wouter`: Lightweight routing
- `@radix-ui/*`: Headless UI primitives
- `react-hook-form` + `@hookform/resolvers`: Form validation
- `date-fns`: Date manipulation
- `cmdk`: Command palette
- `lucide-react`: Icon system

### Backend Libraries
- `drizzle-orm` + `drizzle-kit`: Type-safe ORM and migrations
- `@neondatabase/serverless`: PostgreSQL driver
- `bcryptjs`: Password hashing
- `express-session`: Session management
- `zod`: Runtime schema validation
- `stripe`: Payment processing

### Development Tools
- `tsx`: TypeScript execution
- `esbuild`: Production server bundling

### Audio Playback
- Native HTML5 `<audio>` element for client-side playback.

### Styling
- PostCSS with Tailwind CSS and Autoprefixer.