import { Transform } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from "class-validator";
// import { IsMatch } from "../../common/validators/is-match.validator.js";

export class UpdateProfileRequestDto {

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
