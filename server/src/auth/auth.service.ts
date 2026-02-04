
import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => OrganizationsService))
    private organizationsService: OrganizationsService,
  ) {}

  async validateUser(phone: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(phone);
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
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
      throw new Error('验证码错误');
    }
    const user = await this.usersService.findOne(loginDto.phone);
    
    // If user exists, try login
    if (user) {
        const userProfile = await this.getUserProfile(user.id as any);
        const payload = { 
          phone: user.phone, 
          sub: user.id as any,
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
        name: '',
        avatar: ''
    } as any);

    // Create default organization
    await this.organizationsService.create(newUser.id as any, { name: '默认组织' });

    const userProfile = await this.getUserProfile(newUser.id as any);

    const payload = { 
      phone: newUser.phone, 
      sub: newUser.id as any,
      orgId: userProfile?.currentOrg?.id || null 
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
        // password: '', // Default password if not provided
        name: registerDto.name,
        avatar: registerDto.avatar
    } as any);

    // Create default organization
    await this.organizationsService.create(user.id as any, { name: '默认组织' });
    
    // Auto login
    const userProfile = await this.getUserProfile(user.id as any);
    
    const payload = { 
      phone: user.phone, 
      sub: user.id as any,
      orgId: userProfile?.currentOrg?.id || null 
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: userProfile
    };
  }

  async getUserProfile(userId: number) {
    const user = await this.usersService.findByIdWithOrgs(userId);
    if (!user) return null;
    
    const { password, ...result } = user;
    
    let role = 'user';
    if (user.currentOrgId && (user as any).memberships) {
        const membership = (user as any).memberships.find((m: any) => m.orgId === user.currentOrgId);
        if (membership) {
            role = membership.role;
        }
    }
    
    const userProfile = {
      ...result,
      // 返回currentOrg
      currentOrg: (user as any).currentOrg || null,
      role: role,
    };
    
    return userProfile;
  }

  async updateProfile(userId: number, data: any) {
    return this.usersService.update(userId, data);
  }

  async issueTokenForUser(userId: number) {
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
