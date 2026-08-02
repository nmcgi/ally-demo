import { IsEnum, IsNumber, IsPositive, IsInt, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoanType, EmploymentType } from '@ally/shared-types';

export class CreateLoanApplicationDto {
  @ApiProperty({ enum: ['auto', 'personal', 'home_equity', 'mortgage'] })
  @IsEnum(['auto', 'personal', 'home_equity', 'mortgage'])
  type: LoanType;

  @ApiProperty({ minimum: 0.01 })
  @IsNumber()
  @IsPositive()
  requestedAmount: number;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  termMonths: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  purpose: string;

  @ApiProperty()
  @IsNumber()
  annualIncome: number;

  @ApiProperty({ enum: ['employed', 'self_employed', 'unemployed', 'retired', 'student'] })
  @IsEnum(['employed', 'self_employed', 'unemployed', 'retired', 'student'])
  employmentType: EmploymentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employer?: string;
}
