import { ApiProperty } from '@nestjs/swagger';

export class RefreshResDto {
  @ApiProperty({ description: 'The new access token' })
  accessToken: string;
}
