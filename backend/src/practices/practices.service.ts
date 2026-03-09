import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PracticesService {
  constructor(private prisma: PrismaService) {}

  async createPractice(userId: string, data: any) {
    const practice = await this.prisma.practice.create({
      data: {
        name: data.name,
        adresse: data.adresse,
        plz: data.plz,
        stadt: data.stadt,
        telefon: data.telefon,
        mobile: data.mobile,
        email: data.email,
        beschreibung: data.beschreibung,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });

    // Update user to link to practice
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        practiceId: practice.id,
        role: 'ADMIN',
      },
    });

    return practice;
  }

  async getPractice(practiceId: string) {
    return this.prisma.practice.findUnique({
      where: { id: practiceId },
      include: {
        therapists: true,
        subscription: true,
        ratings: {
          include: {
            patient: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async updatePractice(practiceId: string, data: any) {
    return this.prisma.practice.update({
      where: { id: practiceId },
      data,
    });
  }

  async getStatistics(practiceId: string) {
    const appointments = await this.prisma.appointment.count({
      where: { practiceId, status: 'GEBUCHT' },
    });

    const ratings = await this.prisma.rating.aggregate({
      where: { practiceId },
      _avg: { rating: true },
      _count: true,
    });

    return {
      totalAppointments: appointments,
      avgRating: ratings._avg.rating || 0,
      totalRatings: ratings._count,
    };
  }
}
