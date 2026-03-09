import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async createAppointment(data: {
    practiceId: string;
    therapistId: string;
    patientId: string;
    datum: string;
    uhrzeit: string;
    dauer: number;
  }) {
    return this.prisma.appointment.create({
      data: {
        practiceId: data.practiceId,
        therapistId: data.therapistId,
        patientId: data.patientId,
        datum: new Date(data.datum),
        uhrzeit: new Date(`1970-01-01T${data.uhrzeit}`),
        dauer: data.dauer,
        status: 'GEBUCHT',
      },
      include: {
        practice: true,
        therapist: true,
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            telefon: true,
          },
        },
      },
    });
  }

  async getAppointments(userId: string, role: string) {
    if (role === 'PATIENT') {
      return this.prisma.appointment.findMany({
        where: { patientId: userId },
        include: {
          practice: true,
          therapist: true,
        },
        orderBy: { datum: 'desc' },
      });
    } else {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      return this.prisma.appointment.findMany({
        where: { practiceId: user.practiceId },
        include: {
          patient: {
            select: {
              name: true,
              email: true,
              telefon: true,
            },
          },
          therapist: true,
        },
        orderBy: { datum: 'desc' },
      });
    }
  }

  async cancelAppointment(id: string, userId: string, role: string, practiceId?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        patientId: true,
        practiceId: true,
        status: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Termin nicht gefunden');
    }

    const isPatientOwner = role === 'PATIENT' && appointment.patientId === userId;
    const isPracticeOwner = (role === 'ADMIN' || role === 'THERAPIST') && !!practiceId && appointment.practiceId === practiceId;

    if (!isPatientOwner && !isPracticeOwner) {
      throw new ForbiddenException('Sie dürfen diesen Termin nicht absagen');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status: 'ABGESAGT' },
    });
  }

  async rescheduleAppointment(
    id: string,
    userId: string,
    role: string,
    practiceId: string | undefined,
    data: { datum: string; uhrzeit: string; dauer?: number },
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        patientId: true,
        practiceId: true,
        status: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Termin nicht gefunden');
    }

    if (appointment.status === 'ABGESAGT') {
      throw new ForbiddenException('Ein abgesagter Termin kann nicht verschoben werden');
    }

    const isPatientOwner = role === 'PATIENT' && appointment.patientId === userId;
    const isPracticeOwner =
      (role === 'ADMIN' || role === 'THERAPIST') && !!practiceId && appointment.practiceId === practiceId;

    if (!isPatientOwner && !isPracticeOwner) {
      throw new ForbiddenException('Sie dürfen diesen Termin nicht verschieben');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        datum: new Date(data.datum),
        uhrzeit: new Date(`1970-01-01T${data.uhrzeit}`),
        ...(typeof data.dauer === 'number' ? { dauer: data.dauer } : {}),
      },
      include: {
        practice: true,
        therapist: true,
      },
    });
  }
}
