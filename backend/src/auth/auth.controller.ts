import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Neuen Benutzer registrieren' })
  @ApiResponse({ status: 201, description: 'Benutzer erfolgreich registriert' })
  @ApiResponse({ status: 409, description: 'E-Mail bereits registriert' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Benutzer anmelden' })
  @ApiResponse({ status: 200, description: 'Erfolgreich angemeldet' })
  @ApiResponse({ status: 401, description: 'Ungültige Anmeldedaten' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
