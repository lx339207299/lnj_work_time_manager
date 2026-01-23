
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
    const user = await this.usersService.findOne(loginDto.phone);
    
    // If user exists, try login
    if (user) {
        if (!(await bcrypt.compare(loginDto.password || '', user.password))) {
             throw new UnauthorizedException('密码错误');
        }
        
        const payload = { phone: user.phone, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                name: user.name,
                role: 'user',
                avatar: user.avatar,
                phone: user.phone
            },
            isNewUser: false
        };
    }

    // If user does not exist, register
    const newUser = await this.usersService.create({
        phone: loginDto.phone,
        password: loginDto.password || '123456',
        name: `用户${loginDto.phone.slice(-4)}`,
        avatar: ''
    });

    const payload = { phone: newUser.phone, sub: newUser.id };
    return {
        access_token: this.jwtService.sign(payload),
        user: {
            id: newUser.id,
            name: newUser.name,
            role: 'user',
            avatar: newUser.avatar,
            phone: newUser.phone
        },
        isNewUser: false
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

  async getUserProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) return null;
    
    // You might want to remove sensitive info like password
    const { password, ...result } = user;
    return result;
  }
}
