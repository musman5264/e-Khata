import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { CreateLedgerDto } from './dto/create-ledger.dto';
import { UpdateLedgerDto } from './dto/update-ledger.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Ledger')
@Controller('ledger')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ledger for a customer' })
  create(@Body() createLedgerDto: CreateLedgerDto, @Request() req) {
    return this.ledgerService.create(createLedgerDto, req.user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all ledgers in tenant' })
  findAll(@Request() req) {
    return this.ledgerService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ledger by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.ledgerService.findOne(id, req.user.tenantId);
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get ledger balance' })
  getBalance(@Param('id') id: string, @Request() req) {
    return this.ledgerService.getBalance(id, req.user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ledger' })
  update(@Param('id') id: string, @Body() updateLedgerDto: UpdateLedgerDto, @Request() req) {
    return this.ledgerService.update(id, updateLedgerDto, req.user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ledger' })
  remove(@Param('id') id: string, @Request() req) {
    return this.ledgerService.remove(id, req.user.tenantId);
  }
}
