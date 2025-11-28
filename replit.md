# Campus Music

## Overview

Campus Music is a dark-themed music streaming platform exclusively for university students with .edu email addresses. The application allows students to discover and stream music from student artists worldwide, similar to Apple Music/Spotify but focused on the campus music scene. Users can browse tracks by university, genre, and popularity, create playlists, like songs, and artists can upload their own music.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server with HMR (Hot Module Replacement)
- React Router via Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and API caching

**UI Component System**
- Shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Dark-first theme inspired by Apple Music and Spotify
- Component variants managed through class-variance-authority (CVA)

**State Management Strategy**
- Authentication state managed via React Context (AuthContext)
- Audio playback state managed via React Context (AudioPlayerContext) with native HTML5 Audio API
- Server state cached and synchronized through React Query
- Local UI state handled with React hooks (useState, useEffect)

**Design System**
- Typography: Inter font family with system font fallbacks
- Spacing: Tailwind's 4px-based spacing scale
- Color system: HSL-based with CSS variables for theme customization
- Component library follows "New York" Shadcn style variant

### Backend Architecture

**Server Framework**
- Express.js running on Node.js with ESM modules
- Separate development (index-dev.ts) and production (index-prod.ts) entry points
- Development mode integrates Vite middleware for HMR and SSR of React app
- Production mode serves static assets from dist/public

**API Design**
- RESTful endpoints organized in routes.ts
- Session-based authentication using express-session
- MemoryStore for session persistence in development
- JSON request/response format with consistent error handling

**Authentication & Authorization**
- Email/password authentication with bcrypt for password hashing
- University email validation (.edu domain requirement)
- Session-based authentication with secure cookies
- User roles: "listener" (default) and "artist"

**Database Layer**
- Drizzle ORM for type-safe database operations
- PostgreSQL as the production database (via Neon serverless driver)
- Schema-first approach with TypeScript type inference
- Database schema defined in shared/schema.ts for frontend/backend type sharing

### Data Architecture

**Core Data Models**

1. **Users**: Authentication and profile information
   - Email must end in .edu for registration
   - Stores university affiliation and country
   - Links to artist profiles for artist role

2. **Artist Profiles**: Extended metadata for student musicians
   - One-to-one relationship with users (role: "artist")
   - Includes stage name, bio, genre, social links
   - Foreign key cascades on user deletion

3. **Tracks**: Audio content with metadata
   - Belongs to artist profiles
   - Stores audio URL, cover art, genre, duration
   - Inherits university and country from artist

4. **Playlists**: User-created collections
   - Public/private visibility control
   - Many-to-many relationship with tracks via junction table

5. **Likes & Streams**: Engagement tracking
   - Simple foreign key relationships for analytics
   - Used for trending algorithms and user libraries

**Type Safety Strategy**
- Shared TypeScript types between client and server via shared/schema.ts
- Drizzle Zod integration for runtime validation
- Insert schemas separate from query schemas to handle defaults

### External Dependencies

**Frontend Libraries**
- @tanstack/react-query: Server state management and caching
- wouter: Lightweight routing (alternative to react-router)
- @radix-ui/*: Headless UI primitives for accessibility
- react-hook-form + @hookform/resolvers: Form validation
- date-fns: Date formatting and manipulation
- cmdk: Command palette/search interface
- lucide-react: Icon system

**Backend Libraries**
- drizzle-orm + drizzle-kit: Type-safe ORM and migrations
- @neondatabase/serverless: PostgreSQL serverless driver
- bcryptjs: Password hashing
- express-session: Session management
- zod: Runtime schema validation

**Development Tools**
- tsx: TypeScript execution for development server
- esbuild: Production server bundling
- Replit-specific plugins: runtime error overlay, dev banner, cartographer (development only)

**Build & Deployment**
- Development: Vite dev server with Express API proxy
- Production: Static React build served by Express
- Database migrations: Drizzle Kit push command
- Environment variables: DATABASE_URL, SESSION_SECRET

**Audio Playback**
- Native HTML5 `<audio>` element (no external libraries)
- Client-side audio state management
- Track queue management in React context

**Styling & Theming**
- PostCSS with Tailwind CSS and Autoprefixer
- CSS variables for theme tokens
- Dark mode as default with light mode support via class-based toggling

**File Storage**
- Replit App Storage (Google Cloud Storage) for user-uploaded files
- Custom ObjectUploader component for file uploads with:
  - Drag-and-drop support
  - File size validation (5MB max for images, 20MB for audio)
  - Image preview before upload
  - Upload progress and cancellation
  - Memory-safe URL handling (proper cleanup of object URLs)
- ObjectStorageService for generating signed upload URLs
- Track upload endpoints for audio files and cover art:
  - POST /api/tracks/uploads/audio - Get signed URL for audio upload (20MB max, MP3/WAV/FLAC)
  - POST /api/tracks/uploads/cover - Get signed URL for cover art upload (5MB max, JPG/PNG/WebP)
  - POST /api/tracks - Create track with uploaded file URLs
  - DELETE /api/tracks/:trackId - Delete track (artist only)

## Production Upgrade Progress

**Phase 1: PostgreSQL Database (COMPLETE)**
- Migrated from in-memory storage to PostgreSQL with Drizzle ORM
- Created DatabaseStorage class implementing IStorage interface
- Idempotent seed function with 8 demo users, 6 artist profiles, 16 tracks
- Fixed all routes to use DatabaseStorage methods

**Phase 2: Real File Uploads (COMPLETE)**
- Extended object storage for audio file uploads
- TrackUploader component with multi-step upload flow:
  1. Select audio file + optional cover art
  2. Upload to cloud storage with progress tracking
  3. Submit track metadata with normalized URLs
- Artist dashboard updated to use real file uploads

**Phase 3: Stripe Payment Integration (COMPLETE)**
- Stripe integration via stripe-replit-sync for automatic webhook handling
- Artist tip checkout sessions with secure Stripe Checkout
- Payment routes: POST /api/stripe/tip/:artistId creates checkout session
- Support history and wallet endpoints for artists
- Real-time webhook processing for payment events
- Frontend SupportModal with preset amounts and Stripe checkout redirect

**Phase 4: Email Verification (PENDING)**
- Email sending and verification workflow

**Phase 5: Security & Deployment (PENDING)**
- Rate limiting, input validation, error handling

## Recent Updates

- Phase 3 complete: Stripe payment integration for artist tips
- Atomic wallet upsert prevents race conditions on concurrent first-time tips
- Transaction-based webhook handler with idempotency (unique transactionId constraint)
- SupportModal redirects to real Stripe Checkout with preset tip amounts
- Artist wallet and support history endpoints for financial tracking
- Phase 2 complete: Real audio file upload functionality
- TrackUploader component for artists to upload tracks
- Profile picture upload functionality for artists
- ObjectUploader component with secure file handling
- API endpoints for file upload with authentication