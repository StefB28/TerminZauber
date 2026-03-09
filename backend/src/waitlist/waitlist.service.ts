import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async join(params: {
    patientId: string;
    patientEmail: string;
    practiceId: string;
    plz: string;
    radius: number;
    wunschdatum?: string;
  }) {
    const practice = await this.prisma.practice.findUnique({
      where: { id: params.practiceId },
      select: { id: true, name: true, aboStatus: true },
    });

    if (!practice) {
      throw new NotFoundException('Praxis nicht gefunden');
    }

    if (practice.aboStatus !== 'ACTIVE') {
      throw new BadRequestException('Diese Praxis ist aktuell nicht aktiv');
    }

    const existing = await this.prisma.waitingList.findFirst({
      where: {
        practiceId: params.practiceId,
        patientId: params.patientId,
        isActive: true,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.waitingList.create({
      data: {
        patientId: params.patientId,
        patientEmail: params.patientEmail,
        practiceId: params.practiceId,
        plz: params.plz,
        radius: params.radius,
        wunschdatum: params.wunschdatum ? new Date(params.wunschdatum) : new Date(),
        notified: false,
        isActive: true,
      },
    });
  }

  async myEntries(patientId: string) {
    return this.prisma.waitingList.findMany({
      where: { patientId, isActive: true },
      include: {
        practice: {
          select: {
            id: true,
            name: true,
            stadt: true,
            plz: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async leave(entryId: string, patientId: string) {
    const entry = await this.prisma.waitingList.findUnique({
      where: { id: entryId },
      select: { id: true, patientId: true },
    });

    if (!entry || entry.patientId !== patientId) {
      throw new NotFoundException('Wartelisten-Eintrag nicht gefunden');
    }

    return this.prisma.waitingList.update({
      where: { id: entryId },
      data: { isActive: false },
    });
  }

  async notifyPracticeWaitlist(params: {
    practiceId: string;
    practiceName: string;
    slotDate: string;
    slotTime: string;
  }) {
    const entries = await this.prisma.waitingList.findMany({
      where: {
        practiceId: params.practiceId,
        isActive: true,
        notified: false,
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    if (entries.length === 0) {
      return { notified: 0 };
    }

    for (const entry of entries) {
      try {
        await this.mailService.sendWaitlistNotification({
          to: entry.patientEmail,
          practiceName: params.practiceName,
          practiceId: params.practiceId,
          slotDate: params.slotDate,
          slotTime: params.slotTime,
        });

        await this.prisma.waitingList.update({
          where: { id: entry.id },
          data: {
            notified: true,
            notifiedAt: new Date(),
            isActive: false,
          },
        });
      } catch (error: any) {
        // Keep entry active when email delivery fails so it can be retried later.
        this.logger.error(
          `Waitlist notification failed for entry=${entry.id} to=${entry.patientEmail}: ${error?.message || error}`,
        );
      }
    }

    return { notified: entries.length };
  }
}
