import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  UseGuards,
  Req,
  Headers,
  RawBodyRequest,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private prisma: PrismaService,
  ) {}

  /**
   * POST /api/payments/create-checkout-session
   * Erstellt Stripe Checkout Session für Praxis-Abonnement
   * ⚠️ NUR FÜR PRAXIS-ADMINS (nicht für Patienten!)
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Stripe Checkout Session erstellen (nur Praxis-Admins: 5€ BASIS, 15€ PRO)' })
  @Post('create-checkout-session')
  async createCheckoutSession(
    @Body() body: { aboTyp: 'BASIS' | 'PRO' },
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
  ) {
    // Doppelprüfung: Nur ADMIN-Benutzer dürfen bezahlen
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Nur Praxis-Admins können Abonnements abschließen');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { practice: { select: { id: true, aboStatus: true } } },
    });

    if (!user.practiceId) {
      throw new BadRequestException('Benutzer ist keiner Praxis zugeordnet');
    }

    return this.paymentsService.createCheckoutSession({
      practiceId: user.practiceId,
      aboTyp: body.aboTyp,
      userId,
    });
  }

  /**
   * DELETE /api/payments/subscription
   * Subscription kündigen (nur Praxis-Admins)
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Subscription kündigen (nur Praxis-Admins)' })
  @Delete('subscription')
  async cancelSubscription(
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
  ) {
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Nur Praxis-Admins können Abonnements kündigen');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user.practiceId) {
      throw new BadRequestException('Benutzer ist keiner Praxis zugeordnet');
    }

    return this.paymentsService.cancelSubscription(user.practiceId);
  }

  /**
   * GET /api/payments/subscription
   * Subscription-Details abrufen (nur Praxis-Admins)
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Subscription-Details abrufen (nur Praxis-Admins)' })
  @Get('subscription')
  async getSubscription(
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
  ) {
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Nur Praxis-Admins können Abonnement-Details einsehen');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user.practiceId) {
      throw new BadRequestException('Benutzer ist keiner Praxis zugeordnet');
    }

    return this.paymentsService.getSubscriptionDetails(user.practiceId);
  }

  /**
   * POST /api/payments/webhook
   * Stripe Webhook Endpoint (ÖFFENTLICH - keine Auth erforderlich)
   * Verarbeitet: checkout.session.completed, invoice.paid, subscription.deleted
   */
  @Post('webhook')
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    // rawBody muss von NestJS bereitgestellt werden (siehe main.ts)
    const rawBody = req['rawBody'];
    
    if (!rawBody) {
      throw new BadRequestException('Raw body nicht verfügbar');
    }

    return this.paymentsService.handleWebhook(signature, rawBody);
  }
}
