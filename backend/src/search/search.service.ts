import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchAvailableSlots(query: {
    plz?: string;
    ort?: string;
    date?: string;
    radius?: number;
    treatments?: string[];
    includeWithoutSlots?: boolean;
  }) {
    const {
      plz,
      ort,
      date,
      radius = 2,
      treatments = [],
      includeWithoutSlots = false,
    } = query;

    const normalizedPlz = (plz || '').trim();
    const normalizedOrt = (ort || '').trim();

    let locationFilter: any = {};

    if (normalizedPlz) {
      // Heuristic PLZ radius buckets when geocoordinates are not available.
      if (radius <= 2) {
        locationFilter = { plz: { equals: normalizedPlz } };
      } else if (radius <= 10) {
        locationFilter = { plz: { startsWith: normalizedPlz.slice(0, 4) } };
      } else if (radius <= 30) {
        locationFilter = { plz: { startsWith: normalizedPlz.slice(0, 3) } };
      } else {
        locationFilter = { plz: { startsWith: normalizedPlz.slice(0, 2) } };
      }
    } else if (normalizedOrt) {
      // For city search: 2km defaults to exact city match; larger radius allows partial city matches.
      locationFilter =
        radius <= 2
          ? {
              stadt: {
                equals: normalizedOrt,
                mode: 'insensitive' as const,
              },
            }
          : {
              stadt: {
                contains: normalizedOrt,
                mode: 'insensitive' as const,
              },
            };
    }

    // Find practices in the area and with active subscriptions
    const practices = await this.prisma.practice.findMany({
      where: {
        ...locationFilter,
        aboStatus: 'ACTIVE',
        // Filter by specialties if provided
        ...(treatments.length > 0 && {
          specialties: {
            some: {
              treatmentId: {
                in: treatments,
              },
            },
          },
        }),
      },
      include: {
        therapists: {
          include: {
            specialties: {
              include: {
                treatment: true,
              },
            },
            availability: {
              where: {
                status: {
                  in: ['FREI', 'KURZFRISTIG_FREI'],
                },
                ...(date && {
                  datum: {
                    gte: new Date(date),
                    lte: new Date(new Date(date).getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days window
                  },
                }),
              },
              orderBy: {
                datum: 'asc',
              },
              take: 5,
            },
          },
        },
        ratings: {
          select: {
            rating: true,
          },
        },
      },
    });

    // Calculate average ratings and format results
    const results = practices
      .map((practice) => {
        const ratings = practice.ratings;
        const avgRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : null;

        // Group available slots
        const availableSlots = practice.therapists.flatMap((therapist) =>
          therapist.availability.map((slot) => ({
            datum: slot.datum.toISOString().split('T')[0],
            zeit: slot.startzeit.toString().substring(0, 5),
            therapistId: therapist.id,
            therapist: therapist.name,
            treatments: therapist.specialties
              .filter(
                (s) => !treatments.length || treatments.includes(s.treatmentId),
              )
              .map((s) => s.treatment.name),
          })),
        );

        const hasAvailableSlots = availableSlots.length > 0;

        return {
          id: practice.id,
          name: practice.name,
          adresse: practice.adresse,
          stadt: practice.stadt,
          plz: practice.plz,
          telefon: practice.telefon,
          mobile: practice.mobile,
          beschreibung: practice.beschreibung,
          rating: avgRating,
          reviewCount: ratings.length,
          hasAvailableSlots,
          availableSlots: availableSlots.slice(0, 10), // Return top 10 slots
        };
      })
      .filter((practice) => includeWithoutSlots || practice.hasAvailableSlots);

    return results;
  }

  async getNearestAvailableSlots(plz: string) {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Start from tomorrow

    return this.searchAvailableSlots({
      plz,
      date: today.toISOString().split('T')[0],
      radius: 30,
    });
  }
}
