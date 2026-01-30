
import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto, UserProfileDto } from './dto/auth-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login-or-register')
  @ApiOperation({ summary: 'Login or Register automatically' })
  @ApiResponse({ status: 201, description: 'User successfully logged in or registered.', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async loginOrRegister(@Body() loginDto: LoginDto) {
    return this.authService.loginOrRegister(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'User register' })
  @ApiResponse({ status: 201, description: 'User successfully registered.', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Return current user profile.', type: UserProfileDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getProfile(@Request() req: any) {
    // req.user only contains basic info from JWT payload
    // We should fetch full user info from DB
    const user = await this.authService.getUserProfile(req.user.sub);
    return user;
  }
}
