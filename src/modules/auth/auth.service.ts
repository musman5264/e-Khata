import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { LoggingService } from '../logging/logging.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private sessionsService: SessionsService,
    private jwtService: JwtService,
    private loggingService: LoggingService,
  ) {}

  async validateUser(mobileNumber: string, password: string): Promise<any> {
    const user = await this.usersService.findByMobileNumber(mobileNumber);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto, deviceInfo: any) {
    const user = await this.validateUser(loginDto.mobileNumber, loginDto.password);
    
    if (!user) {
      this.loggingService.logAuth({
        action: 'login_failed',
        mobileNumber: loginDto.mobileNumber,
        reason: 'Invalid credentials',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      this.loggingService.logAuth({
        action: 'login_failed',
        userId: user.id,
        reason: 'User inactive',
      });
      throw new UnauthorizedException('User account is inactive');
    }

    const payload = { sub: user.id, mobileNumber: user.mobileNumber, role: user.role };
    const token = this.jwtService.sign(payload);

    // Create session
    await this.sessionsService.create({
      userId: user.id,
      token,
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      deviceInfo: deviceInfo.device,
    });

    this.loggingService.logAuth({
      action: 'login_success',
      userId: user.id,
      mobileNumber: user.mobileNumber,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    this.loggingService.logAuth({
      action: 'register_success',
      userId: user.id,
      mobileNumber: user.mobileNumber,
    });

    const { password, ...result } = user;
    return result;
  }

  async logout(userId: string, token: string) {
    await this.sessionsService.deactivate(userId, token);
    
    this.loggingService.logAuth({
      action: 'logout',
      userId,
    });

    return { message: 'Logged out successfully' };
  }
}
