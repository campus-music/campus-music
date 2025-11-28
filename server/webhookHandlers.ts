import { stripe, getStripeWebhookSecret } from './stripeClient';
import { db } from './db';
import { supports, artistWallets } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import Stripe from 'stripe';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    const webhookSecret = getStripeWebhookSecret();
    
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    await WebhookHandlers.handleEvent(event);
  }

  private static async handleEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await WebhookHandlers.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        break;
    }
  }

  private static async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    try {
      const metadata = session.metadata || {};
      
      if (metadata.type !== 'artist_tip') {
        console.log('Checkout session is not an artist tip, skipping');
        return;
      }

      const { artistId, supporterId, message } = metadata;
      const amountTotal = session.amount_total;
      const stripeSessionId = session.id;

      if (!artistId || !supporterId || !amountTotal || !stripeSessionId) {
        console.error('Missing required metadata for artist tip:', metadata);
        return;
      }

      console.log(`Processing tip: ${supporterId} -> ${artistId} for ${amountTotal} cents (${stripeSessionId})`);

      await db.transaction(async (tx) => {
        const existing = await tx
          .select({ id: supports.id })
          .from(supports)
          .where(eq(supports.transactionId, stripeSessionId))
          .limit(1);

        if (existing.length > 0) {
          console.log('Support already recorded for session:', stripeSessionId);
          return;
        }

        const [support] = await tx
          .insert(supports)
          .values({
            supporterId,
            artistId,
            amount: amountTotal,
            paymentMethod: 'stripe',
            message: message || null,
            status: 'completed',
            transactionId: stripeSessionId,
          })
          .returning();

        await tx.execute(sql`
          INSERT INTO artist_wallets (id, artist_id, total_received, balance, created_at)
          VALUES (gen_random_uuid(), ${artistId}, ${amountTotal}, ${amountTotal}, NOW())
          ON CONFLICT (artist_id) DO UPDATE SET
            total_received = artist_wallets.total_received + ${amountTotal},
            balance = artist_wallets.balance + ${amountTotal}
        `);

        console.log('Support recorded:', support.id, 'Wallet updated for artist:', artistId);
      });
    } catch (error: any) {
      if (error.code === '23505' && error.constraint === 'supports_transaction_id_unique') {
        console.log('Duplicate transaction prevented by database constraint');
        return;
      }
      console.error('Error processing checkout completed:', error);
      throw error;
    }
  }
}
