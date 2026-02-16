import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './payment.entity';
import { LoggingService } from '../logging/logging.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private loggingService: LoggingService,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const transactionId = this.generateTransactionId();

    const payment = this.paymentsRepository.create({
      ...createPaymentDto,
      transactionId,
    });

    const savedPayment = await this.paymentsRepository.save(payment);

    this.loggingService.logPayment({
      paymentId: savedPayment.id,
      transactionId: savedPayment.transactionId,
      method: savedPayment.method,
      amount: savedPayment.amount,
      status: savedPayment.status,
    });

    return savedPayment;
  }

  async findAll(ledgerId?: string): Promise<Payment[]> {
    const where = ledgerId ? { ledgerId } : {};
    return this.paymentsRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Payment> {
    return this.paymentsRepository.findOne({ where: { id } });
  }

  async updateStatus(
    id: string,
    status: PaymentStatus,
    gatewayResponse?: string,
  ): Promise<Payment> {
    const payment = await this.findOne(id);
    payment.status = status;
    if (gatewayResponse) {
      payment.gatewayResponse = gatewayResponse;
    }

    const updatedPayment = await this.paymentsRepository.save(payment);

    this.loggingService.logPayment({
      paymentId: updatedPayment.id,
      transactionId: updatedPayment.transactionId,
      status: updatedPayment.status,
      action: 'status_updated',
    });

    return updatedPayment;
  }

  private generateTransactionId(): string {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(4).toString('hex');
    return `TXN${timestamp}${random}`.toUpperCase();
  }

  // Placeholder for Easypaisa integration
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async processEasypaisaPayment(_amount: number, _phoneNumber: string): Promise<any> {
    // TODO: Implement actual Easypaisa API integration
    this.loggingService.log('Easypaisa payment processing initiated');
    return {
      success: false,
      message: 'Easypaisa integration pending',
    };
  }

  // Placeholder for JazzCash integration
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async processJazzCashPayment(_amount: number, _phoneNumber: string): Promise<any> {
    // TODO: Implement actual JazzCash API integration
    this.loggingService.log('JazzCash payment processing initiated');
    return {
      success: false,
      message: 'JazzCash integration pending',
    };
  }
}
