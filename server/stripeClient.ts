import Stripe from 'stripe';

let connectionSettings: any;
let cachedStripeClient: Stripe | null = null;
let cachedPublishableKey: string | null = null;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken || !hostname) {
    console.warn('Replit connector credentials not available - Stripe will use env vars fallback');
    return {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY || '',
    };
  }

  const connectorName = 'stripe';
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', connectorName);
  url.searchParams.set('environment', targetEnvironment);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    });

    const data = await response.json();
    connectionSettings = data.items?.[0];

    if (!connectionSettings || (!connectionSettings.settings.publishable || !connectionSettings.settings.secret)) {
      console.warn(`Stripe ${targetEnvironment} connection not found - using env vars fallback`);
      return {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        secretKey: process.env.STRIPE_SECRET_KEY || '',
      };
    }

    return {
      publishableKey: connectionSettings.settings.publishable,
      secretKey: connectionSettings.settings.secret,
    };
  } catch (error) {
    console.error('Error fetching Stripe credentials:', error);
    return {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY || '',
    };
  }
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getCredentials();
  if (!secretKey) {
    throw new Error('Stripe secret key not available');
  }
  return new Stripe(secretKey);
}

export async function getStripeClient(): Promise<Stripe | null> {
  if (cachedStripeClient) return cachedStripeClient;
  
  try {
    cachedStripeClient = await getUncachableStripeClient();
    return cachedStripeClient;
  } catch (error) {
    console.error('Failed to initialize Stripe client:', error);
    return null;
  }
}

export async function getStripePublishableKey(): Promise<string> {
  if (cachedPublishableKey) return cachedPublishableKey;
  
  const { publishableKey } = await getCredentials();
  if (!publishableKey) {
    throw new Error('Stripe publishable key not available');
  }
  cachedPublishableKey = publishableKey;
  return publishableKey;
}

export async function getStripeSecretKey(): Promise<string> {
  const { secretKey } = await getCredentials();
  if (!secretKey) {
    throw new Error('Stripe secret key not available');
  }
  return secretKey;
}

export async function isStripeConfigured(): Promise<boolean> {
  try {
    const { publishableKey, secretKey } = await getCredentials();
    return !!(publishableKey && secretKey);
  } catch {
    return false;
  }
}

export const stripe = null;
