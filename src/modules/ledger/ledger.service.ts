import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ledger } from './ledger.entity';
import { CreateLedgerDto } from './dto/create-ledger.dto';
import { UpdateLedgerDto } from './dto/update-ledger.dto';

@Injectable()
export class LedgerService {
  constructor(
    @InjectRepository(Ledger)
    private ledgerRepository: Repository<Ledger>,
  ) {}

  async create(createLedgerDto: CreateLedgerDto, tenantId: string): Promise<Ledger> {
    const existingLedger = await this.ledgerRepository.findOne({
      where: {
        customerMobile: createLedgerDto.customerMobile,
        tenantId,
      },
    });

    if (existingLedger) {
      throw new ConflictException('Ledger with this mobile number already exists');
    }

    const ledger = this.ledgerRepository.create({
      ...createLedgerDto,
      tenantId,
    });

    return this.ledgerRepository.save(ledger);
  }

  async findAll(tenantId: string): Promise<Ledger[]> {
    return this.ledgerRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Ledger> {
    const ledger = await this.ledgerRepository.findOne({
      where: { id, tenantId },
      relations: ['transactions'],
    });

    if (!ledger) {
      throw new NotFoundException('Ledger not found');
    }

    return ledger;
  }

  async findByMobile(customerMobile: string, tenantId: string): Promise<Ledger> {
    return this.ledgerRepository.findOne({
      where: { customerMobile, tenantId },
    });
  }

  async update(id: string, updateLedgerDto: UpdateLedgerDto, tenantId: string): Promise<Ledger> {
    const ledger = await this.findOne(id, tenantId);
    Object.assign(ledger, updateLedgerDto);
    return this.ledgerRepository.save(ledger);
  }

  async updateBalance(id: string, amount: number): Promise<void> {
    await this.ledgerRepository
      .createQueryBuilder()
      .update(Ledger)
      .set({ balance: () => `balance + ${amount}` })
      .where('id = :id', { id })
      .execute();
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const ledger = await this.findOne(id, tenantId);
    await this.ledgerRepository.remove(ledger);
  }

  async getBalance(id: string, tenantId: string): Promise<number> {
    const ledger = await this.findOne(id, tenantId);
    return Number(ledger.balance);
  }
}
