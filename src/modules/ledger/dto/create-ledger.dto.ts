import { IsString, IsNotEmpty, IsOptional, IsEmail, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLedgerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ example: '03001234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+92|0)?[0-9]{10}$/, {
    message: 'Customer mobile must be a valid Pakistani mobile number',
  })
  customerMobile: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;
}
