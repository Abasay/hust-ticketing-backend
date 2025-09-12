import { ApiProperty } from '@nestjs/swagger';

export class LogoutResDto {
  @ApiProperty({ example: 'Logout successful' })
  message: string;
}
