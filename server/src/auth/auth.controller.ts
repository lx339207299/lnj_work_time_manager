
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterWithPasswordDto } from './dto/register-with-password.dto';
import { AuthResponseDto, UserProfileDto } from './dto/auth-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
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
  async checkUserStatus(@Body() body: { phone: string }) {
    return this.authService.checkUserStatus(body.phone);
  }

  @Post('login-password')
  @ApiOperation({ summary: 'Login with password' })
  async loginWithPassword(@Body() loginDto: LoginDto) {
    if (!loginDto.phone) {
       throw new Error('请输入手机号');
    }
    return this.authService.loginWithPassword(loginDto);
  }

  @Post('register-password')
  @ApiOperation({ summary: 'Register with password' })
  async registerWithPassword(@Body() registerDto: RegisterWithPasswordDto) {
    return this.authService.registerWithPassword(registerDto as LoginDto);
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

  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  @ApiResponse({ status: 400, description: 'Old password incorrect or invalid data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async changePassword(@Request() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, changePasswordDto);
  }

  // --- WeChat Login ---

  @Post('wechat-login')
  @ApiOperation({ summary: 'WeChat Mini Program login' })
  async wechatLogin(@Body() body: { code: string }) {
    if (!body.code) throw new Error('缺少 code 参数');
    return this.authService.wechatLogin(body.code);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('bind-phone')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bind phone number after WeChat login' })
  async bindPhone(@Request() req: any, @Body() body: { code: string }) {
    if (!body.code) throw new Error('缺少 code 参数');
    return this.authService.bindPhoneByCode(req.user.sub, body.code);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('bind-phone-manual')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bind phone number manually (fallback for personal mini programs)' })
  async bindPhoneManual(@Request() req: any, @Body() body: { phone: string }) {
    if (!body.phone) throw new Error('缺少 phone 参数');
    return this.authService.bindPhoneManual(req.user.sub, body.phone);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('bind-wechat')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bind WeChat account to current user' })
  async bindWechat(@Request() req: any, @Body() body: { code: string }) {
    if (!body.code) throw new Error('缺少 code 参数');
    return this.authService.bindWechat(req.user.sub, body.code);
  }
}
