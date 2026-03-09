import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { WaitlistService } from './waitlist.service';

@ApiTags('waitlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PATIENT')
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post('join')
  @ApiOperation({ summary: 'Patient zur Warteliste einer Praxis hinzufügen' })
  async join(
    @Body() body: { practiceId: string; plz: string; radius: number; wunschdatum?: string },
    @GetUser('id') patientId: string,
    @GetUser('email') patientEmail: string,
  ) {
    return this.waitlistService.join({
      patientId,
      patientEmail,
      practiceId: body.practiceId,
      plz: body.plz,
      radius: body.radius,
      wunschdatum: body.wunschdatum,
    });
  }

  @Get('my')
  @ApiOperation({ summary: 'Eigene aktive Wartelisten-Einträge abrufen' })
  async my(@GetUser('id') patientId: string) {
    return this.waitlistService.myEntries(patientId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Wartelisten-Eintrag entfernen' })
  async leave(@Param('id') id: string, @GetUser('id') patientId: string) {
    return this.waitlistService.leave(id, patientId);
  }
}
