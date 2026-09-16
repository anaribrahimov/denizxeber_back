import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength
} from 'class-validator';
import { Expose, Transform } from 'class-transformer';
// import { IsMatch } from '../../common/validators/is-match.validator.js';

export class CreateUserDto {

  @Expose({ name: 'first_name' })
  @Transform(({ value }) => typeof value === 'string' ? value?.trim() : value)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(
    /^[a-zA-Z0-9\s]+$/,
    {
      message: 'Special characters not allowed',
      validateIf(object, value) {
        return typeof value === 'string' ? !!value.length : false;
      },
    }
  )
  firstName: string;

  @Expose({ name: 'last_name' })
  @Transform(({ value }) => typeof value === 'string' ? value?.trim() : value)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(
    /^[a-zA-Z0-9\s]+$/,
    {
      message: 'Special characters not allowed',
      validateIf(object, value) {
        return typeof value === 'string' ? !!value.length : false;
      },
    }
  )
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
  @Matches(
    // /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/, // allow spaces
    {
      message: 'Password must have at least one uppercase letter,'
        + ' one lowercase letter, one digit, one special character,'
        + ' and a minimum length of 8 characters'
    }
  )
  password: string;

  // @Expose({ name: 'password_confirmation' })
  // @IsString()
  // @IsNotEmpty()
  // @MinLength(8)
  // @MaxLength(20)
  // @IsMatch('password', { message: 'Password confirmation does not match password' })
  // passwordConfirmation: string;

  @Expose({ name: 'role_id' })
  @Transform(({ value }) => {
    if (value === undefined || value === null || typeof value !== 'string') return value;
    // Strict regex check: Only allow strings that contain digits only
    // This blocks values like "42.99", "42px", or "abc" immediately
    if (!/^\d+$/.test(String(value))) {
      return NaN; // Returning NaN will cause @IsInt to fail and throw an error
    }
    return parseInt(value, 10);
  })
  @IsInt()
  @IsNotEmpty()
  @IsIn([1, 2], { message: 'role_id must be either 1 or 2' })
  roleId: number;

  @Expose({ name: 'lang_ids' })
  @IsArray()
  @ArrayNotEmpty({ message: 'lang_ids should not be empty' })
  @IsIn([1, 2, 3, 4, 5, 6], { message: 'Each lang_id can be either 1, 2, 3, 4, 5, 6', each: true })
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (!Array.isArray(value)) return value;
    // 3. Map to numbers and strip duplicates, ignoring null/undefined elements inside the array
    const cleanedNumbers = value.map(Number);
    return Array.from(new Set(cleanedNumbers));
  })
  langIds: number[];

  @Expose({ name: 'is_active' })
  @IsOptional()
  @IsBoolean({ message: 'is_active should be boolean' })
  @IsIn([true, false])
  @Transform(({ value }) => {
    if (value == undefined) return undefined;

    // 2. Handle actual booleans or string variants
    if (value === true || value === 'true' || value === '1' || value === 1) return true;
    if (value === false || value === 'false' || value === '0' || value === 0) return false;

    // 3. Return the original invalid value so @IsBoolean catches it and throws an error
    return value;
  })
  isActive?: boolean;
}
