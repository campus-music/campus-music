# Campus Music – University Music Streaming Platform

A dark-themed music streaming platform exclusively for university students. Discover and stream music from student artists worldwide, create playlists, support your favorite campus musicians, and connect with the global student music community.

## Features

- **Student-Focused**: Designed for university communities with .edu email verification for artists
- **Music Discovery**: Browse tracks by university, genre, and popularity
- **Artist Support**: Tip your favorite student artists via Stripe payments
- **Social Features**: Create playlists, like songs, follow artists
- **Artist Dashboard**: Upload tracks, view analytics, manage profile
- **Real-Time Streaming**: HTML5 audio player with queue management

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast builds and HMR
- **TanStack Query** for server state management
- **Tailwind CSS** with custom dark theme
- **Shadcn/ui** component library (Radix UI primitives)
- **Wouter** for lightweight routing

### Backend
- **Node.js** with Express
- **TypeScript** with ESM modules
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** database
- **Express Session** for authentication

### Integrations (Replit-Optimized)
- **Stripe** via Replit connector for payment processing (artist tips)
- **Replit Object Storage** for file uploads (audio, images)
- **PostgreSQL** via Replit's built-in database

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Stripe account (for payments)
- Google Cloud Storage bucket (for file uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/campus-music.git
   cd campus-music
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your values:
   - `DATABASE_URL` - PostgreSQL connection string
   - `SESSION_SECRET` - Random secret for session encryption
   - Stripe keys (for payments)
   - GCS credentials (for file uploads)

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5000`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Run production server |
| `npm run db:push` | Push schema changes to database |
| `npm run check` | TypeScript type checking |

## Project Structure

```
campus-music/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts (auth, audio player)
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and API client
│   └── index.html
├── server/                 # Express backend
│   ├── app.ts             # Express app setup
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── db.ts              # Database connection
│   ├── stripeClient.ts    # Stripe integration
│   └── webhookHandlers.ts # Stripe webhooks
├── shared/                 # Shared code
│   └── schema.ts          # Drizzle schema & types
└── package.json
```

## Deployment

### Replit Deployment

This project is optimized for Replit with built-in integrations for:
- **Stripe**: Uses Replit's Stripe connector for automatic webhook management
- **Object Storage**: Uses Replit's Object Storage for file uploads
- **PostgreSQL**: Uses Replit's built-in database

To deploy on Replit, simply use the "Publish" feature.

### Render / Other Platforms

> **Important**: This codebase uses Replit-specific integrations that must be adapted for other platforms.

When deploying outside Replit, you'll need to modify the following files:

#### Required Code Changes

1. **`server/stripeClient.ts`** - Replace Replit Stripe connector:
   ```typescript
   // Replace with standard Stripe initialization
   import Stripe from 'stripe';
   export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
   ```

2. **`server/objectStorage.ts`** - Replace Replit Object Storage:
   - Currently uses Replit sidecar on `http://127.0.0.1:1106`
   - Replace with `@google-cloud/storage` SDK or S3-compatible storage

3. **`server/routes.ts` & `server/app.ts`** - Replace REPLIT_DOMAINS:
   - Change `process.env.REPLIT_DOMAINS?.split(',')[0]` to `process.env.APP_URL`

#### Deployment Steps

1. **Create a new Web Service on [Render](https://render.com)**
2. **Connect your GitHub repository**
3. **Configure build settings**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. **Add a PostgreSQL database** on Render
5. **Configure environment variables** (see below)
6. **Set up Stripe webhooks** manually at dashboard.stripe.com

### Environment Variables for Production

Ensure these are set in your hosting platform:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secure random string (32+ chars) |
| `NODE_ENV` | Set to `production` |
| `PORT` | Server port (default: 5000) |
| `APP_URL` | Your app's public URL (for webhooks) |
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCS service account JSON |

## Demo Accounts

The database seeds with demo data including:

- **Listener**: `listener@stanford.edu` / `password123`
- **Artist**: `elena.martinez@stanford.edu` / `password123`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built with [Shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- Inspired by Apple Music and Spotify
