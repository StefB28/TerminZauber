import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WaitlistService } from '../waitlist/waitlist.service';

@Injectable()
export class AvailabilityService {
  constructor(
    private prisma: PrismaService,
    private waitlistService: WaitlistService,
  ) {}

  async create(
    data: {
    therapistId: string;
    datum: string;
    startzeit: string;
    endzeit: string;
    status: string;
    },
    practiceId: string,
  ) {
    const therapist = await this.prisma.therapist.findUnique({
      where: { id: data.therapistId },
      select: { id: true, practiceId: true },
    });

    if (!therapist) {
      throw new NotFoundException('Therapeut nicht gefunden');
    }

    if (therapist.practiceId !== practiceId) {
      throw new ForbiddenException('Zugriff auf fremden Therapeuten nicht erlaubt');
    }

    const created = await this.prisma.availability.create({
      data: {
        therapistId: data.therapistId,
        datum: new Date(data.datum),
        startzeit: new Date(`1970-01-01T${data.startzeit}`),
        endzeit: new Date(`1970-01-01T${data.endzeit}`),
        status: data.status as any,
      },
    });

    if (['FREI', 'KURZFRISTIG_FREI'].includes(data.status)) {
      const practice = await this.prisma.practice.findUnique({
        where: { id: practiceId },
        select: { id: true, name: true },
      });

      if (practice) {
        // Fire-and-forget: don't block slot creation if email fails
        this.waitlistService.notifyPracticeWaitlist({
          practiceId: practice.id,
          practiceName: practice.name,
          slotDate: created.datum.toISOString().split('T')[0],
          slotTime: created.startzeit.toISOString().substring(11, 16),
        }).catch(err => console.error('[AvailabilityService] Waitlist notification failed:', err.message));
      }
    }

    return created;
  }

  async findByTherapist(therapistId: string, fromDate?: string) {
    return this.prisma.availability.findMany({
      where: {
        therapistId,
        ...(fromDate && {
          datum: { gte: new Date(fromDate) },
        }),
      },
      orderBy: { datum: 'asc' },
    });
  }

  async update(id: string, status: string, practiceId: string) {
    const slot = await this.prisma.availability.findUnique({
      where: { id },
      select: {
        id: true,
        therapist: {
          select: { practiceId: true },
        },
      },
    });

    if (!slot) {
      throw new NotFoundException('Verfügbarkeit nicht gefunden');
    }

    if (slot.therapist.practiceId !== practiceId) {
      throw new ForbiddenException('Zugriff auf fremde Verfügbarkeit nicht erlaubt');
    }

    const updated = await this.prisma.availability.update({
      where: { id },
      data: { status: status as any },
    });

    if (['FREI', 'KURZFRISTIG_FREI'].includes(status)) {
      const practice = await this.prisma.practice.findUnique({
        where: { id: practiceId },
        select: { id: true, name: true },
      });

      if (practice) {
        await this.waitlistService.notifyPracticeWaitlist({
          practiceId: practice.id,
          practiceName: practice.name,
          slotDate: updated.datum.toISOString().split('T')[0],
          slotTime: updated.startzeit.toISOString().substring(11, 16),
        });
      }
    }

    return updated;
  }

  async delete(id: string, practiceId: string) {
    const slot = await this.prisma.availability.findUnique({
      where: { id },
      select: {
        id: true,
        therapist: {
          select: { practiceId: true },
        },
      },
    });

    if (!slot) {
      throw new NotFoundException('Verfügbarkeit nicht gefunden');
    }

    if (slot.therapist.practiceId !== practiceId) {
      throw new ForbiddenException('Zugriff auf fremde Verfügbarkeit nicht erlaubt');
    }

    return this.prisma.availability.delete({ where: { id } });
  }
}
