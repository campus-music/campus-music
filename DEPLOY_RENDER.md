# Campus Music - Render Deployment Guide

This guide walks you through deploying Campus Music to Render using the Blueprint method.

## Prerequisites

Before you begin, ensure you have:

1. A [Render account](https://render.com/) (free tier works)
2. A [GitHub account](https://github.com/) with the Campus Music repository
3. A [Stripe account](https://dashboard.stripe.com/) for payment processing
4. An S3-compatible storage provider (AWS S3, DigitalOcean Spaces, Backblaze B2, etc.)

---

## Step 1: Connect GitHub Repository

1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Blueprint**
3. Connect your GitHub account if not already connected
4. Select the `campus-music/campus-music` repository
5. Click **Connect**

---

## Step 2: Deploy Using Blueprint

The `render.yaml` file in the repository will automatically configure:

- **Web Service**: Node.js application serving the backend API and React frontend
- **PostgreSQL Database**: Persistent database storage

1. After connecting the repo, Render will detect the `render.yaml` file
2. Review the services that will be created:
   - `campus-music` (Web Service)
   - `campus-music-db` (PostgreSQL Database)
3. Click **Apply** to start the deployment

The initial deployment will:
- Install dependencies (`npm install`)
- Build the application (`npm run build`)
- Start the production server (`npm start`)
- Create and configure the PostgreSQL database

---

## Step 3: Configure Environment Variables

After the initial deployment, you need to set the remaining environment variables.

### Web Service Environment Variables

Go to **Dashboard** → **campus-music** → **Environment**

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_URL` | Your Render app URL (no trailing slash) | `https://campus-music.onrender.com` |
| `STRIPE_SECRET_KEY` | Stripe API secret key | `sk_live_...` or `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe API publishable key | `pk_live_...` or `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `S3_BUCKET_NAME` | Your S3 bucket name | `campus-music-uploads` |
| `S3_ACCESS_KEY` | S3 access key ID | `AKIAIOSFODNN7EXAMPLE` |
| `S3_SECRET_KEY` | S3 secret access key | `wJalrXUtnFEMI/K7MDENG/...` |

#### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `S3_REGION` | S3 region | `us-east-1` |
| `S3_ENDPOINT` | Custom S3 endpoint (for non-AWS) | *(none)* |

#### Auto-Configured Variables (Do Not Change)

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Set to `production` |
| `PORT` | Set to `5000` |
| `SESSION_SECRET` | Auto-generated |
| `DATABASE_URL` | Linked from PostgreSQL service |

---

## Step 4: Configure Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/) → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://your-app-url.onrender.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add it as `STRIPE_WEBHOOK_SECRET` in Render environment variables

---

## Step 5: Configure S3 Storage

### Option A: AWS S3

1. Create an S3 bucket in AWS Console
2. Create an IAM user with S3 access
3. Set environment variables:
   - `S3_BUCKET_NAME`: Your bucket name
   - `S3_ACCESS_KEY`: IAM access key ID
   - `S3_SECRET_KEY`: IAM secret access key
   - `S3_REGION`: Bucket region (e.g., `us-east-1`)

### Option B: DigitalOcean Spaces

1. Create a Space in DigitalOcean
2. Create a Spaces access key
3. Set environment variables:
   - `S3_BUCKET_NAME`: Your Space name
   - `S3_ACCESS_KEY`: Spaces access key
   - `S3_SECRET_KEY`: Spaces secret key
   - `S3_REGION`: `us-east-1` (or your region)
   - `S3_ENDPOINT`: `https://nyc3.digitaloceanspaces.com`

### Option C: Backblaze B2

1. Create a B2 bucket
2. Create an application key with read/write access
3. Set environment variables:
   - `S3_BUCKET_NAME`: Your bucket name
   - `S3_ACCESS_KEY`: Application key ID
   - `S3_SECRET_KEY`: Application key
   - `S3_REGION`: `us-west-002`
   - `S3_ENDPOINT`: `https://s3.us-west-002.backblazeb2.com`

---

## Step 6: Redeploy After Configuration

After setting all environment variables:

1. Go to **Dashboard** → **campus-music**
2. Click **Manual Deploy** → **Clear build cache & deploy**
3. Wait for the deployment to complete (usually 2-5 minutes)

---

## Step 7: Verify Deployment

### Health Check

Visit: `https://your-app-url.onrender.com/api/health`

You should see:
```json
{"status":"ok","timestamp":"2024-..."}
```

### Test the Application

1. **Homepage**: Visit your app URL and verify the landing page loads
2. **Sign Up**: Create a new account with a `.edu` email
3. **Login**: Verify login works correctly
4. **Browse Music**: Check that demo tracks are visible
5. **Upload** (artists only): Test file upload functionality
6. **Payments**: Test the tip functionality with Stripe test mode

---

## Troubleshooting

### Common Issues

#### "Application failed to respond"
- Check the **Logs** tab for error messages
- Verify `DATABASE_URL` is correctly linked
- Ensure all required environment variables are set

#### "Database connection failed"
- Wait a few minutes for the database to fully provision
- Check that the `campus-music-db` database is running
- Click **Clear build cache & deploy** to retry

#### "Stripe not configured"
- Verify `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` are set
- Check that you're using the correct API keys (test vs. live)

#### "File upload failed"
- Verify all S3 environment variables are set
- Check S3 bucket permissions (must allow public read for uploaded files)
- Verify the S3 endpoint is correct for your provider

### Viewing Logs

1. Go to **Dashboard** → **campus-music**
2. Click the **Logs** tab
3. Filter by time or search for specific errors

---

## Database Management

### Accessing the Database

1. Go to **Dashboard** → **campus-music-db**
2. Click **Connect** to get connection details
3. Use a PostgreSQL client (e.g., pgAdmin, DBeaver) to connect

### Getting the DATABASE_URL

1. Go to **Dashboard** → **campus-music-db**
2. Click **Connect**
3. Copy the **External Database URL**
4. This is automatically linked to your web service

---

## Updating the Application

When you push changes to GitHub:

1. If `autoDeploy: true` is set, Render will automatically redeploy
2. For manual deploys: **Dashboard** → **campus-music** → **Manual Deploy**

---

## Custom Domain (Optional)

1. Go to **Dashboard** → **campus-music** → **Settings**
2. Scroll to **Custom Domains**
3. Click **Add Custom Domain**
4. Follow the DNS configuration instructions
5. Update `APP_URL` environment variable to your custom domain

---

## Cost Considerations

### Starter Plan (Recommended)
- Web Service: ~$7/month
- PostgreSQL: ~$7/month
- **Total**: ~$14/month

### Free Tier Limitations
- Web services spin down after 15 minutes of inactivity
- PostgreSQL databases expire after 90 days
- Not recommended for production use

---

## Support

- [Render Documentation](https://render.com/docs)
- [Campus Music GitHub Issues](https://github.com/campus-music/campus-music/issues)
- [Stripe Documentation](https://stripe.com/docs)
