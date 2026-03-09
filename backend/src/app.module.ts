import { Module, Controller, Get } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Controller()
class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PracticesModule } from './practices/practices.module';
import { TherapistsModule } from './therapists/therapists.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AvailabilityModule } from './availability/availability.module';
import { PaymentsModule } from './payments/payments.module';
import { SearchModule } from './search/search.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { HealthModule } from './health/health.module';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PracticesModule,
    TherapistsModule,
    AppointmentsModule,
    AvailabilityModule,
    PaymentsModule,
    SearchModule,
    WaitlistModule,
    HealthModule,
  ],
})
export class AppModule {}
