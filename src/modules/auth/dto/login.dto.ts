import { IsString, IsNotEmpty, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '03001234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+92|0)?[0-9]{10}$/, {
    message: 'Mobile number must be a valid Pakistani mobile number',
  })
  mobileNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
