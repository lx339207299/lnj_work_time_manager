
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

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findOne(loginDto.phone);
    if (!user || !(await bcrypt.compare(loginDto.password || '', user.password))) {
      throw new UnauthorizedException();
    }
    const payload = { phone: user.phone, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
          id: user.id,
          name: user.name,
          role: 'user', // Default role for now, real role is in OrgMember
          avatar: user.avatar
      }
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
        password: registerDto.password || '123456', // Default password if not provided
        name: registerDto.name,
        avatar: registerDto.avatar
    });
    
    // Auto login
    const payload = { phone: user.phone, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
          id: user.id,
          name: user.name,
          role: 'user',
          avatar: user.avatar
      }
    };
  }
}
