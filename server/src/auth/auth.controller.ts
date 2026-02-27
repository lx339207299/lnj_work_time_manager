
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto, UserProfileDto } from './dto/auth-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
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

  @Post('check-status')
  @ApiOperation({ summary: 'Check user status by phone number' })
  async checkUserStatus(@Body('phone') phone: string) {
    return this.authService.checkUserStatus(phone);
  }

  @Post('login-password')
  @ApiOperation({ summary: 'Login with password' })
  async loginWithPassword(@Body() loginDto: LoginDto) {
    return this.authService.loginWithPassword(loginDto);
  }

  @Post('register-password')
  @ApiOperation({ summary: 'Register with password' })
  async registerWithPassword(@Body() loginDto: LoginDto) {
    return this.authService.registerWithPassword(loginDto);
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

  @UseGuards(AuthGuard('jwt'))
  @Post('update-profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Return updated user profile.', type: UserProfileDto })
  async updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.sub, updateProfileDto);
  }
}
