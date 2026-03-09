import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY ist nicht konfiguriert');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Erstellt eine Stripe Checkout Session für ein Praxis-Abonnement
   * Preise: BASIS = 5€/Monat, PRO = 15€/Monat
   */
  async createCheckoutSession(data: {
    practiceId: string;
    aboTyp: 'BASIS' | 'PRO';
    userId: string;
  }) {
    const practice = await this.prisma.practice.findUnique({
      where: { id: data.practiceId },
    });

    if (!practice) {
      throw new BadRequestException('Praxis nicht gefunden');
    }

    // Stripe Customer erstellen oder abrufen
    let customerId = practice.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: practice.email,
        name: practice.name,
        metadata: {
          practiceId: practice.id,
        },
      });
      customerId = customer.id;

      // Customer ID in Datenbank speichern
      await this.prisma.practice.update({
        where: { id: practice.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Preis basierend auf aboTyp
    const priceData = {
      BASIS: {
        unit_amount: 500, // 5€ in Cent
        product_data: {
          name: 'PhysioMatch BASIS Abonnement',
          description: 'Monatliches Basis-Abonnement für Ihre Praxis',
        },
      },
      PRO: {
        unit_amount: 1500, // 15€ in Cent
        product_data: {
          name: 'PhysioMatch PRO Abonnement',
          description: 'Monatliches Pro-Abonnement mit erweiterten Funktionen',
        },
      },
    };

    const selectedPrice = priceData[data.aboTyp];

    // Checkout Session erstellen
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card', 'sepa_debit'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            recurring: { interval: 'month' },
            unit_amount: selectedPrice.unit_amount,
            product_data: selectedPrice.product_data,
          },
          quantity: 1,
        },
      ],
      success_url: `${this.configService.get('FRONTEND_URL')}/practice/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/practice/subscription/cancel`,
      metadata: {
        practiceId: practice.id,
        aboTyp: data.aboTyp,
        userId: data.userId,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Verarbeitet Stripe Webhooks (z.B. checkout.session.completed, invoice.paid)
   */
  async handleWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET ist nicht konfiguriert');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook-Signatur ungültig: ${err.message}`);
    }

    // Event-Typ verarbeiten
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unbehandelter Event-Typ: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Checkout abgeschlossen - Subscription aktivieren
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const { practiceId, aboTyp } = session.metadata;

    // Stripe Subscription abrufen
    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    // Subscription in Datenbank anlegen
    await this.prisma.subscription.upsert({
      where: { practiceId },
      create: {
        practiceId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: stripeSubscription.id,
        aboTyp: aboTyp as 'BASIS' | 'PRO',
        laufzeit: 'monthly',
        status: 'ACTIVE',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
      update: {
        stripeSubscriptionId: stripeSubscription.id,
        aboTyp: aboTyp as 'BASIS' | 'PRO',
        status: 'ACTIVE',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    // Practice aboStatus auf ACTIVE setzen
    await this.prisma.practice.update({
      where: { id: practiceId },
      data: {
        aboStatus: 'ACTIVE',
        aboTyp: aboTyp as 'BASIS' | 'PRO',
      },
    });

    console.log(`✅ Subscription aktiviert für Praxis ${practiceId}`);
  }

  /**
   * Rechnung bezahlt - Payment-Datensatz erstellen
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
    });

    if (!subscription) return;

    // Payment in Datenbank speichern
    await this.prisma.payment.upsert({
      where: { stripePaymentId: invoice.payment_intent as string },
      create: {
        practiceId: subscription.practiceId,
        stripePaymentId: invoice.payment_intent as string,
        betrag: invoice.amount_paid / 100, // von Cent zu Euro
        zahlungsdatum: new Date(invoice.created * 1000),
        status: 'COMPLETED',
        aboTyp: subscription.aboTyp,
        invoice_url: invoice.hosted_invoice_url,
      },
      update: {
        status: 'COMPLETED',
        invoice_url: invoice.hosted_invoice_url,
      },
    });

    console.log(`✅ Zahlung erfasst für Praxis ${subscription.practiceId}`);
  }

  /**
   * Zahlung fehlgeschlagen
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
    });

    if (!subscription) return;

    // Practice Status auf SUSPENDED setzen
    await this.prisma.practice.update({
      where: { id: subscription.practiceId },
      data: { aboStatus: 'SUSPENDED' },
    });

    console.log(`⚠️ Zahlung fehlgeschlagen für Praxis ${subscription.practiceId}`);
  }

  /**
   * Subscription gekündigt
   */
  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) return;

    // Subscription in Datenbank auf CANCELLED setzen
    await this.prisma.subscription.update({
      where: { stripeSubscriptionId: stripeSubscription.id },
      data: { status: 'CANCELLED' },
    });

    // Practice Status auf CANCELLED setzen
    await this.prisma.practice.update({
      where: { id: subscription.practiceId },
      data: { aboStatus: 'CANCELLED' },
    });

    console.log(`❌ Subscription gekündigt für Praxis ${subscription.practiceId}`);
  }

  /**
   * Subscription aktualisiert (z.B. Upgrade von BASIS zu PRO)
   */
  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) return;

    // Neue Periode und Status aktualisieren
    await this.prisma.subscription.update({
      where: { stripeSubscriptionId: stripeSubscription.id },
      data: {
        status: stripeSubscription.status === 'active' ? 'ACTIVE' : 'INACTIVE',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    console.log(`🔄 Subscription aktualisiert für Praxis ${subscription.practiceId}`);
  }

  /**
   * Subscription kündigen
   */
  async cancelSubscription(practiceId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { practiceId },
    });

    if (!subscription) {
      throw new BadRequestException('Keine aktive Subscription gefunden');
    }

    // Bei Stripe kündigen
    await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

    // In Datenbank aktualisieren
    await this.prisma.subscription.update({
      where: { practiceId },
      data: { status: 'CANCELLED' },
    });

    await this.prisma.practice.update({
      where: { id: practiceId },
      data: { aboStatus: 'CANCELLED' },
    });

    return { message: 'Subscription erfolgreich gekündigt' };
  }

  /**
   * Subscription-Details abrufen
   */
  async getSubscriptionDetails(practiceId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { practiceId },
      include: {
        practice: {
          select: {
            name: true,
            aboStatus: true,
            aboTyp: true,
          },
        },
      },
    });

    if (!subscription) {
      return null;
    }

    // Aktuelle Stripe Subscription abrufen für Live-Daten
    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId,
    );

    return {
      ...subscription,
      stripeStatus: stripeSubscription.status,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    };
  }
}
