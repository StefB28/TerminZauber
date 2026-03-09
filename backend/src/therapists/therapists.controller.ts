import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TherapistsService } from './therapists.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('therapists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('therapists')
export class TherapistsController {
  constructor(private therapistsService: TherapistsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Therapeut erstellen' })
  async create(
    @Body() data: { practiceId?: string; name: string },
    @GetUser('practiceId') practiceId: string,
  ) {
    if (!practiceId) {
      throw new ForbiddenException('Benutzer ist keiner Praxis zugeordnet');
    }

    return this.therapistsService.create(practiceId, data.name);
  }

  @Get('practice/:practiceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Alle Therapeuten einer Praxis' })
  async findAll(
    @Param('practiceId') practiceId: string,
    @GetUser('practiceId') userPracticeId: string,
  ) {
    if (!userPracticeId || userPracticeId !== practiceId) {
      throw new ForbiddenException('Zugriff auf fremde Praxis nicht erlaubt');
    }

    return this.therapistsService.findAll(practiceId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Therapeut löschen' })
  async delete(@Param('id') id: string, @GetUser('practiceId') practiceId: string) {
    if (!practiceId) {
      throw new ForbiddenException('Benutzer ist keiner Praxis zugeordnet');
    }

    return this.therapistsService.delete(id, practiceId);
  }
}
