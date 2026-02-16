import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction (debit or credit)' })
  create(@Body() createTransactionDto: CreateTransactionDto, @Request() req) {
    return this.transactionsService.create(createTransactionDto, req.user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions for a ledger' })
  findAll(@Query('ledgerId') ledgerId: string, @Request() req) {
    return this.transactionsService.findAll(ledgerId, req.user.tenantId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get transaction statistics for a ledger' })
  getStatistics(@Query('ledgerId') ledgerId: string, @Request() req) {
    return this.transactionsService.getStatistics(ledgerId, req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }
}
