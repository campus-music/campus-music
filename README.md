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

### Integrations
- **Stripe** for payment processing (artist tips)
- **S3-Compatible Storage** for file uploads (audio, images)
  - Supports AWS S3, DigitalOcean Spaces, MinIO, Backblaze B2
  - Falls back to local filesystem in development

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Stripe account (for payments)
- S3-compatible storage bucket (for file uploads in production)

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
   - `STRIPE_SECRET_KEY` - Stripe API key (for payments)
   - `S3_*` - S3 storage credentials (optional in development)

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
│   ├── objectStorage.ts   # S3 storage abstraction
│   └── webhookHandlers.ts # Stripe webhooks
├── shared/                 # Shared code
│   └── schema.ts          # Drizzle schema & types
├── render.yaml            # Render deployment config
└── package.json
```

## Deployment

### One-Click Render Deployment

This project includes a `render.yaml` for easy deployment:

1. Fork this repository to your GitHub account
2. Create a new **Blueprint** on [Render](https://render.com)
3. Connect your forked repository
4. Render will automatically create:
   - A web service for the application
   - A PostgreSQL database
5. Configure the following environment variables manually:
   - `APP_URL` - Your Render app URL (e.g., `https://campus-music.onrender.com`)
   - `STRIPE_SECRET_KEY` - From Stripe Dashboard
   - `STRIPE_PUBLISHABLE_KEY` - From Stripe Dashboard
   - `STRIPE_WEBHOOK_SECRET` - After setting up webhooks
   - `S3_BUCKET_NAME`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` - Your S3 storage

### Manual Deployment

1. **Create a PostgreSQL database** on your hosting provider
2. **Set up S3-compatible storage**:
   - Create a bucket on AWS S3, DigitalOcean Spaces, or similar
   - Get access credentials
3. **Configure Stripe webhooks**:
   - Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events: `checkout.session.completed`
   - Copy the webhook signing secret

### Environment Variables for Production

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secure random string (32+ chars) |
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | No | Server port (default: 5000) |
| `APP_URL` | Yes | Your app's public URL |
| `STRIPE_SECRET_KEY` | Yes | Stripe API secret key |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe API publishable key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `S3_BUCKET_NAME` | Yes | S3 bucket name |
| `S3_ACCESS_KEY` | Yes | S3 access key |
| `S3_SECRET_KEY` | Yes | S3 secret key |
| `S3_REGION` | No | S3 region (default: us-east-1) |
| `S3_ENDPOINT` | No | Custom S3 endpoint for non-AWS |

## Demo Accounts

The database seeds with demo data including:

- **Listener**: `listener@stanford.edu` / `password123`
- **Artist**: `elena.martinez@stanford.edu` / `password123`

## Development Notes

### Local Storage Fallback

In development, if S3 credentials are not configured:
- File uploads use the local `uploads/` directory
- Files are served via `/objects/` route
- This is for development only - configure S3 for production

### Stripe Testing

- Use Stripe test mode keys during development
- Test card: `4242 4242 4242 4242` with any future expiry and CVC

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
