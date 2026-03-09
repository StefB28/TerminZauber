import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PracticesService } from './practices.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('practices')
@Controller('practices')
export class PracticesController {
  constructor(private practicesService: PracticesService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Praxis erstellen' })
  async create(@GetUser('id') userId: string, @Body() data: any) {
    return this.practicesService.createPractice(userId, data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Praxis abrufen' })
  async getPractice(@Param('id') id: string) {
    return this.practicesService.getPractice(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Praxis aktualisieren' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.practicesService.updatePractice(id, data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/statistics')
  @ApiOperation({ summary: 'Praxis-Statistiken abrufen' })
  async getStatistics(@Param('id') id: string) {
    return this.practicesService.getStatistics(id);
  }
}
