import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(
    private searchService: SearchService,
    private prisma: PrismaService,
  ) {}

  @Get('available-slots')
  @ApiOperation({ summary: 'Suche verfügbare Termine nach PLZ oder Ort und Datum' })
  @ApiQuery({ name: 'plz', required: false, example: '10115' })
  @ApiQuery({ name: 'ort', required: false, example: 'Berlin' })
  @ApiQuery({ name: 'date', required: false, example: '2026-03-15' })
  @ApiQuery({ name: 'radius', required: false, example: 2 })
  @ApiQuery({ name: 'treatments', required: false, example: 'id1,id2' })
  @ApiQuery({ name: 'includeWithoutSlots', required: false, example: false })
  async searchSlots(
    @Query('plz') plz?: string,
    @Query('ort') ort?: string,
    @Query('date') date?: string,
    @Query('radius') radius?: string,
    @Query('treatments') treatments?: string,
    @Query('includeWithoutSlots') includeWithoutSlots?: string,
  ) {
    if (!plz && !ort) {
      throw new BadRequestException('Bitte PLZ oder Ort angeben');
    }

    const parsedRadius = radius ? parseInt(radius, 10) : 2;
    const safeRadius = Number.isFinite(parsedRadius) && parsedRadius > 0 ? parsedRadius : 2;
    const includeNoSlots = includeWithoutSlots === 'true';

    return this.searchService.searchAvailableSlots({
      plz,
      ort,
      date,
      radius: safeRadius,
      treatments: treatments ? treatments.split(',') : [],
      includeWithoutSlots: includeNoSlots,
    });
  }

  @Get('nearest')
  @ApiOperation({ summary: 'Finde nächstmögliche freie Termine' })
  @ApiQuery({ name: 'plz', required: true, example: '10115' })
  async getNearestSlots(@Query('plz') plz: string) {
    return this.searchService.getNearestAvailableSlots(plz);
  }

  @Get('treatment-types')
  @ApiOperation({ summary: 'Alle verfügbaren Behandlungsarten abrufen' })
  async getAllTreatments() {
    return this.prisma.treatmentType.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
