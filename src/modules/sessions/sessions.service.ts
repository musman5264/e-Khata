import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './session.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionsRepository: Repository<Session>,
  ) {}

  async create(data: {
    userId: string;
    token: string;
    ipAddress: string;
    userAgent: string;
    deviceInfo: any;
  }): Promise<Session> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const session = this.sessionsRepository.create({
      ...data,
      expiresAt,
    });

    return this.sessionsRepository.save(session);
  }

  async findByToken(token: string): Promise<Session> {
    return this.sessionsRepository.findOne({
      where: { token, isActive: true },
    });
  }

  async findUserSessions(userId: string): Promise<Session[]> {
    return this.sessionsRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async deactivate(userId: string, token: string): Promise<void> {
    await this.sessionsRepository.update(
      { userId, token },
      { isActive: false },
    );
  }

  async deactivateAll(userId: string): Promise<void> {
    await this.sessionsRepository.update(
      { userId, isActive: true },
      { isActive: false },
    );
  }

  async cleanExpired(): Promise<void> {
    await this.sessionsRepository
      .createQueryBuilder()
      .update(Session)
      .set({ isActive: false })
      .where('expiresAt < :now', { now: new Date() })
      .execute();
  }
}
