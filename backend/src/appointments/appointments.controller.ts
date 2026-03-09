import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Termin buchen' })
  async create(@GetUser('id') userId: string, @Body() data: any) {
    return this.appointmentsService.createAppointment({
      ...data,
      patientId: userId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Meine Termine abrufen' })
  async getAppointments(@GetUser('id') userId: string, @GetUser('role') role: string) {
    return this.appointmentsService.getAppointments(userId, role);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Termin absagen' })
  async cancel(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
    @GetUser('practiceId') practiceId?: string,
  ) {
    return this.appointmentsService.cancelAppointment(id, userId, role, practiceId);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Termin verschieben' })
  async reschedule(
    @Param('id') id: string,
    @Body() data: { datum: string; uhrzeit: string; dauer?: number },
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
    @GetUser('practiceId') practiceId?: string,
  ) {
    return this.appointmentsService.rescheduleAppointment(id, userId, role, practiceId, data);
  }
}
