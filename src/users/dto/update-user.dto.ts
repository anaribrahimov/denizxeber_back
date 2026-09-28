import { Expose, Transform, Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsBoolean, IsEmpty, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Matches, MaxLength, MinLength, ValidateIf } from "class-validator";
// import { IsMatch } from "../../common/validators/is-match.validator.js";

export class UpdateUserDTO {

  @ValidateIf((o, value) => value !== undefined)
  @Transform(({ value }) => typeof value === 'string' ? value?.trim() : value)
  @IsString({ message: 'must be string' })
  @IsNotEmpty({ message: 'must not be empty' })
  @MaxLength(100, { message: 'must be shorter than or equal to 100 characters' })
  @Matches(
    /^(?=.*\p{L})[\p{L}\p{M}\p{N}'\- ]+$/u,
    {
      message: 'Can only contain letters, numbers, spaces, hyphens (-), and apostrophes (\').',
      validateIf(object, value) {
        return typeof value === 'string' ? !!value.length : false;
      },
    }
  )
  firstName?: string;

  @ValidateIf((o, value) => value !== undefined)
  @Transform(({ value }) => typeof value === 'string' ? value?.trim() : value)
  @IsString({ message: 'must be string' })
  @IsNotEmpty({ message: 'must not be empty' })
  @MaxLength(100, { message: 'must be shorter than or equal to 100 characters' })
  @Matches(
    /^(?=.*\p{L})[\p{L}\p{M}\p{N}'\- ]+$/u,
    {
      message: 'Can only contain letters, numbers, spaces, hyphens (-), and apostrophes (\').',
      validateIf(object, value) {
        return typeof value === 'string' ? !!value.length : false;
      },
    }
  )
  lastName?: string;

  @ValidateIf((o, value) => value !== undefined)
  @IsString()
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
  password?: string;

  // @Expose({ name: 'password_confirmation' })
  // @ValidateIf((o) => o.password !== undefined)
  // @IsString()
  // @MinLength(8)
  // @MaxLength(20)
  // @IsMatch('password', { message: 'Password confirmation does not match password' })
  // passwordConfirmation?: string;

  @ValidateIf((o, value) => value !== undefined)
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
  @IsIn([1, 2], { message: 'must be either 1 or 2'})
  roleId?: number;

  @ValidateIf((o, value) => value !== undefined)
  @IsArray()
  // @IsNumber({}, { each: true }) // Ensures every transformed element is a number
  @IsIn([1, 2, 3, 4, 5, 6], { message: 'Each element can be either 1, 2, 3, 4, 5, 6', each: true })
  @ArrayNotEmpty({ message: 'should not be empty' })
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (!Array.isArray(value)) return value;
    // 3. Map to numbers and strip duplicates, ignoring null/undefined elements inside the array
    const cleanedNumbers = value.map(Number);
    return Array.from(new Set(cleanedNumbers));
  })
  langIds?: number[];

  @ValidateIf((o, value) => value !== undefined)
  @IsBoolean({ message: 'should be boolean' })
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
  removeProfileImage?: boolean;
}
