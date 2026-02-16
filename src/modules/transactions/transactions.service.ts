import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction, TransactionType } from './transaction.entity';
import { LedgerService } from '../ledger/ledger.service';
import { LoggingService } from '../logging/logging.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private ledgerService: LedgerService,
    private loggingService: LoggingService,
    private dataSource: DataSource,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
    tenantId: string,
  ): Promise<Transaction> {
    const ledger = await this.ledgerService.findOne(
      createTransactionDto.ledgerId,
      tenantId,
    );

    if (!ledger) {
      throw new NotFoundException('Ledger not found');
    }

    // Use transaction to ensure data consistency
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const currentBalance = Number(ledger.balance);
      const amount = Number(createTransactionDto.amount);

      // Calculate new balance based on transaction type
      let balanceChange: number;
      if (createTransactionDto.type === TransactionType.DEBIT) {
        balanceChange = amount; // Customer owes money (increase balance)
      } else {
        balanceChange = -amount; // Customer paid money (decrease balance)
      }

      const newBalance = currentBalance + balanceChange;

      // Create transaction
      const transaction = this.transactionsRepository.create({
        ...createTransactionDto,
        balanceAfter: newBalance,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      // Update ledger balance
      await this.ledgerService.updateBalance(ledger.id, balanceChange);

      await queryRunner.commitTransaction();

      this.loggingService.logTransaction({
        transactionId: savedTransaction.id,
        ledgerId: ledger.id,
        type: createTransactionDto.type,
        amount: createTransactionDto.amount,
        balanceAfter: newBalance,
      });

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.loggingService.error('Transaction failed', error.stack, 'TransactionsService');
      throw new BadRequestException('Failed to create transaction');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(ledgerId: string, tenantId: string): Promise<Transaction[]> {
    // Verify ledger belongs to tenant
    await this.ledgerService.findOne(ledgerId, tenantId);

    return this.transactionsRepository.find({
      where: { ledgerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
      relations: ['ledger'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async getStatistics(ledgerId: string, tenantId: string) {
    await this.ledgerService.findOne(ledgerId, tenantId);

    const result = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('SUM(CASE WHEN type = :debit THEN amount ELSE 0 END)', 'totalDebit')
      .addSelect('SUM(CASE WHEN type = :credit THEN amount ELSE 0 END)', 'totalCredit')
      .addSelect('COUNT(*)', 'totalTransactions')
      .where('transaction.ledgerId = :ledgerId', { ledgerId })
      .setParameter('debit', TransactionType.DEBIT)
      .setParameter('credit', TransactionType.CREDIT)
      .getRawOne();

    return {
      totalDebit: Number(result.totalDebit) || 0,
      totalCredit: Number(result.totalCredit) || 0,
      totalTransactions: Number(result.totalTransactions) || 0,
      netBalance: (Number(result.totalDebit) || 0) - (Number(result.totalCredit) || 0),
    };
  }
}
