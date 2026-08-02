import { IsUUID, IsEnum, IsNumber, IsPositive, IsOptional, IsString, MaxLength, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@ally/shared-types';

export class CreatePaymentDto {
  @ApiProperty()
  @IsUUID()
  fromAccountId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  toRoutingNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  toAccountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  toInternalAccountId?: string;

  @ApiProperty({ enum: ['ach', 'wire', 'internal'] })
  @IsEnum(['ach', 'wire', 'internal'])
  method: PaymentMethod;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ maxLength: 140 })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  memo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;
}
