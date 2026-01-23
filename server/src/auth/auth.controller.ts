
import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login-or-register')
  @ApiOperation({ summary: 'Login or Register automatically' })
  async loginOrRegister(@Body() loginDto: LoginDto) {
    return this.authService.loginOrRegister(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'User register' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    // req.user only contains basic info from JWT payload
    // We should fetch full user info from DB
    const user = await this.authService.getUserProfile(req.user.sub);
    return user;
  }
}
