import { 
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail, 
  IsNotEmpty, 
  IsNumber, 
  IsOptional, 
  isString, 
  IsString, 
  Matches, 
  MaxLength, 
  MinLength } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { IsMatch } from '../../common/validators/is-match.validator.js';

export class CreateUserDto {

  @Expose({ name: 'first_name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @Expose({ name: 'last_name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  @IsNotEmpty({
    message: 'Email is required',
  })
  @MaxLength(255)
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  password: string;

  @Expose({ name: 'password_confirmation' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  @IsMatch('password', { message: 'Password confirmation does not match password' })
  passwordConfirmation: string;

  @Expose({ name: 'role_id' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'role_id must be a number' })
  roleId: number;

  @Expose({ name: 'lang_ids' })
  @IsArray()
  @IsNumber({}, { each: true }) // Ensures every transformed element is a number
  // @Type(() => Number)           // Transforms array of strings to array of numbers
  @ArrayNotEmpty()
  // @Matches(/^\d+$/, { each: true, message: 'Each lang_id must be a number' })
  @Transform(({ value }) => {
    // 1. If it's null or undefined, return it as-is so @IsOptional can catch it
    if (value === null || value === undefined) {
      return value; 
    }

    // 2. Ensure we are dealing with an array
    let arrayValue = Array.isArray(value) 
      ? value 
      : typeof value === 'string' ? value.split(',') : [];

    // 3. Map to numbers and strip duplicates, ignoring null/undefined elements inside the array
    const cleanedNumbers = arrayValue
      .filter((item) => item !== null && item !== undefined && item !== '')
      .map(Number);

    return Array.from(new Set(cleanedNumbers));
  })
  langIds: number[];

  @Expose({ name: 'is_active' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    // 1. Pass through null/undefined so @IsOptional can handle it
    if (value === null || value === undefined || value === '') return undefined;

    // 2. Handle actual booleans or string variants
    if (value === true || value === 'true' || value === '1' || value === 1) return true;
    if (value === false || value === 'false' || value === '0' || value === 0) return false;

    // 3. Return the original invalid value so @IsBoolean catches it and throws an error
    return value; 
  })
  isActive?: boolean;
}
