import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('availability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Verfügbarkeit erstellen' })
  async create(@Body() data: any, @GetUser('practiceId') practiceId: string) {
    if (!practiceId) {
      throw new ForbiddenException('Benutzer ist keiner Praxis zugeordnet');
    }

    return this.availabilityService.create(data, practiceId);
  }

  @Get('therapist/:therapistId')
  @ApiOperation({ summary: 'Verfügbarkeit eines Therapeuten abrufen' })
  async findByTherapist(
    @Param('therapistId') therapistId: string,
    @Query('fromDate') fromDate?: string,
  ) {
    return this.availabilityService.findByTherapist(therapistId, fromDate);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Verfügbarkeit aktualisieren' })
  async update(
    @Param('id') id: string,
    @Body() data: { status: string },
    @GetUser('practiceId') practiceId: string,
  ) {
    if (!practiceId) {
      throw new ForbiddenException('Benutzer ist keiner Praxis zugeordnet');
    }

    return this.availabilityService.update(id, data.status, practiceId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Verfügbarkeit löschen' })
  async delete(@Param('id') id: string, @GetUser('practiceId') practiceId: string) {
    if (!practiceId) {
      throw new ForbiddenException('Benutzer ist keiner Praxis zugeordnet');
    }

    return this.availabilityService.delete(id, practiceId);
  }
}
