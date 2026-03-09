import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'max@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Max Mustermann' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'securePassword123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Passwort muss mindestens 8 Zeichen lang sein' })
  password: string;

  @ApiProperty({ example: 'PATIENT', enum: ['PATIENT', 'THERAPIST', 'ADMIN'], required: false })
  @IsOptional()
  @IsEnum(['PATIENT', 'THERAPIST', 'ADMIN'])
  role?: string;

  @ApiProperty({ example: '030123456' })
  @IsString()
  telefon: string;

  @ApiProperty({ example: '10115', required: false })
  @IsOptional()
  @IsString()
  plz?: string;

  @ApiProperty({ example: 'Physiotherapie Mustermann', required: false })
  @IsOptional()
  @IsString()
  practiceName?: string;

  @ApiProperty({ example: 'Musterstraße 123', required: false })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiProperty({ example: 'Berlin', required: false })
  @IsOptional()
  @IsString()
  stadt?: string;
}
