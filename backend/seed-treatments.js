const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with treatment types...');

  const treatments = [
    {
      name: 'Atlastherapie',
      beschreibung: 'Spezialisierte Therapie zur Behandlung des Atlaswirbels und der oberen Halswirbelsäule',
      dauer: 30,
    },
    {
      name: 'Chiropraktik',
      beschreibung: 'Behandlung von Wirbelsäulen- und Gelenkproblemen',
      dauer: 30,
    },
    {
      name: 'Elektrotherapie',
      beschreibung: 'Behandlung mit elektrischen Impulsen zur Schmerzlinderung',
      dauer: 20,
    },
    {
      name: 'Fango und heiße Rolle',
      beschreibung: 'Thermotherapie mit Moorpackungen und heißen Rollen zur Schmerzlinderung',
      dauer: 25,
    },
    {
      name: 'Faszienbehandlung',
      beschreibung: 'Behandlung des Bindegewebes zur Verbesserung der Beweglichkeit und Schmerzlinderung',
      dauer: 30,
    },
    {
      name: 'Fußreflexzonenmassage',
      beschreibung: 'Reflexzonenmassage der Füße zur Beeinflussung innerer Organe und Körperfunktionen',
      dauer: 30,
    },
    {
      name: 'Kältetherapie',
      beschreibung: 'Kältebehandlung zur Reduktion von Schwellungen und Entzündungen',
      dauer: 15,
    },
    {
      name: 'Kiefergelenkstherapie',
      beschreibung: 'Behandlung von Kiefergelenksbeschwerden und craniomandibulären Dysfunktionen',
      dauer: 30,
    },
    {
      name: 'Kinesiotape',
      beschreibung: 'Anwendung von elastischen Tapes zur Unterstützung der Muskulatur und Gelenke',
      dauer: 20,
    },
    {
      name: 'Krankengymnastik',
      beschreibung: 'Gezieltes Trainingsprogramm zur Rehabilitation',
      dauer: 30,
    },
    {
      name: 'Krankengymnastik am Gerät',
      beschreibung: 'Gerätegestützte Physiotherapie zur gezielten Kräftigung und Mobilisierung',
      dauer: 30,
    },
    {
      name: 'Lymphdrainage',
      beschreibung: 'Spezielle Massage zur Förderung der Lymphzirkulation',
      dauer: 30,
    },
    {
      name: 'Manuelle Therapie',
      beschreibung: 'Spezielle manuelle Techniken zur Behandlung von Gelenk- und Wirbelsäulenproblemen',
      dauer: 30,
    },
    {
      name: 'Massage',
      beschreibung: 'Therapeutische Massage für Muskelentspannung und Schmerzlinderung',
      dauer: 30,
    },
    {
      name: 'Osteopathie',
      beschreibung: 'Manuelle Therapie basierend auf osteopathischen Prinzipien',
      dauer: 45,
    },
    {
      name: 'Physiotherapie',
      beschreibung: 'Klassische Physiotherapie und Bewegungstherapie',
      dauer: 30,
    },
    {
      name: 'Pilates',
      beschreibung: 'Ganzheitliches Training zur Verbesserung von Kraft und Flexibilität',
      dauer: 60,
    },
    {
      name: 'Rehasport',
      beschreibung: 'Medizinisch betreutes Training zur Verbesserung der körperlichen Leistungsfähigkeit',
      dauer: 45,
    },
    {
      name: 'Sportphysiotherapie',
      beschreibung: 'Spezialisierte Therapie für Sportler und sportliche Aktivitäten',
      dauer: 45,
    },
    {
      name: 'Triggerpunkttherapie',
      beschreibung: 'Lokale Behandlung von verspannten Muskelpunkten zur Schmerzlinderung',
      dauer: 30,
    },
    {
      name: 'Ultraschalltherapie',
      beschreibung: 'Tiefenwärmetherapie mit Ultraschallwellen',
      dauer: 15,
    },
    {
      name: 'Wärmetherapie',
      beschreibung: 'Wärmebehandlung zur Muskelentspannung und Schmerzlinderung',
      dauer: 20,
    },
  ];

  for (const treatment of treatments) {
    await prisma.treatmentType.upsert({
      where: { name: treatment.name },
      update: treatment,
      create: treatment,
    });
  }

  console.log(`Created/updated ${treatments.length} treatment types`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
