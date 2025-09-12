import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SignupReqDto {
  @ApiProperty({ description: 'Email address of the user', example: 'abdulsalamasheem@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'First name of the user', example: 'John' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'last name of the user', example: 'John' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({
    description:
      'Password for the user account. Must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one special character.',
    example: 'MySecure@Password!#',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak',
  })
  password: string;

  // Role will be automatically determined based on admin check and authorized users

  // @ApiProperty({
  //   description: 'Phone number of the user',
  //   example: { callingCode: '+1', number: '1234567890' },
  // })
  // @IsNotEmpty({ message: 'Phone number is required' })
  // phoneNumber: {
  //   callingCode: string;
  //   number: string;
  // };
}
