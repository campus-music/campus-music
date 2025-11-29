# Campus Music API Documentation

Complete API reference for the Campus Music backend server.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Environment Variables](#environment-variables)
4. [API Endpoints](#api-endpoints)
   - [Health Check](#health-check)
   - [Authentication Routes](#authentication-routes)
   - [User Routes](#user-routes)
   - [Artist Routes](#artist-routes)
   - [Track Routes](#track-routes)
   - [Playlist Routes](#playlist-routes)
   - [Social Features](#social-features)
   - [Discovery Routes](#discovery-routes)
   - [File Upload Routes](#file-upload-routes)
   - [Stripe Payment Routes](#stripe-payment-routes)
5. [Data Models](#data-models)
6. [Frontend Integration](#frontend-integration)
7. [Error Handling](#error-handling)

---

## Overview

| Property | Value |
|----------|-------|
| Base URL | `http://localhost:5000` (dev) or `https://your-app.onrender.com` (prod) |
| Content-Type | `application/json` |
| Authentication | Session-based (cookies) |
| Server Files | `server/app.ts`, `server/routes.ts` |

---

## Authentication

### Session-Based Authentication

Campus Music uses **express-session** with cookie-based authentication.

| Property | Value |
|----------|-------|
| Type | HTTP-only secure cookie |
| Session Duration | 7 days |
| Cookie Name | `connect.sid` (default) |
| Storage | MemoryStore (development) |

### Protected Routes

Routes marked with `requireAuth` middleware require a valid session. The middleware checks for `req.session.userId`.

**Unauthorized Response:**
```json
{
  "error": "Unauthorized"
}
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Secret for session encryption | Random 32+ character string |
| `APP_URL` | Public URL of the application | `https://campus-music.onrender.com` |

### Stripe Variables (Required for payments)

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | `sk_live_...` or `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_...` or `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_...` |

### S3 Storage Variables (Required for file uploads)

| Variable | Description | Example |
|----------|-------------|---------|
| `S3_BUCKET_NAME` | S3 bucket name | `campus-music-uploads` |
| `S3_ACCESS_KEY` | AWS Access Key ID | `AKIAIOSFODNN7EXAMPLE` |
| `S3_SECRET_KEY` | AWS Secret Access Key | `wJalrXUtnFEMI/...` |
| `S3_REGION` | AWS region (optional) | `us-east-1` (default) |
| `S3_ENDPOINT` | Custom S3 endpoint (optional) | `https://nyc3.digitaloceanspaces.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |

---

## API Endpoints

### Health Check

#### `GET /api/health`

Health check endpoint for deployment monitoring.

**Auth Required:** No

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-29T12:00:00.000Z"
}
```

**File:** `server/routes.ts:117`

---

### Authentication Routes

#### `POST /api/auth/signup`

Create a new user account.

**Auth Required:** No

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "password123",
  "fullName": "John Doe",
  "universityName": "Stanford University",
  "country": "United States",
  "role": "listener"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email address |
| `password` | string | Yes | Min 8 characters |
| `fullName` | string | Yes | User's full name |
| `universityName` | string | Yes | University affiliation |
| `country` | string | Yes | Country name |
| `role` | string | No | `"listener"` (default) or `"artist"` |

**Success Response (200):**
```json
{
  "id": "uuid-string",
  "email": "student@university.edu",
  "fullName": "John Doe",
  "universityName": "Stanford University",
  "country": "United States",
  "role": "listener",
  "emailVerified": false,
  "createdAt": "2025-11-29T12:00:00.000Z"
}
```

**Error Response (400):**
```json
{
  "error": "Email already registered"
}
```

**File:** `server/routes.ts:130`

---

#### `POST /api/auth/login`

Log in with existing credentials.

**Auth Required:** No

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "id": "uuid-string",
  "email": "student@university.edu",
  "fullName": "John Doe",
  "universityName": "Stanford University",
  "country": "United States",
  "role": "listener",
  "emailVerified": false,
  "createdAt": "2025-11-29T12:00:00.000Z"
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

**File:** `server/routes.ts:149`

---

#### `POST /api/auth/logout`

Log out the current user.

**Auth Required:** No (destroys session if exists)

**Request Body:** None

**Response:**
```json
{
  "success": true
}
```

**File:** `server/routes.ts:172`

---

#### `GET /api/auth/me`

Get the current authenticated user.

**Auth Required:** Yes

**Response:**
```json
{
  "id": "uuid-string",
  "email": "student@university.edu",
  "fullName": "John Doe",
  "universityName": "Stanford University",
  "country": "United States",
  "role": "artist",
  "emailVerified": true,
  "createdAt": "2025-11-29T12:00:00.000Z"
}
```

**File:** `server/routes.ts:178`

---

#### `PUT /api/auth/me`

Update the current user's profile.

**Auth Required:** Yes

**Request Body:**
```json
{
  "fullName": "John Smith",
  "universityName": "MIT",
  "country": "United States"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullName` | string | No | Updated name |
| `universityName` | string | No | Updated university |
| `country` | string | No | Updated country |

**Response:** Updated user object (same as GET /api/auth/me)

**File:** `server/routes.ts:187`

---

#### `POST /api/auth/verify-email`

Verify email with verification code.

**Auth Required:** Yes

**Request Body:**
```json
{
  "code": "verification-token-string"
}
```

**Success Response:** Updated user object with `emailVerified: true`

**Error Response (400):**
```json
{
  "error": "Invalid verification code"
}
```

**File:** `server/routes.ts:393`

---

### Artist Routes

#### `POST /api/artist`

Create an artist profile (requires .edu email).

**Auth Required:** Yes

**Request Body:**
```json
{
  "stageName": "Luna Echo",
  "bio": "Making music between classes",
  "mainGenre": "Electronic",
  "socialLinks": "https://instagram.com/lunaecho",
  "profileImageUrl": "https://example.com/photo.jpg"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stageName` | string | Yes | Artist's stage name |
| `bio` | string | No | Artist biography |
| `mainGenre` | string | Yes | Primary music genre |
| `socialLinks` | string | No | Social media links |
| `profileImageUrl` | string | No | Profile picture URL |

**Success Response (200):**
```json
{
  "id": "artist-uuid",
  "userId": "user-uuid",
  "stageName": "Luna Echo",
  "bio": "Making music between classes",
  "mainGenre": "Electronic",
  "socialLinks": "https://instagram.com/lunaecho",
  "profileImageUrl": "https://example.com/photo.jpg",
  "createdAt": "2025-11-29T12:00:00.000Z"
}
```

**Error Response (403):**
```json
{
  "error": "Only users with .edu email addresses can create artist profiles"
}
```

**File:** `server/routes.ts:206`

---

#### `GET /api/artist/profile`

Get the current user's artist profile.

**Auth Required:** Yes

**Response:** Artist profile object

**File:** `server/routes.ts:234`

---

#### `GET /api/artist/:artistId`

Get an artist by ID with their tracks and wallet info.

**Auth Required:** No

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `artistId` | Artist profile UUID |

**Response:**
```json
{
  "id": "artist-uuid",
  "userId": "user-uuid",
  "stageName": "Luna Echo",
  "bio": "Making music between classes",
  "mainGenre": "Electronic",
  "profileImageUrl": "https://example.com/photo.jpg",
  "createdAt": "2025-11-29T12:00:00.000Z",
  "tracks": [...],
  "totalSupport": 5000
}
```

**File:** `server/routes.ts:669`

---

#### `GET /api/artists`

Get all artists with metadata for browse page.

**Auth Required:** No

**Response:**
```json
[
  {
    "id": "artist-uuid",
    "stageName": "Luna Echo",
    "bio": "Making music between classes",
    "mainGenre": "Electronic",
    "profileImageUrl": "https://example.com/photo.jpg",
    "universityName": "Stanford University",
    "trackCount": 5,
    "streams": 1500,
    "createdAt": "2025-11-29T12:00:00.000Z"
  }
]
```

**File:** `server/routes.ts:692`

---

#### `GET /api/artists/by-university`

Get artists from a specific university.

**Auth Required:** No

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `university` | string | Yes | University name |

**Example:** `/api/artists/by-university?university=Stanford%20University`

**File:** `server/routes.ts:242`

---

#### `GET /api/artist/tracks`

Get tracks for the current artist.

**Auth Required:** Yes (artist only)

**Response:** Array of track objects

**File:** `server/routes.ts:307`

---

#### `GET /api/artist/stats`

Get statistics for the current artist.

**Auth Required:** Yes (artist only)

**Response:**
```json
{
  "totalPlays": 1500,
  "totalLikes": 200,
  "trackCount": 5
}
```

**File:** `server/routes.ts:316`

---

#### `GET /api/artists/:artistId/analytics`

Get detailed analytics for an artist.

**Auth Required:** No

**Response:**
```json
{
  "totalPlays": 1500,
  "streams": {
    "2025-01": 100,
    "2025-02": 150
  },
  "listenerCountries": {
    "United States": 500,
    "United Kingdom": 200
  },
  "topTracks": [...]
}
```

**File:** `server/routes.ts:626`

---

#### `PUT /api/artist/profile-image`

Update artist profile image.

**Auth Required:** Yes (artist only)

**Request Body:**
```json
{
  "imageURL": "https://bucket.s3.amazonaws.com/uploads/uuid"
}
```

**Response:** Updated artist profile

**File:** `server/routes.ts:833`

---

### Track Routes

#### `POST /api/tracks`

Create a new track (artist only).

**Auth Required:** Yes (artist only)

**Request Body:**
```json
{
  "title": "Summer Vibes",
  "description": "An upbeat summer track",
  "audioUrl": "/objects/uploads/audio-uuid",
  "coverImageUrl": "/objects/uploads/cover-uuid",
  "genre": "Electronic",
  "durationSeconds": 210
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Track title |
| `description` | string | No | Track description |
| `audioUrl` | string | Yes | Uploaded audio file path |
| `coverImageUrl` | string | No | Uploaded cover image path |
| `genre` | string | Yes | Music genre |
| `durationSeconds` | number | Yes | Track duration in seconds |

**Response (201):**
```json
{
  "id": "track-uuid",
  "artistId": "artist-uuid",
  "title": "Summer Vibes",
  "audioUrl": "/objects/uploads/audio-uuid",
  "genre": "Electronic",
  "universityName": "Stanford University",
  "country": "United States",
  "durationSeconds": 210,
  "createdAt": "2025-11-29T12:00:00.000Z"
}
```

**File:** `server/routes.ts:963`

---

#### `GET /api/tracks/latest`

Get the 20 most recent tracks.

**Auth Required:** No

**Response:** Array of tracks with artist info

**File:** `server/routes.ts:278`

---

#### `GET /api/tracks/trending`

Get the 20 trending tracks (by stream count).

**Auth Required:** No

**Response:** Array of tracks with artist info

**File:** `server/routes.ts:283`

---

#### `GET /api/tracks/best-of-campus`

Get the top 10 tracks.

**Auth Required:** No

**File:** `server/routes.ts:288`

---

#### `GET /api/tracks/by-university`

Get tracks from a specific university.

**Auth Required:** No

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| `university` | string | Yes |

**File:** `server/routes.ts:293`

---

#### `GET /api/tracks/liked`

Get tracks liked by the current user.

**Auth Required:** Yes

**File:** `server/routes.ts:302`

---

#### `DELETE /api/tracks/:trackId`

Delete a track (artist only, must own the track).

**Auth Required:** Yes (artist only)

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `trackId` | Track UUID |

**Response:**
```json
{
  "success": true
}
```

**File:** `server/routes.ts:1045`

---

#### `POST /api/tracks/:id/like`

Like a track.

**Auth Required:** Yes

**Response:** Like object

**File:** `server/routes.ts:326`

---

#### `DELETE /api/tracks/:id/like`

Unlike a track.

**Auth Required:** Yes

**Response:**
```json
{
  "success": true
}
```

**File:** `server/routes.ts:338`

---

#### `POST /api/tracks/:id/stream`

Record a stream for analytics.

**Auth Required:** Yes

**Response:** Stream object

**File:** `server/routes.ts:344`

---

### Playlist Routes

#### `GET /api/playlists`

Get current user's playlists.

**Auth Required:** Yes

**Response:** Array of playlists with tracks

**File:** `server/routes.ts:357`

---

#### `POST /api/playlists`

Create a new playlist.

**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "My Favorites",
  "description": "Best tracks collection",
  "isPublic": false
}
```

**Response:** Created playlist object

**File:** `server/routes.ts:362`

---

#### `POST /api/playlists/:id/tracks`

Add a track to a playlist.

**Auth Required:** Yes (must own playlist)

**Request Body:**
```json
{
  "trackId": "track-uuid"
}
```

**File:** `server/routes.ts:375`

---

#### `POST /api/playlists/:id/members`

Add a collaborator to a playlist.

**Auth Required:** Yes (must own playlist)

**Request Body:**
```json
{
  "userId": "user-uuid"
}
```

**File:** `server/routes.ts:534`

---

#### `GET /api/playlists/:id/members`

Get playlist members.

**Auth Required:** No

**File:** `server/routes.ts:553`

---

#### `DELETE /api/playlists/:id/members/:userId`

Remove a playlist member.

**Auth Required:** Yes (must own playlist)

**File:** `server/routes.ts:562`

---

### Social Features

#### `POST /api/artists/:artistId/follow`

Follow an artist.

**Auth Required:** Yes

**File:** `server/routes.ts:422`

---

#### `DELETE /api/artists/:artistId/follow`

Unfollow an artist.

**Auth Required:** Yes

**File:** `server/routes.ts:439`

---

#### `GET /api/artists/:artistId/followers`

Get an artist's followers.

**Auth Required:** No

**Response:** Array of user objects (without passwords)

**File:** `server/routes.ts:448`

---

#### `GET /api/user/following`

Get users the current user is following.

**Auth Required:** Yes

**File:** `server/routes.ts:461`

---

#### `POST /api/tracks/:trackId/comments`

Add a comment to a track.

**Auth Required:** Yes

**Request Body:**
```json
{
  "content": "Great track!"
}
```

**File:** `server/routes.ts:475`

---

#### `GET /api/tracks/:trackId/comments`

Get comments for a track.

**Auth Required:** No

**File:** `server/routes.ts:493`

---

#### `DELETE /api/comments/:commentId`

Delete a comment.

**Auth Required:** Yes

**File:** `server/routes.ts:502`

---

#### `POST /api/tracks/:trackId/share`

Share a track.

**Auth Required:** Yes

**File:** `server/routes.ts:512`

---

#### `GET /api/tracks/:trackId/share-count`

Get share count for a track.

**Auth Required:** No

**Response:**
```json
{
  "count": 42
}
```

**File:** `server/routes.ts:524`

---

### Discovery Routes

#### `GET /api/universities`

Get list of all universities with artists.

**Auth Required:** No

**Response:** Array of university names

**File:** `server/routes.ts:577`

---

#### `GET /api/genres`

Get list of all genres.

**Auth Required:** No

**Response:** Array of genre names

**File:** `server/routes.ts:587`

---

#### `GET /api/genres/:genre/tracks`

Get tracks by genre.

**Auth Required:** No

**File:** `server/routes.ts:596`

---

#### `GET /api/genres/:genre/artists`

Get top artists by genre.

**Auth Required:** No

**Query Parameters:**
| Parameter | Type | Default |
|-----------|------|---------|
| `limit` | number | 10 |

**File:** `server/routes.ts:605`

---

#### `GET /api/user/recommendations`

Get personalized track recommendations.

**Auth Required:** Yes

**Query Parameters:**
| Parameter | Type | Default |
|-----------|------|---------|
| `limit` | number | 20 |

**File:** `server/routes.ts:615`

---

#### `GET /api/search/tracks`

Search tracks by title/description.

**Auth Required:** No

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| `query` | string | Yes |

**File:** `server/routes.ts:641`

---

#### `GET /api/search/artists`

Search artists by name/genre.

**Auth Required:** No

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| `query` | string | Yes |

**File:** `server/routes.ts:650`

---

### File Upload Routes

#### `POST /api/objects/upload`

Get a presigned URL for file upload.

**Auth Required:** Yes

**Request Body:** None

**Response:**
```json
{
  "uploadURL": "https://bucket.s3.amazonaws.com/uploads/uuid?X-Amz-Signature=..."
}
```

**File:** `server/routes.ts:821`

---

#### `POST /api/tracks/uploads/audio`

Get upload URL for audio files (artist only).

**Auth Required:** Yes (artist only)

**Response:**
```json
{
  "uploadURL": "https://bucket.s3.amazonaws.com/uploads/uuid?...",
  "maxFileSize": 20971520,
  "allowedTypes": ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/flac"]
}
```

**File:** `server/routes.ts:917`

---

#### `POST /api/tracks/uploads/cover`

Get upload URL for cover art (artist only).

**Auth Required:** Yes (artist only)

**Response:**
```json
{
  "uploadURL": "https://bucket.s3.amazonaws.com/uploads/uuid?...",
  "maxFileSize": 5242880,
  "allowedTypes": ["image/jpeg", "image/png", "image/webp"]
}
```

**File:** `server/routes.ts:940`

---

#### `GET /objects/:objectPath`

Serve uploaded files.

**Auth Required:** No

**File:** `server/routes.ts:872`

---

#### `PUT /api/upload/local/:objectId`

Local file upload (development only).

**Auth Required:** Yes

**File:** `server/routes.ts:888`

---

### Stripe Payment Routes

#### `POST /api/stripe/webhook`

Stripe webhook endpoint (registered in app.ts before JSON middleware).

**Auth Required:** No (uses Stripe signature verification)

**Headers:**
| Header | Required |
|--------|----------|
| `stripe-signature` | Yes |

**Request Body:** Raw JSON (Stripe event)

**Response:**
```json
{
  "received": true
}
```

**File:** `server/app.ts:61`

---

#### `GET /api/stripe/config`

Get Stripe publishable key for frontend.

**Auth Required:** No

**Response:**
```json
{
  "publishableKey": "pk_test_..."
}
```

**Error Response (503):**
```json
{
  "error": "Stripe is not configured"
}
```

**File:** `server/routes.ts:1070`

---

#### `POST /api/stripe/tip/:artistId`

Create a Stripe checkout session for artist tip.

**Auth Required:** Yes

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `artistId` | Artist profile UUID |

**Request Body:**
```json
{
  "amount": 500,
  "message": "Keep up the great work!"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | Yes | Amount in cents (min: 100, max: 50000) |
| `message` | string | No | Optional message to artist |

**Response:**
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

**File:** `server/routes.ts:1085`

---

#### `GET /api/artist/supports`

Get support history for current artist.

**Auth Required:** Yes (artist only)

**Response:** Array of support objects

**File:** `server/routes.ts:1148`

---

#### `GET /api/artist/wallet`

Get wallet info for current artist.

**Auth Required:** Yes (artist only)

**Response:**
```json
{
  "id": "wallet-uuid",
  "artistId": "artist-uuid",
  "totalReceived": 5000,
  "balance": 5000,
  "payoutEmail": null,
  "payoutMethod": null,
  "createdAt": "2025-11-29T12:00:00.000Z"
}
```

**File:** `server/routes.ts:1164`

---

#### `GET /api/artist/:artistId/supports`

Get support history for any artist.

**Auth Required:** No

**Response:**
```json
[
  {
    "id": "support-uuid",
    "supporterId": "user-uuid",
    "artistId": "artist-uuid",
    "amount": 500,
    "amountDisplay": "$5.00",
    "message": "Great music!",
    "createdAt": "2025-11-29T12:00:00.000Z"
  }
]
```

**File:** `server/routes.ts:749`

---

#### `GET /api/artist/:artistId/wallet`

Get wallet info for any artist.

**Auth Required:** No

**File:** `server/routes.ts:766`

---

#### `PUT /api/artist/:artistId/wallet`

Update artist wallet payout info.

**Auth Required:** Yes (must be the artist)

**Request Body:**
```json
{
  "payoutEmail": "artist@example.com",
  "payoutMethod": "paypal"
}
```

**File:** `server/routes.ts:798`

---

## Data Models

### User

```typescript
{
  id: string;           // UUID
  email: string;        // Unique email
  password: string;     // Hashed (never returned in API)
  fullName: string;
  universityName: string;
  country: string;
  role: "listener" | "artist";
  emailVerified: boolean;
  verificationToken?: string;
  createdAt: Date;
}
```

### ArtistProfile

```typescript
{
  id: string;           // UUID
  userId: string;       // References users.id
  stageName: string;
  bio?: string;
  mainGenre: string;
  socialLinks?: string;
  profileImageUrl?: string;
  createdAt: Date;
}
```

### Track

```typescript
{
  id: string;           // UUID
  artistId: string;     // References artistProfiles.id
  title: string;
  description?: string;
  audioUrl: string;
  coverImageUrl?: string;
  genre: string;
  universityName: string;
  country: string;
  durationSeconds: number;
  createdAt: Date;
}
```

### Playlist

```typescript
{
  id: string;           // UUID
  userId: string;       // References users.id
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
}
```

### Support

```typescript
{
  id: string;           // UUID
  supporterId: string;  // References users.id
  artistId: string;     // References artistProfiles.id
  amount: number;       // In cents
  paymentMethod: string;
  status: "pending" | "completed" | "failed";
  message?: string;
  transactionId?: string; // Stripe session ID
  createdAt: Date;
}
```

### ArtistWallet

```typescript
{
  id: string;           // UUID
  artistId: string;     // References artistProfiles.id (unique)
  totalReceived: number; // In cents
  balance: number;       // In cents
  payoutEmail?: string;
  payoutMethod?: string;
  lastPayoutAt?: Date;
  createdAt: Date;
}
```

---

## Frontend Integration

### API Client Setup

**File:** `client/src/lib/queryClient.ts`

```typescript
export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  body?: any
) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}
```

### Example Frontend Usage

#### Authentication (auth-context.tsx)

```typescript
// Login
const loginMutation = useMutation({
  mutationFn: async (data) => {
    const res = await apiRequest('POST', '/api/auth/login', data);
    return res;
  },
});

// Get current user
const { data: user } = useQuery({
  queryKey: ['/api/auth/me'],
});
```

#### Tracks (trending.tsx)

```typescript
const { data: tracks } = useQuery<TrackWithArtist[]>({
  queryKey: ['/api/tracks/trending'],
});
```

#### Support Modal (support-modal.tsx)

```typescript
const tipMutation = useMutation({
  mutationFn: async ({ amount, message }) => {
    const res = await apiRequest('POST', `/api/stripe/tip/${artistId}`, {
      amount,
      message,
    });
    return res;
  },
  onSuccess: (data) => {
    window.location.href = data.url; // Redirect to Stripe Checkout
  },
});
```

#### File Upload (track-uploader.tsx)

```typescript
// 1. Get presigned URL
const res = await apiRequest('POST', '/api/tracks/uploads/audio', {});
const { uploadURL } = res;

// 2. Upload file directly to S3
await fetch(uploadURL, {
  method: 'PUT',
  body: audioFile,
  headers: { 'Content-Type': audioFile.type },
});

// 3. Create track with URL
await apiRequest('POST', '/api/tracks', {
  title,
  audioUrl: uploadURL.split('?')[0], // Remove query params
  genre,
  durationSeconds,
});
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message here"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 304 | Not Modified (cached) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (not authorized for this action) |
| 404 | Not Found |
| 500 | Internal Server Error |
| 503 | Service Unavailable (e.g., Stripe not configured) |

### Common Error Messages

| Error | Cause |
|-------|-------|
| `"Unauthorized"` | No valid session |
| `"Invalid credentials"` | Wrong email/password |
| `"Email already registered"` | Duplicate email |
| `"Only users with .edu email addresses can create artist profiles"` | Non-.edu email trying to create artist profile |
| `"Artist profile required"` | Trying to create track without artist profile |
| `"Stripe is not configured"` | Missing Stripe environment variables |
| `"Minimum tip amount is $1.00"` | Tip amount < 100 cents |

---

## Server Files Reference

| File | Purpose |
|------|---------|
| `server/app.ts` | Express app setup, middleware, Stripe webhook |
| `server/routes.ts` | All API route handlers |
| `server/storage.ts` | Database operations (IStorage interface) |
| `server/db.ts` | Drizzle database connection |
| `server/stripeClient.ts` | Stripe SDK initialization |
| `server/webhookHandlers.ts` | Stripe webhook event processing |
| `server/objectStorage.ts` | S3/local file storage abstraction |
| `shared/schema.ts` | Database schema and Zod validation |

---

*Last updated: November 2025*
