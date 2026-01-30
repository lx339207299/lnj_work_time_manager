
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(phone: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(phone);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async loginOrRegister(loginDto: LoginDto) {
    console.log('验证码===', loginDto.code);
    
    // For fixed verification code '123456', direct string comparison is sufficient.
    // bcrypt.compare is for hashing passwords.
    if (loginDto.code !== '123456') {
      throw new UnauthorizedException('验证码错误');
    }
    const user = await this.usersService.findOne(loginDto.phone);
    
    // If user exists, try login
    if (user) {
        const userProfile = await this.getUserProfile(user.id);
        const payload = { 
          phone: user.phone, 
          sub: user.id,
          orgId: userProfile?.currentOrg?.id || null 
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: userProfile,
            isNewUser: false
        };
    }

    // If user does not exist, register
    const newUser = await this.usersService.create({
        phone: loginDto.phone,
        password: '',
        name: '',
        avatar: ''
    });

    const userProfile = await this.getUserProfile(newUser.id);

    const payload = { 
      phone: newUser.phone, 
      sub: newUser.id,
      orgId: null 
    };
    return {
        access_token: this.jwtService.sign(payload),
        user: userProfile,
        isNewUser: true
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user exists
    const existing = await this.usersService.findOne(registerDto.phone);
    if (existing) {
        throw new UnauthorizedException('User already exists');
    }
    
    const user = await this.usersService.create({
        phone: registerDto.phone,
        password: '', // Default password if not provided
        name: registerDto.name,
        avatar: registerDto.avatar
    });
    
    // Auto login
    const userProfile = await this.getUserProfile(user.id);
    
    const payload = { 
      phone: user.phone, 
      sub: user.id,
      orgId: null 
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: userProfile
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.usersService.findByIdWithOrgs(userId);
    if (!user) return null;
    
    const { password, ...result } = user;
    
    let role = 'user';
    // @ts-ignore
    if (user.currentOrgId && user.memberships) {
        // @ts-ignore
        const membership = user.memberships.find(m => m.orgId === user.currentOrgId);
        if (membership) {
            role = membership.role;
        }
    }
    
    const userProfile = {
      ...result,
      // 返回currentOrg
      currentOrg: user.currentOrg || null,
      role: role,
    };
    
    return userProfile;
  }

  async issueTokenForUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('用户不存在');
    const payload = {
      phone: user.phone,
      sub: user.id,
      orgId: (user as any).currentOrgId || null
    };
    return this.jwtService.sign(payload);
  }
}
