import { Expose, Transform, Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsBoolean, IsEmpty, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Matches, MaxLength, MinLength, ValidateIf } from "class-validator";
import { IsMatch } from "../../common/validators/is-match.validator.js";

export class UpdateUserDTO {

  @Expose({ name: 'first_name' })
  @ValidateIf((o, value) => value !== undefined)
  @IsString({ message: 'first_name must be string' })
  @IsNotEmpty({ message: 'first_name must not be empty' })
  @MaxLength(100, { message: 'first_name must be shorter than or equal to 100 characters' })
  firstName?: string;

  @Expose({ name: 'last_name' })
  @ValidateIf((o, value) => value !== undefined)
  @IsString({ message: 'last_name must be string' })
  @IsNotEmpty({ message: 'last_name must not be empty' })
  @MaxLength(100, { message: 'last_name must be shorter than or equal to 100 characters' })
  lastName?: string;

  @ValidateIf((o, value) => value !== undefined)
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  password?: string;

  @Expose({ name: 'password_confirmation' })
  @ValidateIf((o) => o.password !== undefined)
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @IsMatch('password', { message: 'Password confirmation does not match password' })
  passwordConfirmation?: string;

  @Expose({ name: 'role_id' })
  @ValidateIf((o, value) => value !== undefined)
  @Transform(({ value }) => {
    if (value === null || value === '' || value?.trim() === '') return null;
    if (value === undefined) return undefined;
    // Strict regex check: Only allow strings that contain digits only
    // This blocks values like "42.99", "42px", or "abc" immediately
    if (!/^\d+$/.test(String(value))) {
      return NaN; // Returning NaN will cause @IsInt to fail and throw an error
    }
    return parseInt(value, 10);
  })
  // @IsInt()
  @IsIn([1, 2], { message: 'role_id must be either 1 or 2'})
  roleId?: number;

  @Expose({ name: 'lang_ids' })
  @ValidateIf((o, value) => value !== undefined)
  @IsArray()
  // @IsNumber({}, { each: true }) // Ensures every transformed element is a number
  @IsIn([1, 2, 3, 4, 5, 6], { message: 'Each lang_id can be either 1, 2, 3, 4, 5, 6', each: true })
  @ArrayNotEmpty({ message: 'lang_ids should not be empty' })
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (!Array.isArray(value)) return value;
    // 3. Map to numbers and strip duplicates, ignoring null/undefined elements inside the array
    const cleanedNumbers = value.map(Number);
    return Array.from(new Set(cleanedNumbers));
  })
  langIds?: number[];

  @Expose({ name: 'is_active' })
  @ValidateIf((o, value) => value !== undefined)
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

  @Expose({ name: 'remove_profile_image' })
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
