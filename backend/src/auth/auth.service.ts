import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('E-Mail-Adresse bereits registriert');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const role = dto.role as UserRole || UserRole.PATIENT;

    if (!dto.telefon) {
      throw new BadRequestException('Telefonnummer ist erforderlich');
    }

    if (role === UserRole.ADMIN && (!dto.practiceName || !dto.adresse || !dto.plz || !dto.stadt)) {
      throw new BadRequestException('Bitte Praxisname und vollstaendige Adresse angeben');
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role,
        telefon: dto.telefon,
        plz: dto.plz,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        telefon: true,
        plz: true,
        createdAt: true,
      },
    });

    // If ADMIN and practice details provided, create practice
    if (role === UserRole.ADMIN && dto.practiceName && dto.adresse && dto.plz && dto.stadt) {
      const practice = await this.prisma.practice.create({
        data: {
          name: dto.practiceName,
          adresse: dto.adresse,
          plz: dto.plz,
          stadt: dto.stadt,
          telefon: dto.telefon,
          email: dto.email,
          aboTyp: 'BASIS',
          aboStatus: 'ACTIVE',
        },
      });

      await this.prisma.user.update({
        where: { id: user.id },
        data: { practiceId: practice.id },
      });
    }

    // Generate JWT token
    const token = await this.signToken(user.id, user.email, user.role);

    return {
      user,
      access_token: token,
    };
  }

  async login(dto: LoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        practice: {
          select: {
            id: true,
            name: true,
            aboTyp: true,
            aboStatus: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Ungültige Anmeldedaten');
    }

    // Verify password
    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Ungültige Anmeldedaten');
    }

    // Generate JWT token
    const token = await this.signToken(user.id, user.email, user.role);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      access_token: token,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        practiceId: true,
        telefon: true,
        plz: true,
      },
    });

    return user;
  }

  private async signToken(userId: string, email: string, role: string): Promise<string> {
    const payload = {
      sub: userId,
      email,
      role,
    };

    return this.jwt.signAsync(payload);
  }
}
