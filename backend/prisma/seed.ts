import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with treatment types...');

  const treatments = [
    {
      name: 'Physiotherapie',
      beschreibung: 'Klassische Physiotherapie und Bewegungstherapie',
      dauer: 30,
    },
    {
      name: 'Sportphysiotherapie',
      beschreibung: 'Spezialisierte Therapie für Sportler und sportliche Aktivitäten',
      dauer: 45,
    },
    {
      name: 'Massage',
      beschreibung: 'Therapeutische Massage für Muskelentspannung und Schmerzlinderung',
      dauer: 30,
    },
    {
      name: 'Krankengymnastik',
      beschreibung: 'Gezieltes Trainingsprogramm zur Rehabilitation',
      dauer: 30,
    },
    {
      name: 'Osteopathie',
      beschreibung: 'Ganzheitliche Behandlung des Bewegungsapparats',
      dauer: 45,
    },
    {
      name: 'Chiropraktik',
      beschreibung: 'Behandlung von Wirbelsäule und Gelenken',
      dauer: 30,
    },
    {
      name: 'Akupunktur',
      beschreibung: 'Traditionelle chinesische Schmerzbehandlung',
      dauer: 30,
    },
    {
      name: 'Ergotherapie',
      beschreibung: 'Behandlung zur Verbesserung der Alltags- und Arbeitsfähigkeit',
      dauer: 45,
    },
    {
      name: 'Lymphdrainage',
      beschreibung: 'Spezielle Drainage zur Ödem- und Lymphbehandlung',
      dauer: 30,
    },
    {
      name: 'Wärmebehandlung',
      beschreibung: 'Thermische Therapie mit Wärmeanwendungen',
      dauer: 20,
    },
    {
      name: 'Elektrotherapie',
      beschreibung: 'Therapie mit elektrischen Impulsen',
      dauer: 20,
    },
    {
      name: 'Ultraschalltherapie',
      beschreibung: 'Behandlung mit Ultraschallwellen',
      dauer: 20,
    },
  ];

  for (const treatment of treatments) {
    const existing = await prisma.treatmentType.findUnique({
      where: { name: treatment.name },
    });

    if (!existing) {
      await prisma.treatmentType.create({
        data: treatment,
      });
      console.log(`Created treatment type: ${treatment.name}`);
    } else {
      console.log(`Treatment type already exists: ${treatment.name}`);
    }
  }

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
