import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { mobileNumber: createUserDto.mobileNumber },
    });

    if (existingUser) {
      throw new ConflictException('Mobile number already exists');
    }

    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findAll(tenantId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { tenantId },
      relations: ['tenant'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['tenant'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByMobileNumber(mobileNumber: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { mobileNumber },
      relations: ['tenant'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    await this.usersRepository.update(userId, { fcmToken });
  }
}
