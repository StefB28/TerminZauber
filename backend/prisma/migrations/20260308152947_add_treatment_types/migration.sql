-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PATIENT', 'THERAPIST', 'ADMIN');

-- CreateEnum
CREATE TYPE "AboTyp" AS ENUM ('BASIS', 'PRO');

-- CreateEnum
CREATE TYPE "AboStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('FREI', 'GEBUCHT', 'KURZFRISTIG_FREI', 'ABGESAGT', 'ABGESCHLOSSEN');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PATIENT',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "practiceId" TEXT,
    "telefon" TEXT,
    "plz" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Practice" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "plz" TEXT NOT NULL,
    "stadt" TEXT NOT NULL,
    "telefon" TEXT NOT NULL,
    "mobile" TEXT,
    "email" TEXT NOT NULL,
    "beschreibung" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "aboTyp" "AboTyp" NOT NULL DEFAULT 'BASIS',
    "aboStatus" "AboStatus" NOT NULL DEFAULT 'INACTIVE',
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Practice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Therapist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Therapist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "datum" DATE NOT NULL,
    "startzeit" TIME NOT NULL,
    "endzeit" TIME NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'FREI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "datum" DATE NOT NULL,
    "uhrzeit" TIME NOT NULL,
    "dauer" INTEGER NOT NULL DEFAULT 30,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'GEBUCHT',
    "patientNotes" TEXT,
    "practiceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "aboTyp" "AboTyp" NOT NULL DEFAULT 'BASIS',
    "laufzeit" TEXT NOT NULL,
    "status" "AboStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "stripePaymentId" TEXT NOT NULL,
    "betrag" DOUBLE PRECISION NOT NULL,
    "zahlungsdatum" TIMESTAMP(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "aboTyp" "AboTyp" NOT NULL,
    "invoice_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "beschreibung" TEXT,
    "dauer" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreatmentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TherapistSpecialty" (
    "id" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TherapistSpecialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSpecialty" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeSpecialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitingList" (
    "id" TEXT NOT NULL,
    "patientEmail" TEXT NOT NULL,
    "plz" TEXT NOT NULL,
    "wunschdatum" DATE NOT NULL,
    "radius" INTEGER NOT NULL DEFAULT 30,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitingList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_practiceId_idx" ON "User"("practiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Practice_email_key" ON "Practice"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Practice_stripeCustomerId_key" ON "Practice"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Practice_plz_idx" ON "Practice"("plz");

-- CreateIndex
CREATE INDEX "Practice_stadt_idx" ON "Practice"("stadt");

-- CreateIndex
CREATE INDEX "Practice_latitude_longitude_idx" ON "Practice"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Therapist_practiceId_idx" ON "Therapist"("practiceId");

-- CreateIndex
CREATE INDEX "Availability_therapistId_idx" ON "Availability"("therapistId");

-- CreateIndex
CREATE INDEX "Availability_datum_idx" ON "Availability"("datum");

-- CreateIndex
CREATE INDEX "Availability_status_idx" ON "Availability"("status");

-- CreateIndex
CREATE INDEX "Appointment_practiceId_idx" ON "Appointment"("practiceId");

-- CreateIndex
CREATE INDEX "Appointment_therapistId_idx" ON "Appointment"("therapistId");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_datum_idx" ON "Appointment"("datum");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_practiceId_key" ON "Subscription"("practiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_practiceId_idx" ON "Subscription"("practiceId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentId_key" ON "Payment"("stripePaymentId");

-- CreateIndex
CREATE INDEX "Payment_practiceId_idx" ON "Payment"("practiceId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Rating_practiceId_idx" ON "Rating"("practiceId");

-- CreateIndex
CREATE INDEX "Rating_patientId_idx" ON "Rating"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "TreatmentType_name_key" ON "TreatmentType"("name");

-- CreateIndex
CREATE INDEX "TherapistSpecialty_therapistId_idx" ON "TherapistSpecialty"("therapistId");

-- CreateIndex
CREATE INDEX "TherapistSpecialty_treatmentId_idx" ON "TherapistSpecialty"("treatmentId");

-- CreateIndex
CREATE UNIQUE INDEX "TherapistSpecialty_therapistId_treatmentId_key" ON "TherapistSpecialty"("therapistId", "treatmentId");

-- CreateIndex
CREATE INDEX "PracticeSpecialty_practiceId_idx" ON "PracticeSpecialty"("practiceId");

-- CreateIndex
CREATE INDEX "PracticeSpecialty_treatmentId_idx" ON "PracticeSpecialty"("treatmentId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeSpecialty_practiceId_treatmentId_key" ON "PracticeSpecialty"("practiceId", "treatmentId");

-- CreateIndex
CREATE INDEX "WaitingList_plz_idx" ON "WaitingList"("plz");

-- CreateIndex
CREATE INDEX "WaitingList_wunschdatum_idx" ON "WaitingList"("wunschdatum");

-- CreateIndex
CREATE INDEX "WaitingList_notified_idx" ON "WaitingList"("notified");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Therapist" ADD CONSTRAINT "Therapist_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "Therapist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "Therapist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapistSpecialty" ADD CONSTRAINT "TherapistSpecialty_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "Therapist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapistSpecialty" ADD CONSTRAINT "TherapistSpecialty_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "TreatmentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSpecialty" ADD CONSTRAINT "PracticeSpecialty_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSpecialty" ADD CONSTRAINT "PracticeSpecialty_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "TreatmentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
