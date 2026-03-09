import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TherapistsService {
  constructor(private prisma: PrismaService) {}

  async create(practiceId: string, name: string) {
    return this.prisma.therapist.create({
      data: { name, practiceId },
    });
  }

  async findAll(practiceId: string) {
    return this.prisma.therapist.findMany({
      where: { practiceId },
      include: {
        availability: {
          where: {
            datum: { gte: new Date() },
          },
          orderBy: { datum: 'asc' },
        },
      },
    });
  }

  async delete(id: string, practiceId: string) {
    const therapist = await this.prisma.therapist.findUnique({
      where: { id },
      select: { id: true, practiceId: true },
    });

    if (!therapist) {
      throw new NotFoundException('Therapeut nicht gefunden');
    }

    if (therapist.practiceId !== practiceId) {
      throw new ForbiddenException('Zugriff auf fremden Therapeuten nicht erlaubt');
    }

    return this.prisma.therapist.delete({ where: { id } });
  }
}
