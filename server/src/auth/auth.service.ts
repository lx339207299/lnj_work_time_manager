
import { Injectable, UnauthorizedException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
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

  async checkUserStatus(phone: string) {
    if (!phone) {
        throw new BadRequestException('手机号不能为空');
    }
    const user = await this.usersService.findOne(phone);
    return {
      exists: !!user,
      hasPassword: !!(user && user.password),
    };
  }

  async loginWithPassword(loginDto: LoginDto) {
    if (!loginDto.phone) {
        throw new BadRequestException('手机号不能为空');
    }
    const user = await this.validateUser(loginDto.phone, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const userProfile = await this.getUserProfile(user.id);
    const payload = {
      phone: user.phone,
      sub: user.id,
      orgId: userProfile?.currentOrg?.id || null,
      systemRole: user.systemRole || 'user',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: userProfile,
      isNewUser: false,
    };
  }

  async registerWithPassword(loginDto: LoginDto) {
    let user = await this.usersService.findOne(loginDto.phone);
    
    if (user && user.password) {
      // 实际上如果用户有密码了，直接验证并登录即可，不用抛出异常让前端再去调用一遍
      const isValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isValid) {
        throw new UnauthorizedException('手机号或密码错误');
      }
    } else if (user) {
      // User exists but no password (e.g. from an invitation or older migration)
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(loginDto.password, salt);
      user = await this.usersService.update(user.id, {
        password: hashedPassword,
      });
    } else {
      // New user
      user = await this.usersService.create({
        phone: loginDto.phone,
        password: loginDto.password,
        name: '',
        avatar: '',
      } as any);

      // Create default organization
      await this.organizationsService.create(user.id as any, { name: '默认组织' });
    }

    const userProfile = await this.getUserProfile(user.id as any);
    const payload = {
      phone: user.phone,
      sub: user.id as any,
      orgId: userProfile?.currentOrg?.id || null,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: userProfile,
      isNewUser: !user.name, // If name is empty, consider it as a "new" user profile
    };
  }

  async loginOrRegister(loginDto: LoginDto) {
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

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (!user.password) {
      throw new BadRequestException('用户未设置密码');
    }

    const isMatch = await bcrypt.compare(changePasswordDto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('原密码错误');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, salt);

    await this.usersService.update(userId, {
      password: hashedPassword,
    });

    return { message: '密码修改成功' };
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

  // --- WeChat Login ---

  async wechatLogin(code: string) {
    // 1. 用 code 换取 openid（GET 请求）
    const params = new URLSearchParams({
      appid: process.env.WX_APPID!,
      secret: process.env.WX_SECRET!,
      js_code: code,
      grant_type: 'authorization_code',
    });
    const wxRes = await fetch(`https://api.weixin.qq.com/sns/jscode2session?${params}`);
    const wxData = await wxRes.json() as any;
    
    if (wxData.errcode) {
      throw new BadRequestException('微信登录失败: ' + (wxData.errmsg || '未知错误'));
    }

    const { openid, unionid } = wxData;

    // 2. 查找是否已有此 openid 的用户
    let user = await this.usersService.findByOpenid(openid);
    
    if (user) {
      // 已有 openid 用户：检查是否完成注册
      const userProfile = await this.getUserProfile(user.id);
      const payload = {
        phone: user.phone,
        sub: user.id,
        orgId: userProfile?.currentOrg?.id || null,
        systemRole: user.systemRole || 'user',
      };
      return {
        access_token: this.jwtService.sign(payload),
        user: userProfile,
        isNewUser: !user.phone, // 无手机号视为新用户，需走绑定流程
        openid,
      };
    }

    // 3. 新用户：创建占位用户（暂无手机号）
    user = await this.usersService.create({
      phone: null,
      name: '',
      openid,
      unionid: unionid || null,
      avatar: '',
    } as any);

    // 创建默认组织
    await this.organizationsService.create(user.id as any, { name: '默认组织' });

    const userProfile = await this.getUserProfile(user.id as any);
    const payload = {
      phone: null,
      sub: user.id as any,
      orgId: userProfile?.currentOrg?.id || null,
      systemRole: 'user',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: userProfile,
      isNewUser: true,
      openid,
    };
  }

  async bindPhoneByCode(userId: number, code: string) {
    // 1. 获取微信 access_token
    const tokenRes = await fetch(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.WX_APPID}&secret=${process.env.WX_SECRET}`
    );
    const tokenData = await tokenRes.json() as any;
    if (tokenData.errcode) {
      throw new BadRequestException('获取微信token失败: ' + (tokenData.errmsg || '未知错误'));
    }
    const accessToken = tokenData.access_token;

    // 2. 用 code 换取手机号
    const phoneRes = await fetch(
      `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      }
    );
    const phoneData = await phoneRes.json() as any;
    if (phoneData.errcode !== 0) {
      throw new BadRequestException('获取手机号失败: ' + (phoneData.errmsg || '未知错误'));
    }

    const phone = phoneData.phone_info?.purePhoneNumber || phoneData.phone_info?.phoneNumber;
    if (!phone) {
      throw new BadRequestException('未能获取到手机号');
    }

    // 3. 检查手机号是否已被占用
    const existing = await this.usersService.findOne(phone);
    if (existing && existing.id !== userId) {
      throw new BadRequestException('该手机号已被其他用户绑定');
    }

    await this.usersService.update(userId, { phone });

    // 4. 重新签发 token（含 phone）
    const user = await this.usersService.findById(userId);
    const userProfile = await this.getUserProfile(userId);
    const payload = {
      phone: user.phone,
      sub: user.id,
      orgId: userProfile?.currentOrg?.id || null,
      systemRole: user.systemRole || 'user',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: userProfile,
    };
  }

  async bindPhoneManual(userId: number, phone: string) {
    if (!phone) {
      throw new BadRequestException('手机号不能为空');
    }

    // 检查手机号是否已被占用
    const existing = await this.usersService.findOne(phone);
    if (existing && existing.id !== userId) {
      throw new BadRequestException('该手机号已被其他用户绑定');
    }

    await this.usersService.update(userId, { phone });

    // 重新签发 token（含 phone）
    const user = await this.usersService.findById(userId);
    const userProfile = await this.getUserProfile(userId);
    const payload = {
      phone: user.phone,
      sub: user.id,
      orgId: userProfile?.currentOrg?.id || null,
      systemRole: user.systemRole || 'user',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: userProfile,
    };
  }
}
